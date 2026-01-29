// src/ai/ParallelInference.ts

import type { LLMClient } from './LLMClient';
import type { BackgroundRunner, BackgroundTask } from './BackgroundRunner';

/**
 * 推論タスクの種類
 */
export type InferenceType = 'analysis' | 'decision' | 'evaluation';

/**
 * 推論タスク
 */
export interface InferenceTask {
  /** タスクID */
  id: string;
  /** タスク種類 */
  type: InferenceType;
  /** システムプロンプト */
  systemPrompt?: string;
  /** ユーザーメッセージ（プロンプト） */
  prompt: string;
  /** 使用モデル（省略時はデフォルト） */
  model?: 'haiku' | 'sonnet' | 'opus';
}

/**
 * 推論結果
 */
export interface InferenceResult {
  /** タスクID */
  taskId: string;
  /** 成功したかどうか */
  success: boolean;
  /** 結果（成功時） */
  result?: string;
  /** エラー（失敗時） */
  error?: Error;
  /** レイテンシ（ms） */
  latencyMs: number;
}

/**
 * 内部タスク情報
 */
interface InternalTask {
  inferenceTask: InferenceTask;
  runnerTaskId: string;
  startTime: number;
}

/**
 * 並列推論クラス
 *
 * 複数の推論タスクを並列で実行し、結果を集約する
 */
export class ParallelInference {
  private llmClient: LLMClient;
  private runner: BackgroundRunner;
  private tasks: Map<string, InternalTask> = new Map();
  private completedResults: Map<string, InferenceResult> = new Map();

  constructor(llmClient: LLMClient, runner: BackgroundRunner) {
    this.llmClient = llmClient;
    this.runner = runner;
  }

  /**
   * タスクを並列で送信
   * @param tasks 推論タスクの配列
   * @returns タスクIDの配列
   */
  submitTasks(tasks: InferenceTask[]): string[] {
    const taskIds: string[] = [];

    for (const task of tasks) {
      const startTime = Date.now();

      const backgroundTask: BackgroundTask<string> = {
        execute: async () => {
          const systemPrompt = task.systemPrompt ?? 'You are a helpful assistant.';
          const response = await this.llmClient.send(systemPrompt, task.prompt, {
            model: task.model,
          });
          return response.content;
        },
        onComplete: result => {
          const latencyMs = Date.now() - startTime;
          this.completedResults.set(task.id, {
            taskId: task.id,
            success: true,
            result,
            latencyMs,
          });
        },
        onError: error => {
          const latencyMs = Date.now() - startTime;
          this.completedResults.set(task.id, {
            taskId: task.id,
            success: false,
            error,
            latencyMs,
          });
        },
      };

      const runnerTaskId = this.runner.submit(backgroundTask);

      this.tasks.set(task.id, {
        inferenceTask: task,
        runnerTaskId,
        startTime,
      });

      taskIds.push(task.id);
    }

    return taskIds;
  }

  /**
   * 全タスクの完了を待機
   * @param taskIds タスクIDの配列
   * @param timeout タイムアウト（ms、省略時は無制限）
   * @returns 推論結果の配列
   */
  async awaitAll(taskIds: string[], timeout?: number): Promise<InferenceResult[]> {
    const startTime = Date.now();
    const results: InferenceResult[] = [];

    for (const taskId of taskIds) {
      const internalTask = this.tasks.get(taskId);
      if (!internalTask) {
        results.push({
          taskId,
          success: false,
          error: new Error(`Unknown task: ${taskId}`),
          latencyMs: 0,
        });
        continue;
      }

      // タイムアウトチェック
      if (timeout !== undefined) {
        const elapsed = Date.now() - startTime;
        if (elapsed >= timeout) {
          // 残りのタスクはタイムアウト
          results.push({
            taskId,
            success: false,
            error: new Error('Timeout'),
            latencyMs: elapsed,
          });
          continue;
        }
      }

      // 結果を待機
      try {
        const remainingTimeout =
          timeout !== undefined ? Math.max(0, timeout - (Date.now() - startTime)) : undefined;

        await this.waitForTask(taskId, remainingTimeout);

        const result = this.completedResults.get(taskId);
        if (result) {
          results.push(result);
        } else {
          results.push({
            taskId,
            success: false,
            error: new Error('Result not found'),
            latencyMs: Date.now() - internalTask.startTime,
          });
        }
      } catch (error) {
        results.push({
          taskId,
          success: false,
          error: error instanceof Error ? error : new Error(String(error)),
          latencyMs: Date.now() - internalTask.startTime,
        });
      }
    }

    return results;
  }

  /**
   * 最初に完了したタスクの結果を取得
   * @param taskIds タスクIDの配列
   * @returns 最初に完了した推論結果
   */
  async awaitFirst(taskIds: string[]): Promise<InferenceResult> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        for (const taskId of taskIds) {
          const result = this.completedResults.get(taskId);
          if (result) {
            clearInterval(checkInterval);
            resolve(result);
            return;
          }
        }
      }, 10);
    });
  }

  /**
   * 結果を集約
   * @param results 推論結果の配列
   * @returns 集約された文字列
   */
  aggregateResults(results: InferenceResult[]): string {
    const successfulResults = results
      .filter(r => r.success && r.result)
      .map(r => r.result as string);

    return successfulResults.join('\n\n');
  }

  /**
   * フォールバック付きで実行
   * @param primary メインの処理
   * @param fallback フォールバック処理
   * @param timeout タイムアウト（ms）
   * @returns 結果
   */
  async withFallback<T>(primary: () => Promise<T>, fallback: () => T, timeout: number): Promise<T> {
    try {
      const result = await Promise.race([
        primary(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout)),
      ]);
      return result;
    } catch {
      return fallback();
    }
  }

  /**
   * タスクをキャンセル
   * @param taskId タスクID
   * @returns キャンセルできたかどうか
   */
  cancel(taskId: string): boolean {
    const internalTask = this.tasks.get(taskId);
    if (!internalTask) {
      return false;
    }
    return this.runner.cancel(internalTask.runnerTaskId);
  }

  /**
   * 完了したタスク数を取得
   */
  getCompletedCount(): number {
    return this.completedResults.size;
  }

  /**
   * 完了したタスクをクリア
   */
  clear(): void {
    this.completedResults.clear();
    this.runner.clearCompleted();
  }

  /**
   * タスクの完了を待機
   */
  private async waitForTask(taskId: string, timeout?: number): Promise<void> {
    const internalTask = this.tasks.get(taskId);
    if (!internalTask) {
      throw new Error(`Unknown task: ${taskId}`);
    }

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        // タイムアウトチェック
        if (timeout !== undefined && Date.now() - startTime >= timeout) {
          clearInterval(checkInterval);
          reject(new Error('Timeout'));
          return;
        }

        // 完了チェック
        if (this.completedResults.has(taskId)) {
          clearInterval(checkInterval);
          resolve();
          return;
        }

        // ランナーのステータスチェック
        const status = this.runner.getStatus(internalTask.runnerTaskId);
        if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 10);
    });
  }
}

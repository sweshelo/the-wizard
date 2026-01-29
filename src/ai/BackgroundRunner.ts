// src/ai/BackgroundRunner.ts

/**
 * タスクのステータス
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';

/**
 * バックグラウンドタスク
 */
export interface BackgroundTask<T> {
  execute: () => Promise<T>;
  onComplete?: (result: T) => void;
  onError?: (error: Error) => void;
}

/**
 * タスク情報
 */
interface TaskInfo<T> {
  id: string;
  task: BackgroundTask<T>;
  status: TaskStatus;
  result?: T;
  error?: Error;
  promise?: Promise<T>;
}

/**
 * バックグラウンド推論ランナー
 * ゲーム進行と並行した分析を管理する
 */
export class BackgroundRunner {
  private tasks: Map<string, TaskInfo<unknown>> = new Map();
  private idCounter: number = 0;
  private isShutdown: boolean = false;

  /**
   * タスクを送信
   */
  submit<T>(task: BackgroundTask<T>): string {
    if (this.isShutdown) {
      throw new Error('Runner is shutdown');
    }

    const id = this.generateId();
    const taskInfo: TaskInfo<T> = {
      id,
      task,
      status: 'pending',
    };

    this.tasks.set(id, taskInfo as TaskInfo<unknown>);

    // 非同期で実行開始
    void this.executeTask(id);

    return id;
  }

  /**
   * 結果を取得
   */
  async getResult<T>(taskId: string): Promise<T | null> {
    const taskInfo = this.tasks.get(taskId) as TaskInfo<T> | undefined;
    if (!taskInfo) {
      return null;
    }

    // まだ実行中の場合は完了を待つ
    if (taskInfo.promise) {
      try {
        await taskInfo.promise;
      } catch {
        // エラーは既に記録済み
      }
    }

    if (taskInfo.status === 'completed' && taskInfo.result !== undefined) {
      return taskInfo.result;
    }

    return null;
  }

  /**
   * ステータスを取得
   */
  getStatus(taskId: string): TaskStatus {
    const taskInfo = this.tasks.get(taskId);
    if (!taskInfo) {
      return 'unknown';
    }
    return taskInfo.status;
  }

  /**
   * タスクをキャンセル
   */
  cancel(taskId: string): boolean {
    const taskInfo = this.tasks.get(taskId);
    if (!taskInfo) {
      return false;
    }

    if (taskInfo.status === 'pending' || taskInfo.status === 'running') {
      taskInfo.status = 'cancelled';
      return true;
    }

    return false;
  }

  /**
   * 保留中のタスク数を取得
   */
  getPendingCount(): number {
    let count = 0;
    for (const taskInfo of this.tasks.values()) {
      if (taskInfo.status === 'pending' || taskInfo.status === 'running') {
        count++;
      }
    }
    return count;
  }

  /**
   * 完了したタスクをクリア
   */
  clearCompleted(): void {
    const toDelete: string[] = [];
    for (const [id, taskInfo] of this.tasks) {
      if (
        taskInfo.status === 'completed' ||
        taskInfo.status === 'failed' ||
        taskInfo.status === 'cancelled'
      ) {
        toDelete.push(id);
      }
    }
    for (const id of toDelete) {
      this.tasks.delete(id);
    }
  }

  /**
   * シャットダウン
   */
  shutdown(): void {
    this.isShutdown = true;

    // 全ての保留中タスクをキャンセル
    for (const taskInfo of this.tasks.values()) {
      if (taskInfo.status === 'pending' || taskInfo.status === 'running') {
        taskInfo.status = 'cancelled';
      }
    }
  }

  /**
   * タスクを実行
   */
  private async executeTask(taskId: string): Promise<void> {
    const taskInfo = this.tasks.get(taskId);
    if (!taskInfo) {
      return;
    }

    // キャンセルされていたら実行しない
    if (taskInfo.status === 'cancelled') {
      return;
    }

    taskInfo.status = 'running';

    const promise = (async () => {
      try {
        const result = await taskInfo.task.execute();

        // キャンセルされていなければ結果を設定
        if (taskInfo.status === 'running') {
          taskInfo.result = result;
          taskInfo.status = 'completed';

          if (taskInfo.task.onComplete) {
            taskInfo.task.onComplete(result);
          }
        }

        return result;
      } catch (error) {
        taskInfo.status = 'failed';
        taskInfo.error = error instanceof Error ? error : new Error(String(error));

        if (taskInfo.task.onError) {
          taskInfo.task.onError(taskInfo.error);
        }

        throw error;
      }
    })();

    taskInfo.promise = promise;
  }

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    this.idCounter++;
    return `bg-task-${Date.now()}-${this.idCounter}`;
  }
}

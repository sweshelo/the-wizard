// src/ai/LLMClient.ts

import Anthropic from '@anthropic-ai/sdk';
import type { LLMModel } from './types';
import { MODEL_CONFIG, MODEL_COST, TIMEOUT_CONFIG } from './constants';

/**
 * LLMClientの設定
 */
export interface LLMClientConfig {
  /** API Key（指定しない場合は環境変数から取得） */
  apiKey?: string;
  /** デフォルトモデル */
  defaultModel?: LLMModel;
  /** リトライ回数 */
  maxRetries?: number;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
}

/**
 * LLMリクエストオプション
 */
export interface LLMRequestOptions {
  /** 使用するモデル */
  model?: LLMModel;
  /** 最大出力トークン数 */
  maxTokens?: number;
  /** Temperature */
  temperature?: number;
  /** タイムアウト（ミリ秒） */
  timeout?: number;
}

/**
 * LLMレスポンス
 */
export interface LLMResponse {
  /** レスポンステキスト */
  content: string;
  /** 使用したモデル */
  model: LLMModel;
  /** 入力トークン数 */
  inputTokens: number;
  /** 出力トークン数 */
  outputTokens: number;
  /** 推定コスト（ドル） */
  estimatedCost: number;
  /** レイテンシ（ミリ秒） */
  latencyMs: number;
}

/**
 * LLMエラー
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly code: 'timeout' | 'api_error' | 'parse_error' | 'rate_limit' | 'unknown',
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

/**
 * Claude APIクライアント
 */
export class LLMClient {
  private client: Anthropic | null = null;
  private config: Required<LLMClientConfig>;
  private totalCost: number = 0;

  constructor(config: LLMClientConfig = {}) {
    this.config = {
      apiKey: config.apiKey ?? '',
      defaultModel: config.defaultModel ?? 'sonnet',
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? TIMEOUT_CONFIG.NORMAL_OPERATION,
    };
  }

  /**
   * クライアントを初期化
   */
  private initClient(): Anthropic {
    if (!this.client) {
      const apiKey = this.config.apiKey || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new LLMError('ANTHROPIC_API_KEY is not set', 'api_error');
      }
      this.client = new Anthropic({ apiKey });
    }
    return this.client;
  }

  /**
   * モデル名をAPI用のモデルIDに変換
   */
  private getModelId(model: LLMModel): string {
    switch (model) {
      case 'haiku':
        return MODEL_CONFIG.HAIKU;
      case 'sonnet':
        return MODEL_CONFIG.SONNET;
      case 'opus':
        return MODEL_CONFIG.OPUS;
      default:
        return MODEL_CONFIG.SONNET;
    }
  }

  /**
   * コストを計算
   */
  private calculateCost(model: LLMModel, inputTokens: number, outputTokens: number): number {
    const costs = MODEL_COST[model];
    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;
    return inputCost + outputCost;
  }

  /**
   * メッセージを送信
   */
  async send(
    systemPrompt: string,
    userMessage: string,
    options: LLMRequestOptions = {}
  ): Promise<LLMResponse> {
    const client = this.initClient();
    const model = options.model ?? this.config.defaultModel;
    const modelId = this.getModelId(model);
    const timeout = options.timeout ?? this.config.timeout;
    const maxTokens = options.maxTokens ?? 1024;
    const temperature = options.temperature ?? 0.7;

    const startTime = Date.now();

    try {
      // タイムアウト付きでリクエスト
      const response = await this.withTimeout(
        client.messages.create({
          model: modelId,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        }),
        timeout
      );

      const latencyMs = Date.now() - startTime;

      // レスポンスからテキストを抽出
      const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('\n');

      const inputTokens = response.usage.input_tokens;
      const outputTokens = response.usage.output_tokens;
      const estimatedCost = this.calculateCost(model, inputTokens, outputTokens);

      // 累計コストを更新
      this.totalCost += estimatedCost;

      return {
        content,
        model,
        inputTokens,
        outputTokens,
        estimatedCost,
        latencyMs,
      };
    } catch (error) {
      if (error instanceof LLMError) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          throw new LLMError('Request timed out', 'timeout', error);
        }
        if (error.message.includes('rate_limit')) {
          throw new LLMError('Rate limit exceeded', 'rate_limit', error);
        }
        throw new LLMError(error.message, 'api_error', error);
      }
      throw new LLMError('Unknown error', 'unknown', error);
    }
  }

  /**
   * リトライ付きでメッセージを送信
   */
  async sendWithRetry(
    systemPrompt: string,
    userMessage: string,
    options: LLMRequestOptions = {}
  ): Promise<LLMResponse> {
    let lastError: LLMError | null = null;

    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        return await this.send(systemPrompt, userMessage, options);
      } catch (error) {
        if (error instanceof LLMError) {
          lastError = error;

          // タイムアウトやレートリミットはリトライ
          if (error.code === 'timeout' || error.code === 'rate_limit') {
            // 指数バックオフ
            const delay = Math.pow(2, attempt) * 1000;
            await this.sleep(delay);
            continue;
          }

          // その他のエラーは即座に失敗
          throw error;
        }
        throw error;
      }
    }

    throw lastError ?? new LLMError('Max retries exceeded', 'unknown');
  }

  /**
   * JSON形式でパースされたレスポンスを取得
   */
  async sendAndParseJSON<T>(
    systemPrompt: string,
    userMessage: string,
    options: LLMRequestOptions = {}
  ): Promise<{ data: T; response: LLMResponse }> {
    const response = await this.sendWithRetry(systemPrompt, userMessage, options);

    try {
      // JSONブロックを抽出
      const jsonMatch = response.content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response.content;
      const data = JSON.parse(jsonStr.trim()) as T;

      return { data, response };
    } catch (error) {
      throw new LLMError('Failed to parse JSON response', 'parse_error', error);
    }
  }

  /**
   * 累計コストを取得
   */
  getTotalCost(): number {
    return this.totalCost;
  }

  /**
   * 累計コストをリセット
   */
  resetTotalCost(): void {
    this.totalCost = 0;
  }

  /**
   * タイムアウト付きPromise
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new LLMError(`Request timed out after ${timeoutMs}ms`, 'timeout'));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }

  /**
   * スリープ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * LLMClientインスタンスを作成
 */
export function createLLMClient(config?: LLMClientConfig): LLMClient {
  return new LLMClient(config);
}

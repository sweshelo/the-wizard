// src/test/mocks/anthropic.ts
import { mock } from 'bun:test';

/**
 * Anthropic API レスポンスの型定義
 */
interface MockMessageResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface MockCreateParams {
  model?: string;
  max_tokens?: number;
  messages?: Array<{ role: string; content: string }>;
  system?: string;
}

interface MockAnthropicClient {
  messages: {
    create: ReturnType<typeof mock> & ((params: MockCreateParams) => Promise<MockMessageResponse>);
  };
}

/**
 * Anthropic API のモッククライアント
 *
 * 重要: テストでは絶対に実際のAPIを呼び出さないこと
 * 理由:
 * - APIコスト（テスト毎に課金される）
 * - レート制限
 * - テスト速度（API呼び出しは遅い）
 * - 再現性（APIレスポンスは非決定的）
 */
export const createMockAnthropicClient = (): MockAnthropicClient => ({
  messages: {
    create: mock((_params: MockCreateParams) =>
      Promise.resolve({
        id: 'mock-msg-id',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify({
              action: 'UnitDrive',
              targetId: 'u1',
              reason: 'テスト用モックレスポンス',
            }),
          },
        ],
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn' as const,
        usage: { input_tokens: 100, output_tokens: 50 },
      })
    ),
  },
});

/**
 * 特定のレスポンスを返すモックを作成
 */
export const createMockWithResponse = (response: unknown): MockAnthropicClient => ({
  messages: {
    create: mock((_params: MockCreateParams) =>
      Promise.resolve({
        id: 'mock-msg-id',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: typeof response === 'string' ? response : JSON.stringify(response),
          },
        ],
        model: 'claude-3-haiku-20240307',
        stop_reason: 'end_turn' as const,
        usage: { input_tokens: 100, output_tokens: 50 },
      })
    ),
  },
});

/**
 * エラーを返すモックを作成
 */
export const createMockWithError = (error: Error): MockAnthropicClient => ({
  messages: {
    create: mock((_params: MockCreateParams) => Promise.reject(error)),
  },
});

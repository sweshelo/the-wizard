// src/ai/LLMClient.test.ts

import { describe, it, expect, beforeEach, mock, spyOn } from 'bun:test';
import { LLMClient, createLLMClient, LLMError } from './LLMClient';
import type { LLMResponse } from './LLMClient';
import { MODEL_COST } from './constants';

// Anthropic SDKのモック
const mockCreate = mock(() =>
  Promise.resolve({
    content: [{ type: 'text', text: 'Test response' }],
    usage: { input_tokens: 100, output_tokens: 50 },
  })
);

// モックモジュール
mock.module('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

describe('LLMClient', () => {
  let client: LLMClient;

  beforeEach(() => {
    mockCreate.mockClear();
    // 環境変数を設定
    process.env.ANTHROPIC_API_KEY = 'test-api-key';
    client = createLLMClient();
  });

  describe('initialization', () => {
    it('should create client with default config', () => {
      const c = new LLMClient();
      expect(c).toBeInstanceOf(LLMClient);
    });

    it('should accept custom config', () => {
      const c = createLLMClient({
        defaultModel: 'haiku',
        maxRetries: 5,
        timeout: 10000,
      });
      expect(c).toBeInstanceOf(LLMClient);
    });
  });

  describe('send', () => {
    it('should send message and return response', async () => {
      const response = await client.send('System prompt', 'User message');

      expect(response.content).toBe('Test response');
      expect(response.model).toBe('sonnet');
      expect(response.inputTokens).toBe(100);
      expect(response.outputTokens).toBe(50);
      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should use specified model', async () => {
      await client.send('System', 'User', { model: 'haiku' });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: expect.stringContaining('haiku'),
        })
      );
    });

    it('should calculate cost correctly', async () => {
      const response = await client.send('System', 'User');

      // Sonnet cost: input $3/1M, output $15/1M
      const expectedCost =
        (100 / 1_000_000) * MODEL_COST.sonnet.input + (50 / 1_000_000) * MODEL_COST.sonnet.output;
      expect(response.estimatedCost).toBeCloseTo(expectedCost, 10);
    });
  });

  describe('sendWithRetry', () => {
    it('should retry on timeout error', async () => {
      let callCount = 0;
      mockCreate.mockImplementation(() => {
        callCount++;
        if (callCount < 2) {
          return Promise.reject(new Error('timeout'));
        }
        return Promise.resolve({
          content: [{ type: 'text', text: 'Success after retry' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        });
      });

      const response = await client.sendWithRetry('System', 'User');

      expect(response.content).toBe('Success after retry');
      expect(callCount).toBe(2);
    });

    it('should not retry on api_error', async () => {
      mockCreate.mockImplementation(() => {
        return Promise.reject(new Error('API error'));
      });

      await expect(client.sendWithRetry('System', 'User')).rejects.toThrow(LLMError);
    });
  });

  describe('sendAndParseJSON', () => {
    it('should parse JSON from response', async () => {
      mockCreate.mockImplementation(() =>
        Promise.resolve({
          content: [{ type: 'text', text: '```json\n{"action": "test"}\n```' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        })
      );

      const result = await client.sendAndParseJSON<{ action: string }>('System', 'User');

      expect(result.data.action).toBe('test');
      expect(result.response.content).toContain('action');
    });

    it('should parse JSON without code blocks', async () => {
      mockCreate.mockImplementation(() =>
        Promise.resolve({
          content: [{ type: 'text', text: '{"action": "direct"}' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        })
      );

      const result = await client.sendAndParseJSON<{ action: string }>('System', 'User');

      expect(result.data.action).toBe('direct');
    });

    it('should throw on invalid JSON', async () => {
      mockCreate.mockImplementation(() =>
        Promise.resolve({
          content: [{ type: 'text', text: 'not valid json' }],
          usage: { input_tokens: 100, output_tokens: 50 },
        })
      );

      await expect(client.sendAndParseJSON('System', 'User')).rejects.toThrow(LLMError);
    });
  });

  describe('cost tracking', () => {
    it('should track total cost', async () => {
      expect(client.getTotalCost()).toBe(0);

      await client.send('System', 'User');
      const costAfterOne = client.getTotalCost();
      expect(costAfterOne).toBeGreaterThan(0);

      await client.send('System', 'User');
      expect(client.getTotalCost()).toBeGreaterThan(costAfterOne);
    });

    it('should reset total cost', async () => {
      await client.send('System', 'User');
      expect(client.getTotalCost()).toBeGreaterThan(0);

      client.resetTotalCost();
      expect(client.getTotalCost()).toBe(0);
    });
  });

  describe('LLMError', () => {
    it('should create error with code', () => {
      const error = new LLMError('Test error', 'timeout');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('timeout');
      expect(error.name).toBe('LLMError');
    });

    it('should include original error', () => {
      const original = new Error('Original');
      const error = new LLMError('Wrapped', 'api_error', original);
      expect(error.originalError).toBe(original);
    });
  });
});

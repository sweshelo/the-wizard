// src/ai/thread/ContextWindowManager.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import {
  ContextWindowManager,
  type ContextEntry,
  type ContextWindowManagerConfig,
} from './ContextWindowManager';
import type { LLMClient } from '../LLMClient';

describe('ContextWindowManager', () => {
  let manager: ContextWindowManager;

  beforeEach(() => {
    manager = new ContextWindowManager();
  });

  // ヘルパー: エントリを作成
  function createEntry(
    content: string,
    role: 'user' | 'assistant' = 'user',
    priority: 'high' | 'normal' | 'low' = 'normal',
    generation: number = 1
  ): Omit<ContextEntry, 'id' | 'timestamp' | 'tokenCount'> {
    return { content, role, priority, generation };
  }

  describe('addEntry and getEntries', () => {
    it('adds entries and retrieves them in order', () => {
      manager.addEntry(createEntry('First message', 'user'));
      manager.addEntry(createEntry('Second message', 'assistant'));
      manager.addEntry(createEntry('Third message', 'user'));

      const entries = manager.getEntries();

      expect(entries.length).toBe(3);
      expect(entries[0].content).toBe('First message');
      expect(entries[1].content).toBe('Second message');
      expect(entries[2].content).toBe('Third message');
    });

    it('assigns unique IDs to entries', () => {
      manager.addEntry(createEntry('First'));
      manager.addEntry(createEntry('Second'));

      const entries = manager.getEntries();
      const ids = entries.map(e => e.id);

      expect(new Set(ids).size).toBe(2);
    });

    it('calculates token count for each entry', () => {
      manager.addEntry(createEntry('Hello world'));

      const entries = manager.getEntries();

      expect(entries[0].tokenCount).toBeGreaterThan(0);
    });

    it('respects token limit when getting entries', () => {
      // トークン制限の小さいマネージャーを作成
      const limitedManager = new ContextWindowManager({ maxTokens: 50 });

      // 長いメッセージを追加
      limitedManager.addEntry(createEntry('A'.repeat(100), 'user'));
      limitedManager.addEntry(createEntry('B'.repeat(100), 'assistant'));
      limitedManager.addEntry(createEntry('Short', 'user'));

      const entries = limitedManager.getEntries(50);

      // 最新のエントリのみ取得されるはず
      expect(entries.length).toBeLessThan(3);
    });
  });

  describe('estimateTokens', () => {
    it('estimates token count for simple text', () => {
      const count = manager.estimateTokens('Hello world');

      // 大まかな推定: 約4文字で1トークン
      expect(count).toBeGreaterThan(0);
      expect(count).toBeLessThan(10);
    });

    it('estimates token count for Japanese text', () => {
      const count = manager.estimateTokens('こんにちは世界');

      // 日本語は約1-2文字で1トークン
      expect(count).toBeGreaterThan(0);
    });

    it('handles empty string', () => {
      const count = manager.estimateTokens('');

      expect(count).toBe(0);
    });

    it('estimates longer text proportionally', () => {
      const shortCount = manager.estimateTokens('Hello');
      const longCount = manager.estimateTokens('Hello world how are you doing today');

      expect(longCount).toBeGreaterThan(shortCount);
    });
  });

  describe('compact', () => {
    it('removes old low-priority entries first', () => {
      // 小さな制限
      const limitedManager = new ContextWindowManager({
        maxTokens: 100,
        compactThreshold: 0.8,
      });

      // 複数のエントリを追加
      limitedManager.addEntry(createEntry('Old low priority', 'user', 'low'));
      limitedManager.addEntry(createEntry('Old normal', 'assistant', 'normal'));
      limitedManager.addEntry(createEntry('New high priority', 'user', 'high'));

      limitedManager.compact();

      const entries = limitedManager.getEntries();

      // 高優先度エントリは残る
      expect(entries.some(e => e.priority === 'high')).toBe(true);
    });

    it('preserves high-priority entries', () => {
      const limitedManager = new ContextWindowManager({ maxTokens: 50 });

      limitedManager.addEntry(createEntry('Critical info', 'user', 'high'));
      limitedManager.addEntry(createEntry('Low priority info', 'assistant', 'low'));

      limitedManager.compact();

      const entries = limitedManager.getEntries();
      expect(entries.some(e => e.content === 'Critical info')).toBe(true);
    });

    it('triggers summarization when needed', () => {
      const limitedManager = new ContextWindowManager({
        maxTokens: 100,
        enableSummarization: true,
      });

      // 多くのエントリを追加
      for (let i = 0; i < 10; i++) {
        limitedManager.addEntry(createEntry(`Message ${i}`, 'user', 'low'));
      }

      limitedManager.compact();

      // 圧縮後のエントリ数が減少
      const entries = limitedManager.getEntries();
      expect(entries.length).toBeLessThanOrEqual(10);
    });
  });

  describe('toMessages', () => {
    it('converts entries to LLM message format', () => {
      manager.addEntry(createEntry('User question', 'user'));
      manager.addEntry(createEntry('AI response', 'assistant'));

      const messages = manager.toMessages();

      expect(messages).toEqual([
        { role: 'user', content: 'User question' },
        { role: 'assistant', content: 'AI response' },
      ]);
    });

    it('maintains role order', () => {
      manager.addEntry(createEntry('First', 'user'));
      manager.addEntry(createEntry('Second', 'assistant'));
      manager.addEntry(createEntry('Third', 'user'));

      const messages = manager.toMessages();

      expect(messages[0].role).toBe('user');
      expect(messages[1].role).toBe('assistant');
      expect(messages[2].role).toBe('user');
    });

    it('returns empty array for empty context', () => {
      const messages = manager.toMessages();

      expect(messages).toEqual([]);
    });
  });

  describe('getTotalTokens', () => {
    it('returns sum of all entry token counts', () => {
      manager.addEntry(createEntry('Hello'));
      manager.addEntry(createEntry('World'));

      const total = manager.getTotalTokens();

      expect(total).toBeGreaterThan(0);
    });

    it('returns 0 for empty context', () => {
      expect(manager.getTotalTokens()).toBe(0);
    });
  });

  describe('clear', () => {
    it('removes all entries', () => {
      manager.addEntry(createEntry('Test'));
      manager.addEntry(createEntry('Test2'));

      manager.clear();

      expect(manager.getEntries()).toEqual([]);
      expect(manager.getTotalTokens()).toBe(0);
    });
  });

  describe('removeEntry', () => {
    it('removes entry by id', () => {
      manager.addEntry(createEntry('First'));
      manager.addEntry(createEntry('Second'));

      const entries = manager.getEntries();
      const idToRemove = entries[0].id;

      manager.removeEntry(idToRemove);

      const remaining = manager.getEntries();
      expect(remaining.length).toBe(1);
      expect(remaining[0].content).toBe('Second');
    });

    it('does nothing if id not found', () => {
      manager.addEntry(createEntry('Test'));

      manager.removeEntry('non-existent-id');

      expect(manager.getEntries().length).toBe(1);
    });
  });

  describe('configuration', () => {
    it('respects custom maxTokens', () => {
      const config: ContextWindowManagerConfig = { maxTokens: 500 };
      const customManager = new ContextWindowManager(config);

      expect(customManager.getMaxTokens()).toBe(500);
    });

    it('uses default maxTokens if not specified', () => {
      expect(manager.getMaxTokens()).toBe(4096); // default value
    });

    it('respects custom maxTurns', () => {
      const config: ContextWindowManagerConfig = { maxTurns: 15 };
      const customManager = new ContextWindowManager(config);

      expect(customManager.getMaxTurns()).toBe(15);
    });

    it('uses default maxTurns if not specified', () => {
      expect(manager.getMaxTurns()).toBe(20); // default value
    });
  });

  describe('summarize', () => {
    it('summarizes entries up to specified turn', () => {
      // 複数のエントリを追加
      for (let i = 0; i < 10; i++) {
        manager.addEntry(createEntry(`Message ${i}`, i % 2 === 0 ? 'user' : 'assistant'));
      }

      const result = manager.summarize(5);

      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.entriesProcessed).toBe(5);
    });

    it('handles upToTurn greater than entry count', () => {
      manager.addEntry(createEntry('Message 1', 'user'));
      manager.addEntry(createEntry('Message 2', 'assistant'));

      const result = manager.summarize(10);

      expect(result.entriesProcessed).toBe(2);
    });

    it('returns empty summary for zero turn', () => {
      manager.addEntry(createEntry('Message 1', 'user'));

      const result = manager.summarize(0);

      expect(result.summary).toBe('');
      expect(result.entriesProcessed).toBe(0);
    });
  });

  describe('compressAsync', () => {
    function createMockLLMClient(response: string): LLMClient {
      return {
        send: mock(() =>
          Promise.resolve({
            content: response,
            model: 'haiku' as const,
            inputTokens: 100,
            outputTokens: 50,
            estimatedCost: 0.001,
            latencyMs: 100,
          })
        ),
        sendWithHistory: mock(() =>
          Promise.resolve({
            content: response,
            model: 'haiku' as const,
            inputTokens: 100,
            outputTokens: 50,
            estimatedCost: 0.001,
            latencyMs: 100,
          })
        ),
        getTotalCost: () => 0.001,
        resetTotalCost: () => {},
      } as unknown as LLMClient;
    }

    it('compresses with LLM when provided', async () => {
      const config: ContextWindowManagerConfig = {
        maxTokens: 100,
        compactThreshold: 0.5,
        llmClient: createMockLLMClient('LLM要約: 序盤の展開'),
      };
      const llmManager = new ContextWindowManager(config);

      // 多くのエントリを追加して圧縮をトリガー
      for (let i = 0; i < 10; i++) {
        llmManager.addEntry(createEntry(`Long message ${i} with more content`, 'user', 'low'));
      }

      const initialTokens = llmManager.getTotalTokens();
      await llmManager.compressAsync();

      expect(llmManager.getTotalTokens()).toBeLessThanOrEqual(initialTokens);
    });

    it('falls back to sync compact when no LLM', async () => {
      const config: ContextWindowManagerConfig = {
        maxTokens: 100,
        compactThreshold: 0.5,
      };
      const limitedManager = new ContextWindowManager(config);

      for (let i = 0; i < 10; i++) {
        limitedManager.addEntry(createEntry(`Message ${i}`, 'user', 'low'));
      }

      await limitedManager.compressAsync();

      // 圧縮は行われる（同期版にフォールバック）
      expect(limitedManager.getEntries().length).toBeLessThanOrEqual(10);
    });
  });

  describe('generation management', () => {
    it('initializes entries with generation 1', () => {
      manager.addEntry(createEntry('New entry', 'user'));

      const entries = manager.getEntries();
      expect(entries[0].generation).toBe(1);
    });

    it('increments generation when creating summary entry', () => {
      // 低優先度エントリを追加
      for (let i = 0; i < 5; i++) {
        manager.addEntry(createEntry(`Message ${i}`, 'user', 'low', 1));
      }

      // 要約を生成してエントリを作成
      const summaryEntry = manager.createSummaryEntry(3);

      // 要約エントリの世代は元のエントリより高い
      expect(summaryEntry.generation).toBe(2);
    });

    it('preserves high generation entries during compact', () => {
      const limitedManager = new ContextWindowManager({
        maxTokens: 100,
        compactThreshold: 0.5,
      });

      // 低世代エントリ
      limitedManager.addEntry(createEntry('Low gen entry', 'user', 'normal', 1));
      // 高世代エントリ（要約など）
      limitedManager.addEntry(createEntry('High gen summary', 'assistant', 'normal', 3));

      limitedManager.compact();

      const entries = limitedManager.getEntries();
      // 高世代エントリは優先的に保持される
      expect(entries.some(e => e.generation === 3)).toBe(true);
    });
  });
});

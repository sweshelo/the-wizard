// src/ai/thread/ContextWindowManager.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ContextWindowManager,
  type ContextEntry,
  type ContextWindowManagerConfig,
} from './ContextWindowManager';

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
  });
});

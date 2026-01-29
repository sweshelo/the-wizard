// src/ai/thread/ThreadSummarizer.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ThreadSummarizer, type SummaryResult, type SummarizationConfig } from './ThreadSummarizer';
import type { ContextEntry } from './ContextWindowManager';
import type { LLMClient } from '../LLMClient';

describe('ThreadSummarizer', () => {
  let summarizer: ThreadSummarizer;

  beforeEach(() => {
    summarizer = new ThreadSummarizer();
  });

  // ヘルパー: ContextEntryを作成
  function createEntry(
    content: string,
    role: 'user' | 'assistant' = 'user',
    tokenCount: number = 50
  ): ContextEntry {
    return {
      id: `entry-${Math.random().toString(36).slice(2)}`,
      content,
      role,
      timestamp: new Date(),
      tokenCount,
      priority: 'normal',
      generation: 1,
    };
  }

  describe('summarize', () => {
    it('compresses multiple entries into one summary', () => {
      const entries: ContextEntry[] = [
        createEntry('ターン1: 赤ユニットをプレイ', 'user'),
        createEntry('対応: ブロッカーを配置しました', 'assistant'),
        createEntry('ターン2: インターセプトを発動', 'user'),
      ];

      const result = summarizer.summarize(entries);

      expect(result.summary).toBeDefined();
      expect(typeof result.summary).toBe('string');
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('preserves key information', () => {
      const entries: ContextEntry[] = [
        createEntry('相手のライフは3、手札は5枚', 'assistant'),
        createEntry('キーカード「断罪のメフィスト」がプレイされた', 'user'),
      ];

      const result = summarizer.summarize(entries);

      // 数値情報が保持されているか
      expect(result.summary.includes('3') || result.summary.includes('5')).toBe(true);
    });

    it('reduces token count', () => {
      const entries: ContextEntry[] = [
        createEntry('A'.repeat(200), 'user', 200),
        createEntry('B'.repeat(200), 'assistant', 200),
        createEntry('C'.repeat(200), 'user', 200),
      ];

      const result = summarizer.summarize(entries);

      expect(result.compressedTokens).toBeLessThan(result.originalTokens);
    });

    it('returns correct counts', () => {
      const entries: ContextEntry[] = [
        createEntry('Entry 1', 'user', 10),
        createEntry('Entry 2', 'assistant', 20),
        createEntry('Entry 3', 'user', 30),
      ];

      const result = summarizer.summarize(entries);

      expect(result.originalTokens).toBe(60);
      expect(result.entriesProcessed).toBe(3);
    });

    it('handles empty entries array', () => {
      const result = summarizer.summarize([]);

      expect(result.summary).toBe('');
      expect(result.originalTokens).toBe(0);
      expect(result.compressedTokens).toBe(0);
      expect(result.entriesProcessed).toBe(0);
    });

    it('handles single entry', () => {
      const entries: ContextEntry[] = [createEntry('Single entry', 'user', 10)];

      const result = summarizer.summarize(entries);

      expect(result.summary).toBeDefined();
      expect(result.entriesProcessed).toBe(1);
    });
  });

  describe('needsSummarization', () => {
    it('returns true when entries exceed threshold', () => {
      const entries: ContextEntry[] = [
        createEntry('Entry 1', 'user', 100),
        createEntry('Entry 2', 'assistant', 100),
        createEntry('Entry 3', 'user', 100),
      ];

      const result = summarizer.needsSummarization(entries, 200);

      expect(result).toBe(true);
    });

    it('returns false when under threshold', () => {
      const entries: ContextEntry[] = [
        createEntry('Entry 1', 'user', 10),
        createEntry('Entry 2', 'assistant', 10),
      ];

      const result = summarizer.needsSummarization(entries, 100);

      expect(result).toBe(false);
    });

    it('returns false for empty entries', () => {
      const result = summarizer.needsSummarization([], 100);

      expect(result).toBe(false);
    });

    it('returns true when exactly at threshold', () => {
      const entries: ContextEntry[] = [createEntry('Entry', 'user', 100)];

      const result = summarizer.needsSummarization(entries, 100);

      expect(result).toBe(true);
    });
  });

  describe('extractKeyPoints', () => {
    it('extracts game actions', () => {
      const content = 'ユニットを召喚し、アタックを宣言。相手がブロックした。';
      const keyPoints = summarizer.extractKeyPoints(content);

      expect(keyPoints.length).toBeGreaterThan(0);
      // 「アタック」や「ブロック」などのアクションが抽出される
      expect(keyPoints.some(p => p.includes('アタック') || p.includes('ブロック'))).toBe(true);
    });

    it('extracts numeric values', () => {
      const content = 'ライフ5、BP3000のユニット、手札2枚';
      const keyPoints = summarizer.extractKeyPoints(content);

      expect(keyPoints.some(p => /\d+/.test(p))).toBe(true);
    });

    it('extracts card names in quotes', () => {
      const content = '「断罪のメフィスト」をプレイして「ライズアンドシャイン」を発動';
      const keyPoints = summarizer.extractKeyPoints(content);

      expect(
        keyPoints.some(p => p.includes('断罪のメフィスト') || p.includes('ライズアンドシャイン'))
      ).toBe(true);
    });

    it('returns empty array for empty content', () => {
      const keyPoints = summarizer.extractKeyPoints('');

      expect(keyPoints).toEqual([]);
    });

    it('handles content without special patterns', () => {
      const content = '特に何もない状態';
      const keyPoints = summarizer.extractKeyPoints(content);

      // 空でもエラーにならない
      expect(Array.isArray(keyPoints)).toBe(true);
    });

    it('extracts turn information', () => {
      const content = 'ターン3でフィールドが有利に';
      const keyPoints = summarizer.extractKeyPoints(content);

      expect(keyPoints.some(p => p.includes('ターン') || p.includes('3'))).toBe(true);
    });
  });

  describe('createCompactSummary', () => {
    it('creates a summary with limited length', () => {
      const entries: ContextEntry[] = Array(20)
        .fill(null)
        .map((_, i) => createEntry(`ターン${i}: アクション${i}`, 'user', 20));

      const result = summarizer.summarize(entries);

      // 要約は元のテキストより短くなる
      const originalLength = entries.map(e => e.content).join(' ').length;
      expect(result.summary.length).toBeLessThan(originalLength);
    });
  });

  describe('summarizeWithLLM', () => {
    // モックLLMClientを作成
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

    it('generates LLM-based summary', async () => {
      const mockClient = createMockLLMClient(
        'ターン1-5: 序盤の展開。相手がアタック、ライフ20→15。'
      );
      const entries: ContextEntry[] = [
        createEntry('ターン1: ユニットを召喚', 'user', 100),
        createEntry('相手がアタック、ライフが20から15に減少', 'assistant', 100),
        createEntry('ターン2: ブロッカーを配置', 'user', 100),
      ];

      const result = await summarizer.summarizeWithLLM(entries, mockClient);

      expect(result.summary).toContain('ターン1-5');
      expect(result.compressedTokens).toBeLessThan(result.originalTokens);
      expect(mockClient.send).toHaveBeenCalled();
    });

    it('handles empty entries', async () => {
      const mockClient = createMockLLMClient('');

      const result = await summarizer.summarizeWithLLM([], mockClient);

      expect(result.summary).toBe('');
      expect(result.entriesProcessed).toBe(0);
      expect(mockClient.send).not.toHaveBeenCalled();
    });

    it('falls back to rule-based on LLM error', async () => {
      const mockClient = {
        send: mock(() => Promise.reject(new Error('API Error'))),
        sendWithHistory: mock(() => Promise.reject(new Error('API Error'))),
        getTotalCost: () => 0,
        resetTotalCost: () => {},
      } as unknown as LLMClient;

      const entries: ContextEntry[] = [
        createEntry('ターン1: アタック宣言', 'user', 50),
        createEntry('ブロックで対応', 'assistant', 50),
      ];

      const result = await summarizer.summarizeWithLLM(entries, mockClient);

      // フォールバックでルールベース要約が使われる
      expect(result.summary.length).toBeGreaterThan(0);
      expect(result.entriesProcessed).toBe(2);
    });
  });

  describe('summarizeHybrid', () => {
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

    it('uses LLM when client is provided and enabled', async () => {
      const config: SummarizationConfig = { enableLLMSummarization: true };
      const summarizer = new ThreadSummarizer({ summarizationConfig: config });
      const mockClient = createMockLLMClient('LLM要約結果');
      const entries: ContextEntry[] = [createEntry('テスト', 'user', 50)];

      const result = await summarizer.summarizeHybrid(entries, mockClient);

      expect(result.summary).toBe('LLM要約結果');
      expect(mockClient.send).toHaveBeenCalled();
    });

    it('uses rule-based when LLM is disabled', async () => {
      const config: SummarizationConfig = { enableLLMSummarization: false };
      const summarizer = new ThreadSummarizer({ summarizationConfig: config });
      const mockClient = createMockLLMClient('LLM要約結果');
      const entries: ContextEntry[] = [createEntry('アタック宣言', 'user', 50)];

      const result = await summarizer.summarizeHybrid(entries, mockClient);

      // ルールベース要約が使われる（LLMは呼ばれない）
      expect(mockClient.send).not.toHaveBeenCalled();
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it('uses rule-based when no LLM client provided', async () => {
      const entries: ContextEntry[] = [createEntry('ブロック対応', 'user', 50)];

      const result = await summarizer.summarizeHybrid(entries);

      expect(result.summary.length).toBeGreaterThan(0);
    });
  });

  describe('SummarizationConfig', () => {
    it('respects summarizeAfterTurns setting', () => {
      const config: SummarizationConfig = { summarizeAfterTurns: 5 };
      const summarizer = new ThreadSummarizer({ summarizationConfig: config });

      expect(summarizer.getConfig().summarizeAfterTurns).toBe(5);
    });

    it('uses default values when not specified', () => {
      const summarizer = new ThreadSummarizer();
      const config = summarizer.getConfig();

      expect(config.summarizeAfterTurns).toBe(10);
      expect(config.keepDetailedTurns).toBe(5);
      expect(config.maxEventSummaryLength).toBe(500);
      expect(config.enableLLMSummarization).toBe(true);
    });
  });
});

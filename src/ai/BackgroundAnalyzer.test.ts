// src/ai/BackgroundAnalyzer.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { BackgroundAnalyzer } from './BackgroundAnalyzer';
import type { AIGameContext } from './types';
import type { LLMClient } from './LLMClient';

// モックのゲームコンテキスト
const createMockContext = (round: number = 1): AIGameContext =>
  ({
    turn: round * 2,
    round,
    isMyTurn: true,
    self: {
      life: 6,
      cp: { current: 4, max: 7 },
      jokerGauge: 0,
      handCount: 5,
      deckCount: 30,
    },
    opponent: {
      life: 6,
      cp: { current: 3, max: 7 },
      jokerGauge: 0,
      handCount: 5,
      deckCount: 30,
    },
    myHand: [],
    myField: [],
    opponentField: [],
    myTrigger: [],
    recentEvents: [],
  }) as AIGameContext;

// モックのLLMClient
const createMockLLMClient = (): LLMClient => {
  return {
    send: mock(() =>
      Promise.resolve({
        content: JSON.stringify({
          boardEvaluation: '互角',
          evaluationScore: 0,
          keyObservations: ['テスト観察'],
          threatLevel: '中',
          strategySuggestion: 'テスト提案',
          nextRoundPriorities: ['優先事項1'],
        }),
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
      })
    ),
  } as unknown as LLMClient;
};

describe('BackgroundAnalyzer', () => {
  let analyzer: BackgroundAnalyzer;
  let mockLLMClient: LLMClient;

  beforeEach(() => {
    mockLLMClient = createMockLLMClient();
    analyzer = new BackgroundAnalyzer(mockLLMClient);
  });

  describe('shouldAnalyze', () => {
    it('should return true when round interval is met', () => {
      analyzer.setAnalysisInterval(2);

      expect(analyzer.shouldAnalyze(2)).toBe(true);
      expect(analyzer.shouldAnalyze(4)).toBe(true);
    });

    it('should return false when round interval is not met', () => {
      analyzer.setAnalysisInterval(2);

      expect(analyzer.shouldAnalyze(1)).toBe(false);
      expect(analyzer.shouldAnalyze(3)).toBe(false);
    });

    it('should return false when already analyzed this round', () => {
      analyzer.setAnalysisInterval(2);
      analyzer.markAnalyzed(2);

      expect(analyzer.shouldAnalyze(2)).toBe(false);
    });
  });

  describe('analyze', () => {
    it('should perform analysis and return result', async () => {
      const context = createMockContext(2);

      const result = await analyzer.analyze(context);

      expect(result).toBeDefined();
      expect(result?.boardEvaluation).toBe('互角');
      expect(result?.keyObservations).toContain('テスト観察');
    });

    it('should mark round as analyzed after analysis', async () => {
      const context = createMockContext(2);

      await analyzer.analyze(context);

      expect(analyzer.shouldAnalyze(2)).toBe(false);
    });

    it('should store analysis result', async () => {
      const context = createMockContext(2);

      await analyzer.analyze(context);

      const lastResult = analyzer.getLastAnalysis();
      expect(lastResult).toBeDefined();
      expect(lastResult?.round).toBe(2);
    });
  });

  describe('getLastAnalysis', () => {
    it('should return null when no analysis performed', () => {
      expect(analyzer.getLastAnalysis()).toBeNull();
    });

    it('should return last analysis result', async () => {
      const context1 = createMockContext(2);
      const context2 = createMockContext(4);

      await analyzer.analyze(context1);
      await analyzer.analyze(context2);

      const last = analyzer.getLastAnalysis();
      expect(last?.round).toBe(4);
    });
  });

  describe('getAnalysisHistory', () => {
    it('should return all analysis results', async () => {
      const context1 = createMockContext(2);
      const context2 = createMockContext(4);

      await analyzer.analyze(context1);
      await analyzer.analyze(context2);

      const history = analyzer.getAnalysisHistory();
      expect(history).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all analysis data', async () => {
      const context = createMockContext(2);
      await analyzer.analyze(context);

      analyzer.clear();

      expect(analyzer.getLastAnalysis()).toBeNull();
      expect(analyzer.getAnalysisHistory()).toHaveLength(0);
      expect(analyzer.shouldAnalyze(2)).toBe(true);
    });
  });

  describe('formatSummaryForPrompt', () => {
    it('should format last analysis for inclusion in prompts', async () => {
      const context = createMockContext(2);
      await analyzer.analyze(context);

      const summary = analyzer.formatSummaryForPrompt();

      expect(summary).toContain('互角');
      expect(summary).toContain('テスト観察');
    });

    it('should return empty string when no analysis', () => {
      const summary = analyzer.formatSummaryForPrompt();

      expect(summary).toBe('');
    });
  });
});

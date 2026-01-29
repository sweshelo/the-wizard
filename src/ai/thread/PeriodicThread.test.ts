// src/ai/thread/PeriodicThread.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PeriodicThread } from './PeriodicThread';
import type { AIGameContext } from '../types';
import type { LLMClient } from '../LLMClient';

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
          keyObservations: ['観察1'],
          threatLevel: '中',
          strategySuggestion: '提案',
          nextRoundPriorities: ['優先1'],
        }),
        model: 'opus',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.01,
      })
    ),
  } as unknown as LLMClient;
};

describe('PeriodicThread', () => {
  let thread: PeriodicThread;
  let mockLLMClient: LLMClient;

  beforeEach(() => {
    mockLLMClient = createMockLLMClient();
    thread = new PeriodicThread(mockLLMClient);
  });

  describe('onRoundStart', () => {
    it('should trigger analysis on interval rounds', async () => {
      const context = createMockContext(2);

      await thread.onRoundStart(context);

      expect(thread.hasAnalysisForRound(2)).toBe(true);
    });

    it('should not trigger analysis on non-interval rounds', async () => {
      const context = createMockContext(1);

      await thread.onRoundStart(context);

      expect(thread.hasAnalysisForRound(1)).toBe(false);
    });

    it('should not re-analyze already analyzed rounds', async () => {
      const context = createMockContext(2);

      await thread.onRoundStart(context);
      await thread.onRoundStart(context);

      // LLM should only be called once
      expect((mockLLMClient.send as ReturnType<typeof mock>).mock.calls.length).toBe(1);
    });
  });

  describe('getStrategySummary', () => {
    it('should return empty string when no analysis', () => {
      const summary = thread.getStrategySummary();

      expect(summary).toBe('');
    });

    it('should return formatted summary after analysis', async () => {
      const context = createMockContext(2);
      await thread.onRoundStart(context);

      const summary = thread.getStrategySummary();

      expect(summary).toContain('互角');
      expect(summary).toContain('観察1');
    });
  });

  describe('getThreatLevel', () => {
    it('should return unknown when no analysis', () => {
      const level = thread.getThreatLevel();

      expect(level).toBe('unknown');
    });

    it('should return threat level after analysis', async () => {
      const context = createMockContext(2);
      await thread.onRoundStart(context);

      const level = thread.getThreatLevel();

      expect(level).toBe('中');
    });
  });

  describe('getBoardEvaluation', () => {
    it('should return null when no analysis', () => {
      const evaluation = thread.getBoardEvaluation();

      expect(evaluation).toBeNull();
    });

    it('should return evaluation after analysis', async () => {
      const context = createMockContext(2);
      await thread.onRoundStart(context);

      const evaluation = thread.getBoardEvaluation();

      expect(evaluation?.evaluation).toBe('互角');
      expect(evaluation?.score).toBe(0);
    });
  });

  describe('injectIntoPrompt', () => {
    it('should return original prompt when no analysis', () => {
      const original = 'Original prompt';

      const result = thread.injectIntoPrompt(original);

      expect(result).toBe(original);
    });

    it('should inject analysis summary into prompt', async () => {
      const context = createMockContext(2);
      await thread.onRoundStart(context);

      const original = 'Original prompt';
      const result = thread.injectIntoPrompt(original);

      expect(result).toContain(original);
      expect(result).toContain('## 定期分析結果');
    });
  });

  describe('reset', () => {
    it('should clear all analysis data', async () => {
      const context = createMockContext(2);
      await thread.onRoundStart(context);

      thread.reset();

      expect(thread.hasAnalysisForRound(2)).toBe(false);
      expect(thread.getStrategySummary()).toBe('');
    });
  });
});

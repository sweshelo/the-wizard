// src/ai/prompts/analysis.test.ts
import { describe, it, expect } from 'bun:test';
import type { AIGameContext } from '../types';
import {
  analyzeGamePhase,
  analyzeBoardAdvantage,
  analyzeResourceSituation,
  generateSituationalAdvice,
  formatAnalysis,
  type GamePhase,
  type BoardAdvantage,
  type ResourceAnalysis,
} from './analysis';

// テスト用のモックコンテキスト作成
function createMockContext(overrides: Partial<AIGameContext> = {}): AIGameContext {
  return {
    turn: 3,
    round: 1,
    isMyTurn: true,
    self: {
      life: 8,
      cp: { current: 3, max: 3 },
      jokerGauge: 0,
      handCount: 5,
      deckCount: 30,
    },
    opponent: {
      life: 8,
      cp: { current: 3, max: 3 },
      jokerGauge: 0,
      handCount: 5,
      deckCount: 30,
    },
    myField: [],
    opponentField: [],
    myHand: [],
    myTrigger: [],
    recentEvents: [],
    ...overrides,
  };
}

describe('Analysis Prompts', () => {
  describe('analyzeGamePhase', () => {
    it('should identify early game (turn 1-3)', () => {
      const context = createMockContext({ turn: 2 });
      const phase = analyzeGamePhase(context);

      expect(phase.name).toBe('early');
      expect(phase.description).toContain('序盤');
    });

    it('should identify mid game (turn 4-7)', () => {
      const context = createMockContext({ turn: 5 });
      const phase = analyzeGamePhase(context);

      expect(phase.name).toBe('mid');
      expect(phase.description).toContain('中盤');
    });

    it('should identify late game (turn 8+)', () => {
      const context = createMockContext({ turn: 10 });
      const phase = analyzeGamePhase(context);

      expect(phase.name).toBe('late');
      expect(phase.description).toContain('終盤');
    });

    it('should include phase-specific advice', () => {
      const context = createMockContext({ turn: 1 });
      const phase = analyzeGamePhase(context);

      expect(phase.advice).toBeDefined();
      expect(phase.advice.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeBoardAdvantage', () => {
    it('should detect advantage when more units on field', () => {
      const context = createMockContext({
        myField: [
          {
            id: 'u1',
            name: 'Unit1',
            catalogId: '1',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
          {
            id: 'u2',
            name: 'Unit2',
            catalogId: '2',
            bp: 4000,
            baseBp: 4000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
        opponentField: [
          {
            id: 'u3',
            name: 'Unit3',
            catalogId: '3',
            bp: 3000,
            baseBp: 3000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
      });
      const advantage = analyzeBoardAdvantage(context);

      expect(advantage.status).toBe('advantage');
      expect(advantage.unitDiff).toBe(1);
    });

    it('should detect disadvantage when fewer units', () => {
      const context = createMockContext({
        myField: [],
        opponentField: [
          {
            id: 'u1',
            name: 'Unit1',
            catalogId: '1',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
          {
            id: 'u2',
            name: 'Unit2',
            catalogId: '2',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
      });
      const advantage = analyzeBoardAdvantage(context);

      expect(advantage.status).toBe('disadvantage');
    });

    it('should detect parity when equal board state', () => {
      const context = createMockContext({
        myField: [
          {
            id: 'u1',
            name: 'Unit1',
            catalogId: '1',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
        opponentField: [
          {
            id: 'u2',
            name: 'Unit2',
            catalogId: '2',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
      });
      const advantage = analyzeBoardAdvantage(context);

      expect(advantage.status).toBe('parity');
    });

    it('should calculate total BP difference', () => {
      const context = createMockContext({
        myField: [
          {
            id: 'u1',
            name: 'Unit1',
            catalogId: '1',
            bp: 7000,
            baseBp: 7000,
            cost: 3,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
        opponentField: [
          {
            id: 'u2',
            name: 'Unit2',
            catalogId: '2',
            bp: 3000,
            baseBp: 3000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
      });
      const advantage = analyzeBoardAdvantage(context);

      expect(advantage.bpDiff).toBe(4000);
    });
  });

  describe('analyzeResourceSituation', () => {
    it('should analyze life advantage', () => {
      const context = createMockContext({
        self: { life: 7, cp: { current: 3, max: 3 }, jokerGauge: 0, handCount: 5, deckCount: 30 },
        opponent: {
          life: 4,
          cp: { current: 3, max: 3 },
          jokerGauge: 0,
          handCount: 5,
          deckCount: 30,
        },
      });
      const analysis = analyzeResourceSituation(context);

      expect(analysis.lifeDiff).toBe(3);
      expect(analysis.lifeAdvantage).toBe('leading');
    });

    it('should analyze hand size difference', () => {
      const context = createMockContext({
        self: { life: 8, cp: { current: 3, max: 3 }, jokerGauge: 0, handCount: 7, deckCount: 30 },
        opponent: {
          life: 8,
          cp: { current: 3, max: 3 },
          jokerGauge: 0,
          handCount: 3,
          deckCount: 30,
        },
      });
      const analysis = analyzeResourceSituation(context);

      expect(analysis.handDiff).toBe(4);
    });

    it('should detect low hand warning', () => {
      const context = createMockContext({
        self: { life: 8, cp: { current: 3, max: 3 }, jokerGauge: 0, handCount: 1, deckCount: 30 },
        opponent: {
          life: 8,
          cp: { current: 3, max: 3 },
          jokerGauge: 0,
          handCount: 5,
          deckCount: 30,
        },
      });
      const analysis = analyzeResourceSituation(context);

      expect(analysis.warnings).toContain('手札が少ない');
    });

    it('should detect low life warning', () => {
      const context = createMockContext({
        self: { life: 2, cp: { current: 3, max: 3 }, jokerGauge: 0, handCount: 5, deckCount: 30 },
        opponent: {
          life: 8,
          cp: { current: 3, max: 3 },
          jokerGauge: 0,
          handCount: 5,
          deckCount: 30,
        },
      });
      const analysis = analyzeResourceSituation(context);

      expect(analysis.warnings).toContain('ライフが危険');
    });
  });

  describe('generateSituationalAdvice', () => {
    it('should generate advice for early game', () => {
      const context = createMockContext({ turn: 1 });
      const advice = generateSituationalAdvice(context);

      expect(advice).toBeArray();
      expect(advice.length).toBeGreaterThan(0);
    });

    it('should include defensive advice when losing', () => {
      const context = createMockContext({
        turn: 5,
        self: { life: 3, cp: { current: 5, max: 5 }, jokerGauge: 0, handCount: 3, deckCount: 20 },
        opponent: {
          life: 7,
          cp: { current: 5, max: 5 },
          jokerGauge: 0,
          handCount: 5,
          deckCount: 25,
        },
        myField: [],
        opponentField: [
          {
            id: 'u1',
            name: 'Unit1',
            catalogId: '1',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
      });
      const advice = generateSituationalAdvice(context);

      expect(advice.some(a => a.includes('防御') || a.includes('守り'))).toBe(true);
    });

    it('should include aggressive advice when winning', () => {
      const context = createMockContext({
        turn: 5,
        self: { life: 7, cp: { current: 5, max: 5 }, jokerGauge: 0, handCount: 5, deckCount: 25 },
        opponent: {
          life: 2,
          cp: { current: 5, max: 5 },
          jokerGauge: 0,
          handCount: 2,
          deckCount: 15,
        },
        myField: [
          {
            id: 'u1',
            name: 'Unit1',
            catalogId: '1',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
          {
            id: 'u2',
            name: 'Unit2',
            catalogId: '2',
            bp: 4000,
            baseBp: 4000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
        opponentField: [],
      });
      const advice = generateSituationalAdvice(context);

      expect(advice.some(a => a.includes('攻撃') || a.includes('押し切'))).toBe(true);
    });
  });

  describe('formatAnalysis', () => {
    it('should format complete analysis', () => {
      const context = createMockContext({
        turn: 5,
        myField: [
          {
            id: 'u1',
            name: 'Unit1',
            catalogId: '1',
            bp: 5000,
            baseBp: 5000,
            cost: 2,
            active: true,
            abilities: [],
            canBoot: false,
          },
        ],
      });
      const formatted = formatAnalysis(context);

      expect(formatted).toContain('ゲームフェーズ');
      expect(formatted).toContain('盤面状況');
      expect(formatted).toContain('リソース状況');
      expect(formatted).toContain('アドバイス');
    });

    it('should be well structured markdown', () => {
      const context = createMockContext();
      const formatted = formatAnalysis(context);

      // マークダウンの見出しを含む
      expect(formatted).toContain('##');
    });
  });
});

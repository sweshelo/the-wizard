// src/ai/tactics/InterceptEvaluator.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import {
  InterceptEvaluator,
  type InterceptContext,
  type InterceptEvaluation,
} from './InterceptEvaluator';
import type { CompactUnit, CompactCard } from '../types';

describe('InterceptEvaluator', () => {
  let evaluator: InterceptEvaluator;

  beforeEach(() => {
    evaluator = new InterceptEvaluator();
  });

  // ヘルパー関数
  function createUnit(overrides: Partial<CompactUnit> = {}): CompactUnit {
    return {
      id: 'u1',
      name: 'TestUnit',
      catalogId: '1-0-001',
      bp: 5000,
      baseBp: 5000,
      cost: 3,
      active: true,
      abilities: [],
      canBoot: false,
      ...overrides,
    };
  }

  function createIntercept(overrides: Partial<CompactCard> = {}): CompactCard {
    return {
      id: 'c1',
      name: 'TestIntercept',
      catalogId: '1-0-100',
      cost: 2,
      type: 'intercept',
      playable: true,
      ...overrides,
    };
  }

  function createContext(overrides: Partial<InterceptContext> = {}): InterceptContext {
    return {
      availableIntercepts: [],
      currentBattle: null,
      myField: [],
      opponentField: [],
      myLife: 8,
      opponentLife: 8,
      currentCp: 3,
      gamePhase: 'mid',
      ...overrides,
    };
  }

  describe('canActivate', () => {
    it('should return true when intercept is playable and has enough CP', () => {
      const intercept = createIntercept({ cost: 2, playable: true });
      const context = createContext({ currentCp: 3 });

      const result = evaluator.canActivate(intercept, context);

      expect(result).toBe(true);
    });

    it('should return false when not enough CP', () => {
      const intercept = createIntercept({ cost: 4, playable: false });
      const context = createContext({ currentCp: 2 });

      const result = evaluator.canActivate(intercept, context);

      expect(result).toBe(false);
    });

    it('should return false for non-intercept cards', () => {
      const card = createIntercept({ type: 'unit' });
      const context = createContext();

      const result = evaluator.canActivate(card, context);

      expect(result).toBe(false);
    });
  });

  describe('evaluateIntercept', () => {
    it('should recommend using BP boost intercept in losing battle', () => {
      const intercept = createIntercept({
        name: 'BPブースト',
        catalogId: 'bp-boost-001',
      });
      const context = createContext({
        availableIntercepts: [intercept],
        currentBattle: {
          attacker: createUnit({ id: 'att', bp: 6000 }),
          defender: createUnit({ id: 'def', bp: 4000 }),
          isMyAttack: false,
        },
        currentCp: 3,
      });

      const result = evaluator.evaluateIntercept(intercept, context);

      expect(result.shouldUse).toBe(true);
      expect(result.value).toBeGreaterThan(0);
    });

    it('should recommend holding intercept when no immediate benefit', () => {
      const intercept = createIntercept({ name: '汎用インターセプト' });
      const context = createContext({
        availableIntercepts: [intercept],
        currentBattle: null, // 戦闘中でない
        currentCp: 3,
      });

      const result = evaluator.evaluateIntercept(intercept, context);

      expect(result.shouldUse).toBe(false);
      expect(result.reason).toContain('温存');
    });

    it('should prioritize intercept when life is critical', () => {
      const intercept = createIntercept({ name: '防御インターセプト' });
      const context = createContext({
        availableIntercepts: [intercept],
        currentBattle: {
          attacker: createUnit({ id: 'att', bp: 5000 }),
          defender: null, // ダイレクトアタック
          isMyAttack: false,
        },
        myLife: 1,
        currentCp: 3,
      });

      const result = evaluator.evaluateIntercept(intercept, context);

      // ライフ1でダイレクトアタックを受けている時は使用推奨
      expect(result.value).toBeGreaterThan(5);
    });

    it('should consider saving intercept for better opportunity', () => {
      const intercept = createIntercept({ name: '強力インターセプト', cost: 3 });
      const context = createContext({
        availableIntercepts: [intercept],
        currentBattle: {
          attacker: createUnit({ id: 'att', bp: 3000 }),
          defender: createUnit({ id: 'def', bp: 5000 }), // 既に勝ってる
          isMyAttack: false,
        },
        currentCp: 3,
      });

      const result = evaluator.evaluateIntercept(intercept, context);

      // 既に戦闘に勝っているなら温存
      expect(result.shouldUse).toBe(false);
    });
  });

  describe('rankIntercepts', () => {
    it('should rank intercepts by value', () => {
      const intercepts = [
        createIntercept({ id: 'c1', name: '弱いインターセプト', cost: 1 }),
        createIntercept({ id: 'c2', name: '強いインターセプト', cost: 3 }),
      ];
      const context = createContext({
        availableIntercepts: intercepts,
        currentBattle: {
          attacker: createUnit({ bp: 5000 }),
          defender: createUnit({ bp: 3000 }),
          isMyAttack: false,
        },
        currentCp: 5,
      });

      const ranked = evaluator.rankIntercepts(intercepts, context);

      expect(ranked.length).toBeGreaterThan(0);
      // 高コストのほうが強い想定でソート
    });

    it('should filter out unplayable intercepts', () => {
      const intercepts = [
        createIntercept({ id: 'c1', cost: 2, playable: true }),
        createIntercept({ id: 'c2', cost: 5, playable: false }),
      ];
      const context = createContext({
        availableIntercepts: intercepts,
        currentCp: 3,
      });

      const ranked = evaluator.rankIntercepts(intercepts, context);

      expect(ranked.every(r => r.intercept.playable)).toBe(true);
    });
  });

  describe('shouldHoldIntercept', () => {
    it('should recommend holding in early game', () => {
      const intercept = createIntercept({ cost: 3 });
      const context = createContext({
        gamePhase: 'early',
        myLife: 8,
        opponentLife: 8,
      });

      const result = evaluator.shouldHoldIntercept(intercept, context);

      expect(result.hold).toBe(true);
      expect(result.reason).toContain('序盤');
    });

    it('should not recommend holding when life is low', () => {
      const intercept = createIntercept({ cost: 3 });
      const context = createContext({
        gamePhase: 'mid',
        myLife: 2,
        opponentLife: 6,
      });

      const result = evaluator.shouldHoldIntercept(intercept, context);

      expect(result.hold).toBe(false);
    });

    it('should recommend using in late game with winning position', () => {
      const intercept = createIntercept({ cost: 3 });
      const context = createContext({
        gamePhase: 'late',
        myLife: 6,
        opponentLife: 2,
      });

      const result = evaluator.shouldHoldIntercept(intercept, context);

      // 終盤で有利なら押し切りに使う
      expect(result.hold).toBe(false);
    });
  });

  describe('evaluateBattleImpact', () => {
    it('should calculate positive impact when turning battle around', () => {
      const context = createContext({
        currentBattle: {
          attacker: createUnit({ bp: 6000 }),
          defender: createUnit({ bp: 4000 }),
          isMyAttack: false,
        },
      });

      // 2000 BPブーストで勝てるようになる
      const impact = evaluator.evaluateBattleImpact(2000, context);

      expect(impact).toBeGreaterThan(0);
    });

    it('should calculate zero impact when no battle', () => {
      const context = createContext({
        currentBattle: null,
      });

      const impact = evaluator.evaluateBattleImpact(2000, context);

      expect(impact).toBe(0);
    });

    it('should calculate high impact for preventing lethal', () => {
      const context = createContext({
        currentBattle: {
          attacker: createUnit({ bp: 5000 }),
          defender: null, // ダイレクトアタック
          isMyAttack: false,
        },
        myLife: 1,
      });

      const impact = evaluator.evaluateBattleImpact(0, context);

      // ダイレクトアタックを防ぐ価値は高い
      expect(impact).toBeGreaterThan(5);
    });
  });
});

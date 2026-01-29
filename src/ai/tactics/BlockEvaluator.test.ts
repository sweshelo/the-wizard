// src/ai/tactics/BlockEvaluator.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { BlockEvaluator, type BlockContext, type BlockEvaluation } from './BlockEvaluator';
import type { CompactUnit } from '../types';

describe('BlockEvaluator', () => {
  let evaluator: BlockEvaluator;

  beforeEach(() => {
    evaluator = new BlockEvaluator();
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

  function createContext(overrides: Partial<BlockContext> = {}): BlockContext {
    return {
      attacker: createUnit({ id: 'attacker', bp: 5000 }),
      blockerCandidates: [],
      myLife: 8,
      opponentLife: 8,
      myHandCount: 5,
      myTriggerCount: 0,
      ...overrides,
    };
  }

  describe('evaluateBlock', () => {
    it('should recommend block when blocker BP is higher', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 4000 }),
        blockerCandidates: [createUnit({ id: 'b1', bp: 5000, active: true })],
      });

      const result = evaluator.evaluateBlock(context);

      expect(result.shouldBlock).toBe(true);
      expect(result.recommendedBlocker?.id).toBe('b1');
    });

    it('should not recommend block when no active blockers', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 4000 }),
        blockerCandidates: [createUnit({ id: 'b1', bp: 5000, active: false })],
      });

      const result = evaluator.evaluateBlock(context);

      expect(result.shouldBlock).toBe(false);
      expect(result.recommendedBlocker).toBeUndefined();
    });

    it('should consider trading when BP is equal', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 5000 }),
        blockerCandidates: [createUnit({ id: 'b1', bp: 5000, active: true })],
      });

      const result = evaluator.evaluateBlock(context);

      // 同BPトレードの評価
      expect(result.tradeValue).toBeDefined();
    });

    it('should select best blocker from multiple candidates', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 5000 }),
        blockerCandidates: [
          createUnit({ id: 'b1', bp: 4000, active: true }),
          createUnit({ id: 'b2', bp: 6000, active: true }),
          createUnit({ id: 'b3', bp: 5500, active: true }),
        ],
      });

      const result = evaluator.evaluateBlock(context);

      // BP差が小さく勝てるブロッカーを選ぶ
      expect(result.shouldBlock).toBe(true);
      expect(result.recommendedBlocker?.id).toBe('b3'); // 5500で勝てる最小BP
    });

    it('should recommend not blocking when life is safe', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 7000 }),
        blockerCandidates: [createUnit({ id: 'b1', bp: 3000, active: true })],
        myLife: 8,
      });

      const result = evaluator.evaluateBlock(context);

      // 勝てないならブロックしない（ライフに余裕がある時）
      expect(result.shouldBlock).toBe(false);
    });

    it('should recommend blocking when life is critical', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 7000 }),
        blockerCandidates: [createUnit({ id: 'b1', bp: 3000, active: true })],
        myLife: 1, // ライフ1は危機的
      });

      const result = evaluator.evaluateBlock(context);

      // ライフ危機的な時は負けてもブロック
      expect(result.shouldBlock).toBe(true);
    });

    it('should factor in 不屈 ability', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 5000 }),
        blockerCandidates: [
          createUnit({ id: 'b1', bp: 4000, active: true, abilities: ['不屈'] }),
          createUnit({ id: 'b2', bp: 4500, active: true }),
        ],
      });

      const result = evaluator.evaluateBlock(context);

      // 不屈持ちは破壊されても復帰できるので優先
      expect(result.recommendedBlocker?.id).toBe('b1');
    });

    it('should avoid blocking with valuable units', () => {
      const context = createContext({
        attacker: createUnit({ id: 'attacker', bp: 5000 }),
        blockerCandidates: [
          createUnit({ id: 'b1', bp: 5500, cost: 7, active: true }), // 高コストユニット
          createUnit({ id: 'b2', bp: 5500, cost: 2, active: true }), // 低コストユニット
        ],
        myLife: 6,
      });

      const result = evaluator.evaluateBlock(context);

      // 同じBPなら低コストでブロック
      expect(result.recommendedBlocker?.id).toBe('b2');
    });
  });

  describe('rankBlockers', () => {
    it('should rank blockers by efficiency', () => {
      const attacker = createUnit({ id: 'attacker', bp: 5000 });
      const candidates = [
        createUnit({ id: 'b1', bp: 4000, active: true }),
        createUnit({ id: 'b2', bp: 6000, active: true }),
        createUnit({ id: 'b3', bp: 5500, active: true }),
      ];

      const ranked = evaluator.rankBlockers(attacker, candidates);

      // 勝てる最小BPが上位
      expect(ranked[0].unit.id).toBe('b3');
      expect(ranked[1].unit.id).toBe('b2');
    });

    it('should filter out inactive blockers', () => {
      const attacker = createUnit({ id: 'attacker', bp: 5000 });
      const candidates = [
        createUnit({ id: 'b1', bp: 6000, active: false }),
        createUnit({ id: 'b2', bp: 5500, active: true }),
      ];

      const ranked = evaluator.rankBlockers(attacker, candidates);

      expect(ranked.length).toBe(1);
      expect(ranked[0].unit.id).toBe('b2');
    });
  });

  describe('calculateBlockValue', () => {
    it('should calculate positive value when winning battle', () => {
      const attacker = createUnit({ bp: 5000 });
      const blocker = createUnit({ bp: 6000 });

      const value = evaluator.calculateBlockValue(attacker, blocker);

      expect(value).toBeGreaterThan(0);
    });

    it('should calculate negative value when losing battle', () => {
      const attacker = createUnit({ bp: 7000 });
      const blocker = createUnit({ bp: 4000 });

      const value = evaluator.calculateBlockValue(attacker, blocker);

      expect(value).toBeLessThan(0);
    });

    it('should return zero for trade', () => {
      const attacker = createUnit({ bp: 5000 });
      const blocker = createUnit({ bp: 5000 });

      const value = evaluator.calculateBlockValue(attacker, blocker);

      expect(value).toBe(0);
    });
  });
});

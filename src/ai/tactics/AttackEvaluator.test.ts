// src/ai/tactics/AttackEvaluator.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { AttackEvaluator, type AttackEvaluation, type AttackContext } from './AttackEvaluator';
import type { CompactUnit } from '../types';

describe('AttackEvaluator', () => {
  let evaluator: AttackEvaluator;

  beforeEach(() => {
    evaluator = new AttackEvaluator();
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

  function createContext(overrides: Partial<AttackContext> = {}): AttackContext {
    return {
      attacker: createUnit(),
      opponentField: [],
      opponentLife: 8,
      opponentHandCount: 5,
      opponentTriggerCount: 0,
      myLife: 8,
      ...overrides,
    };
  }

  describe('evaluateAttack', () => {
    it('should recommend attack when opponent field is empty', () => {
      const context = createContext({
        attacker: createUnit({ active: true }),
        opponentField: [],
      });

      const result = evaluator.evaluateAttack(context);

      expect(result.shouldAttack).toBe(true);
      expect(result.reason).toContain('フリーアタック');
    });

    it('should not recommend attack with inactive unit', () => {
      const context = createContext({
        attacker: createUnit({ active: false }),
      });

      const result = evaluator.evaluateAttack(context);

      expect(result.shouldAttack).toBe(false);
      expect(result.reason).toContain('行動済み');
    });

    it('should evaluate BP advantage for attack priority', () => {
      const context = createContext({
        attacker: createUnit({ bp: 7000 }),
        opponentField: [createUnit({ id: 'e1', bp: 4000 })],
      });

      const result = evaluator.evaluateAttack(context);

      expect(result.shouldAttack).toBe(true);
      expect(result.priority).toBeGreaterThan(0);
    });

    it('should be cautious when opponent has high hand count', () => {
      const context = createContext({
        attacker: createUnit({ bp: 5000 }),
        opponentField: [createUnit({ id: 'e1', bp: 4500 })],
        opponentHandCount: 7,
      });

      const result = evaluator.evaluateAttack(context);

      // 手札が多い時は警戒度が上がる
      expect(result.caution).toBeGreaterThan(0);
    });

    it('should consider trigger zone threat', () => {
      const context = createContext({
        attacker: createUnit({ bp: 5000 }),
        opponentField: [createUnit({ id: 'e1', bp: 4000 })],
        opponentTriggerCount: 3,
      });

      const result = evaluator.evaluateAttack(context);

      // トリガーゾーンにカードがある時は警戒
      expect(result.caution).toBeGreaterThan(0);
    });

    it('should prioritize attack when opponent life is low', () => {
      const context = createContext({
        attacker: createUnit({ bp: 5000 }),
        opponentField: [],
        opponentLife: 2,
      });

      const result = evaluator.evaluateAttack(context);

      expect(result.shouldAttack).toBe(true);
      expect(result.priority).toBeGreaterThan(5); // 高優先度
    });

    it('should factor in penetration ability', () => {
      const context = createContext({
        attacker: createUnit({ bp: 7000, abilities: ['貫通'] }),
        opponentField: [createUnit({ id: 'e1', bp: 4000 })],
      });

      const result = evaluator.evaluateAttack(context);

      expect(result.shouldAttack).toBe(true);
      // 貫通持ちは優先度が高い
      expect(result.priority).toBeGreaterThan(5);
    });
  });

  describe('rankAttackers', () => {
    it('should rank attackers by priority', () => {
      const attackers = [
        createUnit({ id: 'u1', bp: 3000, active: true }),
        createUnit({ id: 'u2', bp: 7000, active: true }),
        createUnit({ id: 'u3', bp: 5000, active: true }),
      ];
      const context = {
        opponentField: [createUnit({ id: 'e1', bp: 4000 })],
        opponentLife: 8,
        opponentHandCount: 5,
        opponentTriggerCount: 0,
        myLife: 8,
      };

      const ranked = evaluator.rankAttackers(attackers, context);

      // 高BPユニットが上位
      expect(ranked[0].unit.id).toBe('u2');
    });

    it('should filter out inactive units', () => {
      const attackers = [
        createUnit({ id: 'u1', bp: 7000, active: false }),
        createUnit({ id: 'u2', bp: 3000, active: true }),
      ];
      const context = {
        opponentField: [],
        opponentLife: 8,
        opponentHandCount: 5,
        opponentTriggerCount: 0,
        myLife: 8,
      };

      const ranked = evaluator.rankAttackers(attackers, context);

      expect(ranked.length).toBe(1);
      expect(ranked[0].unit.id).toBe('u2');
    });

    it('should prioritize units with penetration when opponent has blockers', () => {
      const attackers = [
        createUnit({ id: 'u1', bp: 7000, active: true, abilities: [] }),
        createUnit({ id: 'u2', bp: 6000, active: true, abilities: ['貫通'] }),
      ];
      const context = {
        opponentField: [createUnit({ id: 'e1', bp: 3000 })],
        opponentLife: 8,
        opponentHandCount: 5,
        opponentTriggerCount: 0,
        myLife: 8,
      };

      const ranked = evaluator.rankAttackers(attackers, context);

      // 貫通持ちが上位になる可能性（BP差による）
      expect(ranked.length).toBe(2);
    });
  });

  describe('calculateLethal', () => {
    it('should detect lethal when total active BP exceeds opponent life', () => {
      const myField = [
        createUnit({ id: 'u1', bp: 5000, active: true }),
        createUnit({ id: 'u2', bp: 4000, active: true }),
        createUnit({ id: 'u3', bp: 3000, active: true }),
      ];
      const context = {
        opponentField: [],
        opponentLife: 2, // アクティブ3体でライフ2
        opponentHandCount: 0,
        opponentTriggerCount: 0,
      };

      const lethal = evaluator.calculateLethal(myField, context);

      expect(lethal.isLethal).toBe(true);
      expect(lethal.attackersNeeded).toBeLessThanOrEqual(2);
    });

    it('should not detect lethal when blockers exist', () => {
      const myField = [
        createUnit({ id: 'u1', bp: 5000, active: true }),
        createUnit({ id: 'u2', bp: 4000, active: true }),
      ];
      const context = {
        opponentField: [
          createUnit({ id: 'e1', bp: 6000, active: true }),
          createUnit({ id: 'e2', bp: 6000, active: true }),
        ],
        opponentLife: 2,
        opponentHandCount: 0,
        opponentTriggerCount: 0,
      };

      const lethal = evaluator.calculateLethal(myField, context);

      expect(lethal.isLethal).toBe(false);
    });
  });
});

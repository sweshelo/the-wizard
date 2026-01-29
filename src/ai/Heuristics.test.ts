// src/ai/Heuristics.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { Heuristics, createHeuristics, DEFAULT_HEURISTICS_CONFIG } from './Heuristics';
import type { AIGameContext, CompactCard, CompactUnit } from './types';

// テスト用のモックデータ
const createMockContext = (overrides: Partial<AIGameContext> = {}): AIGameContext => ({
  turn: 1,
  round: 1,
  isMyTurn: true,
  self: {
    life: 8,
    cp: { current: 4, max: 4 },
    jokerGauge: 0,
    handCount: 5,
    deckCount: 35,
  },
  opponent: {
    life: 8,
    cp: { current: 4, max: 4 },
    jokerGauge: 0,
    handCount: 5,
    deckCount: 35,
  },
  myField: [],
  opponentField: [],
  myHand: [],
  myTrigger: [],
  recentEvents: [],
  ...overrides,
});

const createMockCard = (overrides: Partial<CompactCard> = {}): CompactCard => ({
  id: 'c1',
  name: 'Test Card',
  catalogId: 'CAT001',
  cost: 3,
  type: 'unit',
  playable: true,
  ...overrides,
});

const createMockUnit = (overrides: Partial<CompactUnit> = {}): CompactUnit => ({
  id: 'u1',
  name: 'Test Unit',
  catalogId: 'CAT001',
  bp: 5000,
  baseBp: 5000,
  cost: 3,
  active: true,
  abilities: [],
  canBoot: false,
  ...overrides,
});

describe('Heuristics', () => {
  let heuristics: Heuristics;

  beforeEach(() => {
    heuristics = createHeuristics();
  });

  describe('initialization', () => {
    it('should use default config', () => {
      const h = new Heuristics();
      expect(h).toBeInstanceOf(Heuristics);
    });

    it('should accept custom config', () => {
      const h = createHeuristics({ highCostThreshold: 6 });
      expect(h).toBeInstanceOf(Heuristics);
    });

    it('should have correct default config values', () => {
      expect(DEFAULT_HEURISTICS_CONFIG.maxHighCostCardsForKeep).toBe(2);
      expect(DEFAULT_HEURISTICS_CONFIG.highCostThreshold).toBe(5);
      expect(DEFAULT_HEURISTICS_CONFIG.blockBPThreshold).toBe(1000);
    });
  });

  describe('decideMulligan', () => {
    it('should not mulligan with empty hand', () => {
      const context = createMockContext({ myHand: [] });
      const result = heuristics.decideMulligan(context);

      expect(result.shouldMulligan).toBe(false);
      expect(result.reason).toContain('手札が空');
    });

    it('should mulligan when too many high cost cards', () => {
      const hand: CompactCard[] = [
        createMockCard({ id: 'c1', cost: 5 }),
        createMockCard({ id: 'c2', cost: 6 }),
        createMockCard({ id: 'c3', cost: 7 }),
        createMockCard({ id: 'c4', cost: 4 }),
      ];
      const context = createMockContext({ myHand: hand });
      const result = heuristics.decideMulligan(context);

      expect(result.shouldMulligan).toBe(true);
      expect(result.reason).toContain('高コストカード');
    });

    it('should mulligan when no low cost units', () => {
      const hand: CompactCard[] = [
        createMockCard({ id: 'c1', cost: 4, type: 'intercept' }),
        createMockCard({ id: 'c2', cost: 4, type: 'trigger' }),
        createMockCard({ id: 'c3', cost: 4, type: 'unit' }),
      ];
      const context = createMockContext({ myHand: hand });
      const result = heuristics.decideMulligan(context);

      expect(result.shouldMulligan).toBe(true);
      expect(result.reason).toContain('序盤に出せるユニットがない');
    });

    it('should keep hand with good distribution', () => {
      const hand: CompactCard[] = [
        createMockCard({ id: 'c1', cost: 2, type: 'unit' }),
        createMockCard({ id: 'c2', cost: 3, type: 'unit' }),
        createMockCard({ id: 'c3', cost: 4, type: 'unit' }),
        createMockCard({ id: 'c4', cost: 2, type: 'intercept' }),
      ];
      const context = createMockContext({ myHand: hand });
      const result = heuristics.decideMulligan(context);

      expect(result.shouldMulligan).toBe(false);
      expect(result.reason).toContain('コスト分布が適切');
    });
  });

  describe('decideUnitSummon', () => {
    it('should return null when no playable units', () => {
      const context = createMockContext({ myHand: [] });
      const result = heuristics.decideUnitSummon(context);

      expect(result).toBeNull();
    });

    it('should select highest cost playable unit', () => {
      const hand: CompactCard[] = [
        createMockCard({ id: 'c1', name: 'Low Cost', cost: 2, type: 'unit', playable: true }),
        createMockCard({ id: 'c2', name: 'High Cost', cost: 4, type: 'unit', playable: true }),
        createMockCard({ id: 'c3', name: 'Too Expensive', cost: 6, type: 'unit', playable: false }),
      ];
      const context = createMockContext({ myHand: hand });
      const result = heuristics.decideUnitSummon(context);

      expect(result).not.toBeNull();
      expect(result?.action).toBe('UnitDrive');
      expect(result?.targetId).toBe('c2');
      expect(result?.reason).toContain('High Cost');
    });

    it('should not select non-unit cards', () => {
      const hand: CompactCard[] = [
        createMockCard({ id: 'c1', cost: 2, type: 'intercept', playable: true }),
        createMockCard({ id: 'c2', cost: 3, type: 'trigger', playable: true }),
      ];
      const context = createMockContext({ myHand: hand });
      const result = heuristics.decideUnitSummon(context);

      expect(result).toBeNull();
    });
  });

  describe('decideBlock', () => {
    it('should return empty when no blockers available', () => {
      const context = createMockContext();
      const result = heuristics.decideBlock(context, 5000, []);

      expect(result.selectedIds).toHaveLength(0);
      expect(result.reason).toContain('ブロック可能なユニットがいない');
    });

    it('should select blocker that can win trade', () => {
      const blockers: CompactUnit[] = [
        createMockUnit({ id: 'u1', name: 'Small', bp: 3000 }),
        createMockUnit({ id: 'u2', name: 'Medium', bp: 5000 }),
        createMockUnit({ id: 'u3', name: 'Large', bp: 7000 }),
      ];
      const context = createMockContext();
      const result = heuristics.decideBlock(context, 5000, blockers);

      expect(result.selectedIds).toHaveLength(1);
      expect(result.selectedIds[0]).toBe('u2'); // 最小のBPで相打ち取れるユニット
    });

    it('should not block when no favorable trade and life is safe', () => {
      const blockers: CompactUnit[] = [
        createMockUnit({ id: 'u1', bp: 3000 }),
        createMockUnit({ id: 'u2', bp: 4000 }),
      ];
      const context = createMockContext();
      const result = heuristics.decideBlock(context, 6000, blockers);

      expect(result.selectedIds).toHaveLength(0);
      expect(result.reason).toContain('スルー');
    });

    it('should block when life is critical even without favorable trade', () => {
      const blockers: CompactUnit[] = [createMockUnit({ id: 'u1', name: 'Wall', bp: 4000 })];
      const context = createMockContext({
        self: { life: 2, cp: { current: 4, max: 4 }, jokerGauge: 0, handCount: 3, deckCount: 20 },
      });
      const result = heuristics.decideBlock(context, 6000, blockers);

      expect(result.selectedIds).toHaveLength(1);
      expect(result.selectedIds[0]).toBe('u1');
      expect(result.reason).toContain('ライフが危険');
    });
  });

  describe('decideCardSelection', () => {
    it('should return empty when no cards available', () => {
      const context = createMockContext();
      const result = heuristics.decideCardSelection([], 1, context);

      expect(result.selectedIds).toHaveLength(0);
    });

    it('should select cards by cost (lowest first)', () => {
      const cards: CompactCard[] = [
        createMockCard({ id: 'c1', name: 'High', cost: 5 }),
        createMockCard({ id: 'c2', name: 'Low', cost: 2 }),
        createMockCard({ id: 'c3', name: 'Mid', cost: 3 }),
      ];
      const context = createMockContext();
      const result = heuristics.decideCardSelection(cards, 2, context);

      expect(result.selectedIds).toHaveLength(2);
      expect(result.selectedIds).toContain('c2');
      expect(result.selectedIds).toContain('c3');
    });
  });

  describe('decideUnitSelection', () => {
    it('should return empty when no units available', () => {
      const context = createMockContext();
      const result = heuristics.decideUnitSelection([], context, false);

      expect(result.selectedIds).toHaveLength(0);
    });

    it('should select weakest unit', () => {
      const units: CompactUnit[] = [
        createMockUnit({ id: 'u1', name: 'Strong', bp: 7000 }),
        createMockUnit({ id: 'u2', name: 'Weak', bp: 3000 }),
        createMockUnit({ id: 'u3', name: 'Medium', bp: 5000 }),
      ];
      const context = createMockContext();
      const result = heuristics.decideUnitSelection(units, context, false);

      expect(result.selectedIds).toHaveLength(1);
      expect(result.selectedIds[0]).toBe('u2');
    });

    it('should cancel when all units are valuable and cancelable', () => {
      const units: CompactUnit[] = [
        createMockUnit({ id: 'u1', bp: 6000 }),
        createMockUnit({ id: 'u2', bp: 7000 }),
      ];
      const context = createMockContext();
      const result = heuristics.decideUnitSelection(units, context, true);

      expect(result.selectedIds).toHaveLength(0);
      expect(result.reason).toContain('キャンセル');
    });
  });

  describe('decideIntercept', () => {
    it('should return empty when no intercepts available', () => {
      const context = createMockContext();
      const result = heuristics.decideIntercept([], context);

      expect(result.selectedIds).toHaveLength(0);
    });

    it('should conserve intercepts by default', () => {
      const intercepts: CompactCard[] = [
        createMockCard({ id: 'i1', type: 'intercept', name: 'Counter' }),
      ];
      const context = createMockContext();
      const result = heuristics.decideIntercept(intercepts, context);

      expect(result.selectedIds).toHaveLength(0);
      expect(result.reason).toContain('温存');
    });
  });

  describe('decideOption', () => {
    it('should return empty when no options available', () => {
      const context = createMockContext();
      const result = heuristics.decideOption([], context);

      expect(result.selectedIds).toHaveLength(0);
    });

    it('should select first option by default', () => {
      const options = [
        { id: 'opt1', description: 'First Option' },
        { id: 'opt2', description: 'Second Option' },
      ];
      const context = createMockContext();
      const result = heuristics.decideOption(options, context);

      expect(result.selectedIds).toHaveLength(1);
      expect(result.selectedIds[0]).toBe('opt1');
      expect(result.reason).toContain('First Option');
    });
  });

  describe('shouldEndTurn', () => {
    it('should end turn when no playable cards', () => {
      const context = createMockContext({ myHand: [] });
      const result = heuristics.shouldEndTurn(context);

      expect(result.action).toBe('TurnEnd');
    });

    it('should summon unit when possible', () => {
      const hand: CompactCard[] = [
        createMockCard({ id: 'c1', name: 'Unit', cost: 3, type: 'unit', playable: true }),
      ];
      const context = createMockContext({ myHand: hand });
      const result = heuristics.shouldEndTurn(context);

      expect(result.action).toBe('UnitDrive');
      expect(result.targetId).toBe('c1');
    });

    it('should end turn when only non-unit cards are playable', () => {
      const hand: CompactCard[] = [
        createMockCard({ id: 'c1', cost: 3, type: 'intercept', playable: true }),
      ];
      const context = createMockContext({ myHand: hand });
      const result = heuristics.shouldEndTurn(context);

      expect(result.action).toBe('TurnEnd');
    });
  });
});

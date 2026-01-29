// src/ai/ComplexityEvaluator.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  ComplexityEvaluator,
  createComplexityEvaluator,
  DEFAULT_COMPLEXITY_CONFIG,
} from './ComplexityEvaluator';
import type { AIGameContext, CompactUnit, CompactCard } from './types';

// テスト用のモックデータ
const createMockContext = (overrides: Partial<AIGameContext> = {}): AIGameContext => ({
  turn: 5,
  round: 3,
  isMyTurn: true,
  self: {
    life: 6,
    cp: { current: 5, max: 7 },
    jokerGauge: 3,
    handCount: 4,
    deckCount: 25,
  },
  opponent: {
    life: 5,
    cp: { current: 4, max: 7 },
    jokerGauge: 4,
    handCount: 3,
    deckCount: 22,
  },
  myField: [],
  opponentField: [],
  myHand: [],
  myTrigger: [],
  recentEvents: [],
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

const createMockCard = (overrides: Partial<CompactCard> = {}): CompactCard => ({
  id: 'c1',
  name: 'Test Card',
  catalogId: 'CAT001',
  cost: 2,
  type: 'unit',
  playable: true,
  ...overrides,
});

describe('ComplexityEvaluator', () => {
  let evaluator: ComplexityEvaluator;

  beforeEach(() => {
    evaluator = createComplexityEvaluator();
  });

  describe('initialization', () => {
    it('should use default config', () => {
      expect(evaluator).toBeInstanceOf(ComplexityEvaluator);
    });

    it('should accept custom config', () => {
      const customEvaluator = createComplexityEvaluator({ opusThreshold: 10 });
      expect(customEvaluator).toBeInstanceOf(ComplexityEvaluator);
    });

    it('should have correct default config values', () => {
      expect(DEFAULT_COMPLEXITY_CONFIG.opusThreshold).toBe(5);
      expect(DEFAULT_COMPLEXITY_CONFIG.sonnetThreshold).toBe(2);
    });
  });

  describe('evaluate - empty board', () => {
    it('should return score 0 for empty board', () => {
      const context = createMockContext();
      const result = evaluator.evaluate(context);

      expect(result.score).toBe(0);
      expect(result.hasNonEntryEffects).toBe(false);
      expect(result.deltaCount).toBe(0);
      expect(result.triggerZoneActive).toBe(false);
      expect(result.interceptsInHand).toBe(0);
      expect(result.opponentFieldThreats).toBe(0);
      expect(result.myFieldUnitCount).toBe(0);
      expect(result.opponentFieldUnitCount).toBe(0);
      expect(result.recommendedModel).toBe('haiku');
    });
  });

  describe('evaluate - unit count', () => {
    it('should increase score based on unit count', () => {
      const context = createMockContext({
        myField: [
          createMockUnit({ id: 'u1' }),
          createMockUnit({ id: 'u2' }),
          createMockUnit({ id: 'u3' }),
        ],
        opponentField: [
          createMockUnit({ id: 'u4' }),
          createMockUnit({ id: 'u5' }),
          createMockUnit({ id: 'u6' }),
        ],
      });
      const result = evaluator.evaluate(context);

      expect(result.myFieldUnitCount).toBe(3);
      expect(result.opponentFieldUnitCount).toBe(3);
      expect(result.score).toBeGreaterThanOrEqual(2); // 6+ units
    });
  });

  describe('evaluate - non-entry effects', () => {
    it('should detect non-entry effects', () => {
      const context = createMockContext({
        myField: [createMockUnit({ abilities: ['不屈'] })],
      });
      const result = evaluator.evaluate(context);

      expect(result.hasNonEntryEffects).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it('should detect multiple keywords', () => {
      const context = createMockContext({
        myField: [createMockUnit({ abilities: ['不屈', '貫通'] })],
      });
      const result = evaluator.evaluate(context);

      expect(result.hasNonEntryEffects).toBe(true);
      expect(result.deltaCount).toBe(2);
    });
  });

  describe('evaluate - trigger zone', () => {
    it('should detect active trigger zone', () => {
      const context = createMockContext({
        myTrigger: [createMockCard({ type: 'trigger' })],
      });
      const result = evaluator.evaluate(context);

      expect(result.triggerZoneActive).toBe(true);
      expect(result.score).toBeGreaterThanOrEqual(2);
    });
  });

  describe('evaluate - intercepts in hand', () => {
    it('should count intercepts', () => {
      const context = createMockContext({
        myHand: [
          createMockCard({ id: 'c1', type: 'intercept' }),
          createMockCard({ id: 'c2', type: 'intercept' }),
          createMockCard({ id: 'c3', type: 'unit' }),
        ],
      });
      const result = evaluator.evaluate(context);

      expect(result.interceptsInHand).toBe(2);
      expect(result.score).toBeGreaterThanOrEqual(2);
    });
  });

  describe('evaluate - opponent threats', () => {
    it('should evaluate high BP units as threats', () => {
      const context = createMockContext({
        opponentField: [createMockUnit({ bp: 7000, active: true })],
      });
      const result = evaluator.evaluate(context);

      expect(result.opponentFieldThreats).toBeGreaterThanOrEqual(3); // 7000+ BP + active
    });

    it('should evaluate units with dangerous abilities', () => {
      const context = createMockContext({
        opponentField: [createMockUnit({ abilities: ['不屈', '貫通'], active: true })],
      });
      const result = evaluator.evaluate(context);

      expect(result.opponentFieldThreats).toBeGreaterThanOrEqual(3);
    });
  });

  describe('shouldUseOpus', () => {
    it('should return false for simple boards', () => {
      const context = createMockContext();
      expect(evaluator.shouldUseOpus(context)).toBe(false);
    });

    it('should return true for complex boards', () => {
      const context = createMockContext({
        myField: [
          createMockUnit({ abilities: ['不屈', '貫通'] }),
          createMockUnit({ abilities: ['加護'] }),
        ],
        opponentField: [createMockUnit({ bp: 7000, abilities: ['不死'], active: true })],
        myTrigger: [createMockCard({ type: 'trigger' })],
        myHand: [createMockCard({ type: 'intercept' }), createMockCard({ type: 'intercept' })],
      });
      expect(evaluator.shouldUseOpus(context)).toBe(true);
    });
  });

  describe('getRecommendedModel', () => {
    it('should recommend haiku for simple boards', () => {
      const context = createMockContext();
      expect(evaluator.getRecommendedModel(context)).toBe('haiku');
    });

    it('should recommend sonnet for moderate complexity', () => {
      const context = createMockContext({
        myField: [createMockUnit()],
        opponentField: [createMockUnit()],
        myTrigger: [createMockCard({ type: 'trigger' })],
      });
      const result = evaluator.evaluate(context);
      // Score should be around 2-4 for sonnet
      expect(['haiku', 'sonnet']).toContain(result.recommendedModel);
    });

    it('should recommend opus for complex boards', () => {
      const context = createMockContext({
        myField: [
          createMockUnit({ abilities: ['不屈', '貫通'] }),
          createMockUnit({ abilities: ['加護'] }),
          createMockUnit(),
        ],
        opponentField: [
          createMockUnit({ bp: 8000, abilities: ['不死'], active: true }),
          createMockUnit({ bp: 6000, active: true }),
        ],
        myTrigger: [createMockCard({ type: 'trigger' })],
        myHand: [createMockCard({ type: 'intercept' }), createMockCard({ type: 'intercept' })],
      });
      expect(evaluator.getRecommendedModel(context)).toBe('opus');
    });
  });

  describe('custom thresholds', () => {
    it('should respect custom opus threshold', () => {
      const customEvaluator = createComplexityEvaluator({ opusThreshold: 100 });
      const context = createMockContext({
        myField: [createMockUnit({ abilities: ['不屈'] })],
      });
      expect(customEvaluator.shouldUseOpus(context)).toBe(false);
    });

    it('should respect custom sonnet threshold', () => {
      const customEvaluator = createComplexityEvaluator({ sonnetThreshold: 0 });
      const context = createMockContext();
      // With sonnetThreshold=0, even empty board should recommend sonnet
      expect(customEvaluator.getRecommendedModel(context)).toBe('sonnet');
    });
  });
});

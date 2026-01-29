// src/ai/PreGameAnalyzer.test.ts
import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { PreGameAnalyzer, type PreGameAnalysis, type DeckCard } from './PreGameAnalyzer';

describe('PreGameAnalyzer', () => {
  let analyzer: PreGameAnalyzer;

  beforeEach(() => {
    analyzer = new PreGameAnalyzer();
  });

  // サンプルデッキ
  function createSampleDeck(): DeckCard[] {
    return [
      { catalogId: '1-0-001', name: '赤ユニット1', cost: 2, type: 'unit', color: 1 },
      { catalogId: '1-0-001', name: '赤ユニット1', cost: 2, type: 'unit', color: 1 },
      { catalogId: '1-0-001', name: '赤ユニット1', cost: 2, type: 'unit', color: 1 },
      { catalogId: '1-0-002', name: '赤ユニット2', cost: 3, type: 'unit', color: 1 },
      { catalogId: '1-0-002', name: '赤ユニット2', cost: 3, type: 'unit', color: 1 },
      { catalogId: '1-0-100', name: 'インターセプト', cost: 1, type: 'intercept', color: 1 },
      { catalogId: '1-0-100', name: 'インターセプト', cost: 1, type: 'intercept', color: 1 },
      { catalogId: '1-0-100', name: 'インターセプト', cost: 1, type: 'intercept', color: 1 },
    ];
  }

  describe('analyzeDeckComposition', () => {
    it('should count cards by type', () => {
      const deck = createSampleDeck();
      const composition = analyzer.analyzeDeckComposition(deck);

      expect(composition.unitCount).toBe(5);
      expect(composition.interceptCount).toBe(3);
      expect(composition.triggerCount).toBe(0);
    });

    it('should identify primary color', () => {
      const deck = createSampleDeck();
      const composition = analyzer.analyzeDeckComposition(deck);

      expect(composition.primaryColor).toBe(1);
    });

    it('should calculate cost distribution', () => {
      const deck = createSampleDeck();
      const composition = analyzer.analyzeDeckComposition(deck);

      expect(composition.costDistribution).toBeDefined();
      expect(composition.costDistribution[2]).toBe(3); // cost 2のカードが3枚
      expect(composition.costDistribution[3]).toBe(2); // cost 3のカードが2枚
    });

    it('should calculate average cost', () => {
      const deck = createSampleDeck();
      const composition = analyzer.analyzeDeckComposition(deck);

      expect(composition.averageCost).toBeGreaterThan(0);
    });
  });

  describe('identifyKeyCards', () => {
    it('should identify cards with multiple copies as key cards', () => {
      const deck = createSampleDeck();
      const keyCards = analyzer.identifyKeyCards(deck);

      expect(keyCards.length).toBeGreaterThan(0);
      // 3枚積みカードは重要
      expect(keyCards.some(k => k.name === '赤ユニット1')).toBe(true);
    });

    it('should include copy count in key card info', () => {
      const deck = createSampleDeck();
      const keyCards = analyzer.identifyKeyCards(deck);

      const redUnit = keyCards.find(k => k.name === '赤ユニット1');
      expect(redUnit?.count).toBe(3);
    });
  });

  describe('generateStrategy', () => {
    it('should generate strategy based on deck composition', () => {
      const deck = createSampleDeck();
      const composition = analyzer.analyzeDeckComposition(deck);
      const strategy = analyzer.generateStrategy(composition);

      expect(strategy).toBeDefined();
      expect(strategy.archetype).toBeDefined();
      expect(strategy.playstyle).toBeDefined();
    });

    it('should identify aggro archetype for low cost decks', () => {
      // 低コストデッキ
      const lowCostDeck: DeckCard[] = Array(30).fill({
        catalogId: '1-0-001',
        name: 'LowCost',
        cost: 1,
        type: 'unit',
        color: 1,
      });
      const composition = analyzer.analyzeDeckComposition(lowCostDeck);
      const strategy = analyzer.generateStrategy(composition);

      expect(strategy.archetype).toContain('アグロ');
    });

    it('should identify control archetype for high cost decks', () => {
      // 高コストデッキ
      const highCostDeck: DeckCard[] = Array(30).fill({
        catalogId: '1-0-001',
        name: 'HighCost',
        cost: 5,
        type: 'unit',
        color: 3, // 青
      });
      const composition = analyzer.analyzeDeckComposition(highCostDeck);
      const strategy = analyzer.generateStrategy(composition);

      expect(strategy.archetype).toContain('コントロール');
    });
  });

  describe('generateMulliganAdvice', () => {
    it('should recommend keeping low cost cards for aggro', () => {
      const deck = createSampleDeck();
      const composition = analyzer.analyzeDeckComposition(deck);
      const advice = analyzer.generateMulliganAdvice(composition);

      expect(advice).toContain('低コスト');
    });
  });

  describe('createAnalysisReport', () => {
    it('should create complete analysis report', () => {
      const deck = createSampleDeck();
      const report = analyzer.createAnalysisReport(deck);

      expect(report.composition).toBeDefined();
      expect(report.keyCards).toBeDefined();
      expect(report.strategy).toBeDefined();
      expect(report.mulliganAdvice).toBeDefined();
    });

    it('should include formatted summary', () => {
      const deck = createSampleDeck();
      const report = analyzer.createAnalysisReport(deck);

      expect(report.summary).toBeDefined();
      expect(typeof report.summary).toBe('string');
    });
  });
});

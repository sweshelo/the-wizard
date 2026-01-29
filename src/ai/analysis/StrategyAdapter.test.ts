// src/ai/analysis/StrategyAdapter.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { StrategyAdapter } from './StrategyAdapter';
import type { DeckRecognitionResult } from './DeckRecognizer';

describe('StrategyAdapter', () => {
  let adapter: StrategyAdapter;

  beforeEach(() => {
    adapter = new StrategyAdapter();
  });

  describe('adaptStrategy', () => {
    it('should generate defensive strategy against aggro', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'aggro',
        confidence: 0.8,
        mainColor: 'red',
        secondaryColor: null,
        estimatedStrategy: '赤アグロ',
      };

      const strategy = adapter.adaptStrategy(opponentDeck);

      expect(strategy.playstyle).toBe('defensive');
      expect(strategy.priorities).toContain('ライフ維持');
      expect(strategy.warnings.length).toBeGreaterThan(0);
    });

    it('should generate aggressive strategy against control', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'control',
        confidence: 0.7,
        mainColor: 'blue',
        secondaryColor: null,
        estimatedStrategy: '青コントロール',
      };

      const strategy = adapter.adaptStrategy(opponentDeck);

      expect(strategy.playstyle).toBe('aggressive');
      expect(strategy.priorities).toContain('速攻');
    });

    it('should generate balanced strategy against midrange', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'midrange',
        confidence: 0.6,
        mainColor: 'green',
        secondaryColor: null,
        estimatedStrategy: '緑ミッドレンジ',
      };

      const strategy = adapter.adaptStrategy(opponentDeck);

      expect(strategy.playstyle).toBe('balanced');
    });

    it('should include color-specific warnings', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'control',
        confidence: 0.8,
        mainColor: 'blue',
        secondaryColor: null,
        estimatedStrategy: '青コントロール',
      };

      const strategy = adapter.adaptStrategy(opponentDeck);

      expect(strategy.warnings.some(w => w.includes('青'))).toBe(true);
    });

    it('should return cautious strategy for unknown deck', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'unknown',
        confidence: 0,
        mainColor: null,
        secondaryColor: null,
        estimatedStrategy: '不明',
      };

      const strategy = adapter.adaptStrategy(opponentDeck);

      expect(strategy.playstyle).toBe('balanced');
      expect(strategy.priorities).toContain('情報収集');
    });
  });

  describe('getMulliganAdvice', () => {
    it('should recommend keeping low cost cards against aggro', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'aggro',
        confidence: 0.8,
        mainColor: 'red',
        secondaryColor: null,
        estimatedStrategy: '赤アグロ',
      };

      const advice = adapter.getMulliganAdvice(opponentDeck);

      expect(advice.keepLowCost).toBe(true);
      expect(advice.targetCostRange.max).toBeLessThanOrEqual(4);
    });

    it('should recommend keeping high cost cards against control', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'control',
        confidence: 0.8,
        mainColor: 'blue',
        secondaryColor: null,
        estimatedStrategy: '青コントロール',
      };

      const advice = adapter.getMulliganAdvice(opponentDeck);

      expect(advice.keepLowCost).toBe(false);
    });
  });

  describe('getBlockingAdvice', () => {
    it('should advise blocking aggressively against aggro', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'aggro',
        confidence: 0.8,
        mainColor: 'red',
        secondaryColor: null,
        estimatedStrategy: '赤アグロ',
      };

      const advice = adapter.getBlockingAdvice(opponentDeck);

      expect(advice.shouldBlockAggressively).toBe(true);
      expect(advice.lifeThreshold).toBeGreaterThan(3);
    });

    it('should advise conservative blocking against control', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'control',
        confidence: 0.8,
        mainColor: 'blue',
        secondaryColor: null,
        estimatedStrategy: '青コントロール',
      };

      const advice = adapter.getBlockingAdvice(opponentDeck);

      expect(advice.shouldBlockAggressively).toBe(false);
    });
  });

  describe('getAttackAdvice', () => {
    it('should advise aggressive attacks against control', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'control',
        confidence: 0.8,
        mainColor: 'blue',
        secondaryColor: null,
        estimatedStrategy: '青コントロール',
      };

      const advice = adapter.getAttackAdvice(opponentDeck);

      expect(advice.shouldAttackAggressively).toBe(true);
    });

    it('should advise calculated attacks against aggro', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'aggro',
        confidence: 0.8,
        mainColor: 'red',
        secondaryColor: null,
        estimatedStrategy: '赤アグロ',
      };

      const advice = adapter.getAttackAdvice(opponentDeck);

      expect(advice.shouldAttackAggressively).toBe(false);
      expect(advice.preserveBlockers).toBe(true);
    });
  });

  describe('formatStrategyPrompt', () => {
    it('should generate formatted prompt for LLM', () => {
      const opponentDeck: DeckRecognitionResult = {
        deckType: 'aggro',
        confidence: 0.8,
        mainColor: 'red',
        secondaryColor: null,
        estimatedStrategy: '赤アグロ',
      };

      const prompt = adapter.formatStrategyPrompt(opponentDeck);

      expect(prompt).toContain('相手デッキ');
      expect(prompt).toContain('aggro');
      expect(prompt).toContain('赤');
    });
  });
});

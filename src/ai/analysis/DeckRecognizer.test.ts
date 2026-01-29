// src/ai/analysis/DeckRecognizer.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { DeckRecognizer, type DeckType, type CardInfo } from './DeckRecognizer';

describe('DeckRecognizer', () => {
  let recognizer: DeckRecognizer;

  beforeEach(() => {
    recognizer = new DeckRecognizer();
  });

  describe('addObservedCard', () => {
    it('should add card to observed list', () => {
      recognizer.addObservedCard({
        id: 'card-1',
        name: 'テストカード',
        color: 'red',
        cost: 3,
        type: 'unit',
      });

      const observed = recognizer.getObservedCards();
      expect(observed).toHaveLength(1);
      expect(observed[0].name).toBe('テストカード');
    });

    it('should not add duplicate cards', () => {
      const card: CardInfo = {
        id: 'card-1',
        name: 'テストカード',
        color: 'red',
        cost: 3,
        type: 'unit',
      };

      recognizer.addObservedCard(card);
      recognizer.addObservedCard(card);

      expect(recognizer.getObservedCards()).toHaveLength(1);
    });
  });

  describe('recognizeDeckType', () => {
    it('should return unknown with low confidence when no cards observed', () => {
      const result = recognizer.recognizeDeckType();

      expect(result.deckType).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should recognize aggro deck from low cost units', () => {
      // Add multiple low-cost units
      for (let i = 0; i < 5; i++) {
        recognizer.addObservedCard({
          id: `card-${i}`,
          name: `アグロユニット${i}`,
          color: 'red',
          cost: (i % 3) + 1, // costs 1-3
          type: 'unit',
        });
      }

      const result = recognizer.recognizeDeckType();

      expect(result.deckType).toBe('aggro');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize control deck from high cost units and triggers', () => {
      // Add high-cost units
      for (let i = 0; i < 3; i++) {
        recognizer.addObservedCard({
          id: `unit-${i}`,
          name: `コントロールユニット${i}`,
          color: 'blue',
          cost: 5 + i,
          type: 'unit',
        });
      }
      // Add triggers
      for (let i = 0; i < 3; i++) {
        recognizer.addObservedCard({
          id: `trigger-${i}`,
          name: `トリガー${i}`,
          color: 'blue',
          cost: 2,
          type: 'trigger',
        });
      }

      const result = recognizer.recognizeDeckType();

      expect(result.deckType).toBe('control');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should recognize midrange deck from mixed costs', () => {
      // Add mix of costs
      recognizer.addObservedCard({ id: 'c1', name: 'Low', color: 'green', cost: 2, type: 'unit' });
      recognizer.addObservedCard({ id: 'c2', name: 'Mid1', color: 'green', cost: 4, type: 'unit' });
      recognizer.addObservedCard({ id: 'c3', name: 'Mid2', color: 'green', cost: 4, type: 'unit' });
      recognizer.addObservedCard({ id: 'c4', name: 'High', color: 'green', cost: 6, type: 'unit' });

      const result = recognizer.recognizeDeckType();

      expect(result.deckType).toBe('midrange');
    });

    it('should identify main color', () => {
      recognizer.addObservedCard({ id: 'c1', name: 'R1', color: 'red', cost: 2, type: 'unit' });
      recognizer.addObservedCard({ id: 'c2', name: 'R2', color: 'red', cost: 3, type: 'unit' });
      recognizer.addObservedCard({ id: 'c3', name: 'R3', color: 'red', cost: 4, type: 'unit' });
      recognizer.addObservedCard({ id: 'c4', name: 'B1', color: 'blue', cost: 2, type: 'unit' });

      const result = recognizer.recognizeDeckType();

      expect(result.mainColor).toBe('red');
    });
  });

  describe('getConfidence', () => {
    it('should increase confidence with more observed cards', () => {
      recognizer.addObservedCard({ id: 'c1', name: 'Card1', color: 'red', cost: 2, type: 'unit' });
      const conf1 = recognizer.recognizeDeckType().confidence;

      recognizer.addObservedCard({ id: 'c2', name: 'Card2', color: 'red', cost: 2, type: 'unit' });
      recognizer.addObservedCard({ id: 'c3', name: 'Card3', color: 'red', cost: 3, type: 'unit' });
      const conf2 = recognizer.recognizeDeckType().confidence;

      expect(conf2).toBeGreaterThan(conf1);
    });
  });

  describe('getKeyCards', () => {
    it('should identify key cards based on cost and type', () => {
      recognizer.addObservedCard({
        id: 'c1',
        name: 'FinisherUnit',
        color: 'red',
        cost: 7,
        type: 'unit',
      });
      recognizer.addObservedCard({
        id: 'c2',
        name: 'LowUnit',
        color: 'red',
        cost: 1,
        type: 'unit',
      });
      recognizer.addObservedCard({
        id: 'c3',
        name: 'KeyTrigger',
        color: 'red',
        cost: 0,
        type: 'trigger',
      });

      const keyCards = recognizer.getKeyCards();

      expect(keyCards.some(c => c.name === 'FinisherUnit')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear all observed cards', () => {
      recognizer.addObservedCard({ id: 'c1', name: 'Card1', color: 'red', cost: 2, type: 'unit' });
      recognizer.clear();

      expect(recognizer.getObservedCards()).toHaveLength(0);
    });
  });

  describe('getDeckProfile', () => {
    it('should return comprehensive deck profile', () => {
      recognizer.addObservedCard({ id: 'c1', name: 'Unit1', color: 'red', cost: 2, type: 'unit' });
      recognizer.addObservedCard({ id: 'c2', name: 'Unit2', color: 'red', cost: 3, type: 'unit' });
      recognizer.addObservedCard({
        id: 'c3',
        name: 'Trigger1',
        color: 'red',
        cost: 1,
        type: 'trigger',
      });

      const profile = recognizer.getDeckProfile();

      expect(profile.totalObserved).toBe(3);
      expect(profile.averageCost).toBeCloseTo(2);
      expect(profile.colorDistribution['red']).toBe(3);
      expect(profile.typeDistribution['unit']).toBe(2);
      expect(profile.typeDistribution['trigger']).toBe(1);
    });
  });
});

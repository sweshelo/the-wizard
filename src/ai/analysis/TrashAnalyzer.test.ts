// src/ai/analysis/TrashAnalyzer.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { TrashAnalyzer, type TrashCard } from './TrashAnalyzer';

describe('TrashAnalyzer', () => {
  let analyzer: TrashAnalyzer;

  beforeEach(() => {
    analyzer = new TrashAnalyzer();
  });

  describe('updateTrash', () => {
    it('should update trash pile', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'Card1', color: 'red', cost: 2, type: 'unit' },
        { id: 'c2', name: 'Card2', color: 'red', cost: 3, type: 'unit' },
      ];

      analyzer.updateTrash(trash);

      expect(analyzer.getTrashPile()).toHaveLength(2);
    });

    it('should track new additions', () => {
      const trash1: TrashCard[] = [
        { id: 'c1', name: 'Card1', color: 'red', cost: 2, type: 'unit' },
      ];
      const trash2: TrashCard[] = [
        { id: 'c1', name: 'Card1', color: 'red', cost: 2, type: 'unit' },
        { id: 'c2', name: 'Card2', color: 'red', cost: 3, type: 'unit' },
      ];

      analyzer.updateTrash(trash1);
      analyzer.updateTrash(trash2);

      expect(analyzer.getNewlyTrashed()).toHaveLength(1);
      expect(analyzer.getNewlyTrashed()[0].name).toBe('Card2');
    });
  });

  describe('analyzeColorDistribution', () => {
    it('should calculate color distribution', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'R1', color: 'red', cost: 2, type: 'unit' },
        { id: 'c2', name: 'R2', color: 'red', cost: 3, type: 'unit' },
        { id: 'c3', name: 'B1', color: 'blue', cost: 2, type: 'unit' },
      ];

      analyzer.updateTrash(trash);
      const distribution = analyzer.analyzeColorDistribution();

      expect(distribution['red']).toBe(2);
      expect(distribution['blue']).toBe(1);
    });
  });

  describe('analyzeTypeDistribution', () => {
    it('should calculate type distribution', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'U1', color: 'red', cost: 2, type: 'unit' },
        { id: 'c2', name: 'U2', color: 'red', cost: 3, type: 'unit' },
        { id: 'c3', name: 'T1', color: 'red', cost: 2, type: 'trigger' },
      ];

      analyzer.updateTrash(trash);
      const distribution = analyzer.analyzeTypeDistribution();

      expect(distribution['unit']).toBe(2);
      expect(distribution['trigger']).toBe(1);
    });
  });

  describe('estimateUnusedKeyCards', () => {
    it('should estimate high cost cards as potentially unused', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'LowCard', color: 'red', cost: 2, type: 'unit' },
        { id: 'c2', name: 'MidCard', color: 'red', cost: 4, type: 'unit' },
      ];

      analyzer.updateTrash(trash);
      analyzer.setKnownDeckCards([
        { id: 'c3', name: 'HighCard', color: 'red', cost: 7, type: 'unit' },
        { id: 'c4', name: 'AnotherHigh', color: 'red', cost: 6, type: 'unit' },
      ]);

      const unused = analyzer.estimateUnusedKeyCards();

      expect(unused.length).toBeGreaterThan(0);
      expect(unused.some(c => c.name === 'HighCard')).toBe(true);
    });
  });

  describe('getWatchList', () => {
    it('should generate watch list based on analysis', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'Card1', color: 'blue', cost: 2, type: 'unit' },
      ];

      analyzer.updateTrash(trash);
      analyzer.setKnownDeckCards([
        { id: 'c2', name: 'DangerousCard', color: 'blue', cost: 5, type: 'unit' },
      ]);

      const watchList = analyzer.getWatchList();

      expect(watchList.length).toBeGreaterThan(0);
    });
  });

  describe('getTendencies', () => {
    it('should identify aggressive tendencies', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'Aggro1', color: 'red', cost: 1, type: 'unit' },
        { id: 'c2', name: 'Aggro2', color: 'red', cost: 2, type: 'unit' },
        { id: 'c3', name: 'Aggro3', color: 'red', cost: 2, type: 'unit' },
      ];

      analyzer.updateTrash(trash);
      const tendencies = analyzer.getTendencies();

      expect(tendencies.playstyle).toBe('aggressive');
    });

    it('should identify defensive tendencies', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'Trigger1', color: 'blue', cost: 0, type: 'trigger' },
        { id: 'c2', name: 'Trigger2', color: 'blue', cost: 0, type: 'trigger' },
        { id: 'c3', name: 'Control', color: 'blue', cost: 5, type: 'unit' },
      ];

      analyzer.updateTrash(trash);
      const tendencies = analyzer.getTendencies();

      expect(tendencies.playstyle).toBe('defensive');
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      const trash: TrashCard[] = [{ id: 'c1', name: 'Card1', color: 'red', cost: 2, type: 'unit' }];

      analyzer.updateTrash(trash);
      analyzer.clear();

      expect(analyzer.getTrashPile()).toHaveLength(0);
    });
  });

  describe('formatForPrompt', () => {
    it('should format analysis for LLM prompt', () => {
      const trash: TrashCard[] = [
        { id: 'c1', name: 'Card1', color: 'red', cost: 2, type: 'unit' },
        { id: 'c2', name: 'Card2', color: 'red', cost: 3, type: 'unit' },
      ];

      analyzer.updateTrash(trash);
      const formatted = analyzer.formatForPrompt();

      expect(formatted).toContain('捨札');
      expect(formatted).toContain('Card1');
    });
  });
});

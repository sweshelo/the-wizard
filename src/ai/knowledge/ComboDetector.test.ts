// src/ai/knowledge/ComboDetector.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { ComboDetector, type PlayEvent } from './ComboDetector';

describe('ComboDetector', () => {
  let detector: ComboDetector;

  beforeEach(() => {
    detector = new ComboDetector();
  });

  describe('recordPlay', () => {
    it('should record a play event', () => {
      const event: PlayEvent = {
        cardId: 'card-1',
        cardName: 'テストカード',
        turn: 1,
        timestamp: new Date(),
        type: 'summon',
      };

      detector.recordPlay(event);

      expect(detector.getPlayHistory()).toHaveLength(1);
    });

    it('should maintain chronological order', () => {
      detector.recordPlay({
        cardId: 'card-1',
        cardName: 'Card1',
        turn: 1,
        timestamp: new Date(1000),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'card-2',
        cardName: 'Card2',
        turn: 2,
        timestamp: new Date(2000),
        type: 'summon',
      });

      const history = detector.getPlayHistory();
      expect(history[0].turn).toBe(1);
      expect(history[1].turn).toBe(2);
    });
  });

  describe('detectSequence', () => {
    it('should detect consecutive plays in same turn', () => {
      const now = new Date();
      detector.recordPlay({
        cardId: 'card-1',
        cardName: 'Card1',
        turn: 1,
        timestamp: now,
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'card-2',
        cardName: 'Card2',
        turn: 1,
        timestamp: new Date(now.getTime() + 1000),
        type: 'effect',
      });
      detector.recordPlay({
        cardId: 'card-3',
        cardName: 'Card3',
        turn: 1,
        timestamp: new Date(now.getTime() + 2000),
        type: 'effect',
      });

      const sequences = detector.detectSequences(1);

      expect(sequences.length).toBeGreaterThan(0);
      expect(sequences[0].events.length).toBe(3);
    });

    it('should not detect sequence when plays are in different turns', () => {
      detector.recordPlay({
        cardId: 'card-1',
        cardName: 'Card1',
        turn: 1,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'card-2',
        cardName: 'Card2',
        turn: 3,
        timestamp: new Date(),
        type: 'effect',
      });

      const sequences = detector.detectSequences(1);

      expect(sequences.length).toBe(0);
    });
  });

  describe('detectComboPattern', () => {
    it('should detect repeated patterns across turns', () => {
      // First occurrence
      detector.recordPlay({
        cardId: 'a',
        cardName: 'CardA',
        turn: 1,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'b',
        cardName: 'CardB',
        turn: 1,
        timestamp: new Date(),
        type: 'effect',
      });

      // Second occurrence (same pattern)
      detector.recordPlay({
        cardId: 'a2',
        cardName: 'CardA',
        turn: 3,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'b2',
        cardName: 'CardB',
        turn: 3,
        timestamp: new Date(),
        type: 'effect',
      });

      const patterns = detector.detectComboPatterns();

      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns[0].occurrences).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getWarnings', () => {
    it('should generate warning for detected combo', () => {
      // Record a repeated pattern
      detector.recordPlay({
        cardId: 'a',
        cardName: 'DangerousCard',
        turn: 1,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'b',
        cardName: 'ComboCard',
        turn: 1,
        timestamp: new Date(),
        type: 'effect',
      });

      detector.recordPlay({
        cardId: 'a2',
        cardName: 'DangerousCard',
        turn: 3,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'b2',
        cardName: 'ComboCard',
        turn: 3,
        timestamp: new Date(),
        type: 'effect',
      });

      const warnings = detector.getWarnings();

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('コンボ');
    });

    it('should return empty array when no patterns detected', () => {
      detector.recordPlay({
        cardId: 'a',
        cardName: 'Card1',
        turn: 1,
        timestamp: new Date(),
        type: 'summon',
      });

      const warnings = detector.getWarnings();

      expect(warnings).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should clear all recorded plays', () => {
      detector.recordPlay({
        cardId: 'a',
        cardName: 'Card1',
        turn: 1,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.clear();

      expect(detector.getPlayHistory()).toHaveLength(0);
    });
  });

  describe('getRecentPlays', () => {
    it('should return plays from recent turns', () => {
      detector.recordPlay({
        cardId: 'a',
        cardName: 'Old',
        turn: 1,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'b',
        cardName: 'Recent',
        turn: 5,
        timestamp: new Date(),
        type: 'summon',
      });
      detector.recordPlay({
        cardId: 'c',
        cardName: 'Latest',
        turn: 6,
        timestamp: new Date(),
        type: 'summon',
      });

      const recent = detector.getRecentPlays(6, 2);

      expect(recent).toHaveLength(2);
      expect(recent.every(p => p.turn >= 5)).toBe(true);
    });
  });
});

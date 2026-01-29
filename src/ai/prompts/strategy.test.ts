// src/ai/prompts/strategy.test.ts
import { describe, it, expect } from 'bun:test';
import {
  getColorStrategy,
  getColorName,
  formatDeckStrategy,
  COLOR_STRATEGIES,
  type DeckColors,
} from './strategy';

describe('Strategy Prompts', () => {
  describe('getColorName', () => {
    it('should return correct color name for red (1)', () => {
      expect(getColorName(1)).toBe('赤');
    });

    it('should return correct color name for yellow (2)', () => {
      expect(getColorName(2)).toBe('黄');
    });

    it('should return correct color name for blue (3)', () => {
      expect(getColorName(3)).toBe('青');
    });

    it('should return correct color name for green (4)', () => {
      expect(getColorName(4)).toBe('緑');
    });

    it('should return correct color name for purple (5)', () => {
      expect(getColorName(5)).toBe('紫');
    });

    it('should return unknown for invalid color', () => {
      expect(getColorName(99)).toBe('不明');
    });
  });

  describe('getColorStrategy', () => {
    it('should return strategy for red color', () => {
      const strategy = getColorStrategy(1);
      expect(strategy).not.toBeNull();
      if (!strategy) {
        throw new Error('Expected strategy for color 1');
      }

      expect(strategy.name).toBe('赤');
      expect(strategy.playstyle).toBeDefined();
      expect(strategy.strengths).toBeArray();
      expect(strategy.weaknesses).toBeArray();
      expect(strategy.tips).toBeArray();
    });

    it('should return strategy for yellow color', () => {
      const strategy = getColorStrategy(2);
      expect(strategy).not.toBeNull();
      if (!strategy) {
        throw new Error('Expected strategy for color 2');
      }

      expect(strategy.name).toBe('黄');
      expect(strategy.playstyle).toContain('バランス');
    });

    it('should return strategy for blue color', () => {
      const strategy = getColorStrategy(3);
      expect(strategy).not.toBeNull();
      if (!strategy) {
        throw new Error('Expected strategy for color 3');
      }

      expect(strategy.name).toBe('青');
      expect(strategy.playstyle).toBeDefined();
    });

    it('should return strategy for green color', () => {
      const strategy = getColorStrategy(4);
      expect(strategy).not.toBeNull();
      if (!strategy) {
        throw new Error('Expected strategy for color 4');
      }

      expect(strategy.name).toBe('緑');
      expect(strategy.playstyle).toBeDefined();
    });

    it('should return strategy for purple color', () => {
      const strategy = getColorStrategy(5);
      expect(strategy).not.toBeNull();
      if (!strategy) {
        throw new Error('Expected strategy for color 5');
      }

      expect(strategy.name).toBe('紫');
      expect(strategy.playstyle).toBeDefined();
    });

    it('should return null for invalid color', () => {
      const strategy = getColorStrategy(99);

      expect(strategy).toBeNull();
    });
  });

  describe('COLOR_STRATEGIES', () => {
    it('should have strategies for all 5 colors', () => {
      expect(COLOR_STRATEGIES[1]).toBeDefined();
      expect(COLOR_STRATEGIES[2]).toBeDefined();
      expect(COLOR_STRATEGIES[3]).toBeDefined();
      expect(COLOR_STRATEGIES[4]).toBeDefined();
      expect(COLOR_STRATEGIES[5]).toBeDefined();
    });

    it('each strategy should have required fields', () => {
      for (const [_, strategy] of Object.entries(COLOR_STRATEGIES)) {
        expect(strategy.name).toBeDefined();
        expect(strategy.playstyle).toBeDefined();
        expect(strategy.strengths.length).toBeGreaterThan(0);
        expect(strategy.weaknesses.length).toBeGreaterThan(0);
        expect(strategy.tips.length).toBeGreaterThan(0);
      }
    });
  });

  describe('formatDeckStrategy', () => {
    it('should format mono-color deck strategy', () => {
      const colors: DeckColors = { primary: 1 };
      const result = formatDeckStrategy(colors);

      expect(result).toContain('赤');
      expect(result).toContain('プレイスタイル');
      expect(result).toContain('強み');
      expect(result).toContain('弱み');
    });

    it('should format dual-color deck strategy', () => {
      const colors: DeckColors = { primary: 1, secondary: 3 };
      const result = formatDeckStrategy(colors);

      expect(result).toContain('赤');
      expect(result).toContain('青');
      expect(result).toContain('メインカラー');
      expect(result).toContain('サブカラー');
    });

    it('should handle invalid primary color gracefully', () => {
      const colors: DeckColors = { primary: 99 };
      const result = formatDeckStrategy(colors);

      expect(result).toContain('不明');
    });

    it('should include tips section', () => {
      const colors: DeckColors = { primary: 2 };
      const result = formatDeckStrategy(colors);

      expect(result).toContain('戦略的アドバイス');
    });
  });
});

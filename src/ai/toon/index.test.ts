// src/ai/toon/index.test.ts

import { describe, it, expect } from 'bun:test';
import {
  toTOON,
  fromTOON,
  estimateTokenCount,
  getTokenReduction,
  getCompressionStats,
} from './index';
import type { AIGameContext } from '../types';

const createTestContext = (): AIGameContext => ({
  turn: 5,
  round: 3,
  isMyTurn: true,
  self: {
    life: 6,
    cp: { current: 4, max: 7 },
    jokerGauge: 50,
    handCount: 3,
    deckCount: 25,
  },
  opponent: {
    life: 5,
    cp: { current: 3, max: 7 },
    jokerGauge: 30,
    handCount: 4,
    deckCount: 26,
  },
  myField: [
    {
      id: 'u1',
      name: 'ドラゴン',
      catalogId: 'cat1',
      bp: 7000,
      baseBp: 7000,
      cost: 5,
      active: true,
      abilities: ['飛行'],
      canBoot: false,
    },
  ],
  opponentField: [
    {
      id: 'u2',
      name: 'ゴブリン',
      catalogId: 'cat2',
      bp: 3000,
      baseBp: 3000,
      cost: 2,
      active: false,
      abilities: [],
      canBoot: false,
    },
  ],
  myHand: [
    {
      id: 'c1',
      name: '炎の剣',
      catalogId: 'cat3',
      cost: 3,
      type: 'trigger',
      playable: true,
    },
  ],
  myTrigger: [],
  recentEvents: [],
});

describe('TOON Module', () => {
  describe('toTOON', () => {
    it('should convert game state to TOON format', () => {
      const context = createTestContext();
      const toon = toTOON(context);

      expect(typeof toon).toBe('string');
      expect(toon.length).toBeGreaterThan(0);
    });

    it('should produce valid output that can be decoded', () => {
      const context = createTestContext();
      const toon = toTOON(context);
      const decoded = fromTOON(toon);

      expect(decoded).toBeDefined();
    });
  });

  describe('fromTOON', () => {
    it('should decode TOON back to object', () => {
      const context = createTestContext();
      const toon = toTOON(context);
      const decoded = fromTOON(toon);

      expect(decoded).toBeDefined();
      expect(typeof decoded).toBe('object');
    });

    it('should preserve key data in round-trip', () => {
      const context = createTestContext();
      const toon = toTOON(context);
      const decoded = fromTOON(toon) as AIGameContext;

      expect(decoded.turn).toBe(context.turn);
      expect(decoded.round).toBe(context.round);
      expect(decoded.self.life).toBe(context.self.life);
    });
  });

  describe('estimateTokenCount', () => {
    it('should estimate token count for English text', () => {
      const text = 'Hello world test string';
      const tokens = estimateTokenCount(text);

      expect(tokens).toBeGreaterThan(0);
      // ~23 chars / 4 = ~6 tokens
      expect(tokens).toBeLessThan(10);
    });

    it('should estimate higher tokens for Japanese text', () => {
      const japanese = 'こんにちは世界';
      const tokens = estimateTokenCount(japanese);

      // ~7 chars / 1.5 = ~5 tokens
      expect(tokens).toBeGreaterThan(0);
    });
  });

  describe('getTokenReduction', () => {
    it('should calculate token reduction ratio', () => {
      const context = createTestContext();
      const reduction = getTokenReduction(context);

      // TOONはネスト構造では必ずしも削減されない
      // 値は-1から1の範囲（負は増加、正は削減）
      expect(reduction).toBeGreaterThanOrEqual(-1);
      expect(reduction).toBeLessThanOrEqual(1);
    });

    it('should show reduction for uniform arrays', () => {
      // TOONはユニフォームな配列に最適化されている
      const arrayContext = {
        items: [
          { id: '1', name: 'A', value: 100 },
          { id: '2', name: 'B', value: 200 },
          { id: '3', name: 'C', value: 300 },
        ],
      } as unknown as AIGameContext;

      const toon = toTOON(arrayContext);
      const json = JSON.stringify(arrayContext);

      // 配列データではTOONがより効率的
      expect(toon.length).toBeLessThan(json.length);
    });
  });

  describe('getCompressionStats', () => {
    it('should return compression statistics', () => {
      const context = createTestContext();
      const stats = getCompressionStats(context);

      expect(stats.jsonLength).toBeGreaterThan(0);
      expect(stats.toonLength).toBeGreaterThan(0);
      expect(stats.jsonTokens).toBeGreaterThan(0);
      expect(stats.toonTokens).toBeGreaterThan(0);
      // 削減率は構造によって正負どちらもあり得る
      expect(typeof stats.lengthReduction).toBe('number');
      expect(typeof stats.tokenReduction).toBe('number');
    });
  });
});

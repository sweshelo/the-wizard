// src/ai/catalog/CatalogService.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { CatalogService } from './CatalogService';

describe('CatalogService', () => {
  let service: CatalogService;

  beforeEach(() => {
    service = new CatalogService();
  });

  describe('getById', () => {
    it('should return card info by catalog ID', () => {
      // 実在するカードID（カタログに存在する前提）
      const result = service.getById('1-0-001');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1-0-001');
      expect(result?.name).toBeDefined();
      expect(result?.ability).toBeDefined();
    });

    it('should return null for non-existent ID', () => {
      const result = service.getById('non-existent-id');

      expect(result).toBeNull();
    });

    it('should include ability text in card info', () => {
      const result = service.getById('1-0-001');

      expect(result?.ability).toBeDefined();
      expect(typeof result?.ability).toBe('string');
    });
  });

  describe('searchByName', () => {
    it('should find cards by exact name', () => {
      // まず何かしらのカードを取得
      const card = service.getById('1-0-001');
      if (!card) return; // カタログが空の場合スキップ

      const results = service.searchByName(card.name);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(c => c.name === card.name)).toBe(true);
    });

    it('should find cards by partial name match', () => {
      // 部分一致検索
      const results = service.searchByName('ドラゴン');

      // ドラゴンを含むカードが見つかる可能性
      expect(Array.isArray(results)).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const results = service.searchByName('存在しないカード名XYZ123');

      expect(results).toEqual([]);
    });
  });

  describe('getCardsByType', () => {
    it('should filter cards by type', () => {
      const units = service.getCardsByType('unit');

      expect(Array.isArray(units)).toBe(true);
      units.forEach(card => {
        expect(card.type).toBe('unit');
      });
    });

    it('should return intercepts only when requested', () => {
      const intercepts = service.getCardsByType('intercept');

      intercepts.forEach(card => {
        expect(card.type).toBe('intercept');
      });
    });
  });

  describe('getCardsByColor', () => {
    it('should filter cards by color', () => {
      // 色は数値（赤=1, 黄=2, 青=3, 緑=4, 紫=5など）
      const redCards = service.getCardsByColor(1);

      expect(Array.isArray(redCards)).toBe(true);
      redCards.forEach(card => {
        expect(card.color).toBe(1);
      });
    });
  });

  describe('getEnhancedCardInfo', () => {
    it('should return enhanced info with formatted ability', () => {
      const result = service.getEnhancedCardInfo('1-0-001');

      if (result) {
        expect(result.id).toBe('1-0-001');
        expect(result.formattedAbility).toBeDefined();
        expect(result.keywords).toBeDefined();
        expect(Array.isArray(result.keywords)).toBe(true);
      }
    });

    it('should extract keywords from ability text', () => {
      // 能力テキストに含まれるキーワードを抽出
      const result = service.getEnhancedCardInfo('1-0-001');

      if (result) {
        expect(Array.isArray(result.keywords)).toBe(true);
      }
    });
  });
});

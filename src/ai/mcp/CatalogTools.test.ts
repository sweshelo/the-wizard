// src/ai/mcp/CatalogTools.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CatalogToolRegistry } from './CatalogTools';
import type { CatalogService } from '../catalog/CatalogService';
import type { KeywordService } from '../catalog/KeywordService';

// モックCatalogService
const createMockCatalogService = (): CatalogService =>
  ({
    searchByName: mock((name: string) => {
      if (name === 'ドラゴン') {
        return [
          {
            id: 'card-001',
            name: 'ドラゴン',
            cost: 5,
            color: 1,
            type: 'unit',
          },
        ];
      }
      return [];
    }),
    getById: mock(() => null),
    getCardsByColor: mock((color: number) => {
      if (color === 1) {
        // red
        return [
          { id: 'card-001', name: 'ドラゴン', cost: 5, color: 1, type: 'unit' },
          { id: 'card-002', name: '炎の精霊', cost: 3, color: 1, type: 'unit' },
        ];
      }
      return [];
    }),
    getCardsByType: mock(() => []),
  }) as unknown as CatalogService;

// モックKeywordService
const createMockKeywordService = (): KeywordService =>
  ({
    getKeywordDescription: mock((keyword: string) => {
      if (keyword === '不屈') {
        return '戦闘またはダメージでユニットが破壊された時、行動権を消費して破壊を無効にする';
      }
      return undefined;
    }),
    getAllKeywords: mock(() => ['不屈', '貫通', '加護']),
  }) as unknown as KeywordService;

describe('CatalogToolRegistry', () => {
  let registry: CatalogToolRegistry;
  let mockCatalogService: CatalogService;
  let mockKeywordService: KeywordService;

  beforeEach(() => {
    mockCatalogService = createMockCatalogService();
    mockKeywordService = createMockKeywordService();
    registry = new CatalogToolRegistry(mockCatalogService, mockKeywordService);
  });

  describe('tools', () => {
    it('should have lookup_card tool', () => {
      const tool = registry.getTool('lookup_card');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('lookup_card');
    });

    it('should have lookup_keyword tool', () => {
      const tool = registry.getTool('lookup_keyword');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('lookup_keyword');
    });

    it('should have search_cards tool', () => {
      const tool = registry.getTool('search_cards');
      expect(tool).toBeDefined();
      expect(tool?.name).toBe('search_cards');
    });
  });

  describe('lookup_card', () => {
    it('should find card by name', async () => {
      const result = await registry.executeToolCall('lookup_card', { name: 'ドラゴン' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as { name: string }).name).toBe('ドラゴン');
    });

    it('should return error for unknown card', async () => {
      const result = await registry.executeToolCall('lookup_card', { name: '存在しないカード' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('lookup_keyword', () => {
    it('should find keyword by name', async () => {
      const result = await registry.executeToolCall('lookup_keyword', { keyword: '不屈' });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect((result.data as { name: string }).name).toBe('不屈');
    });

    it('should return error for unknown keyword', async () => {
      const result = await registry.executeToolCall('lookup_keyword', {
        keyword: '存在しない能力',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('search_cards', () => {
    it('should search cards by color', async () => {
      const result = await registry.executeToolCall('search_cards', { color: 'red' });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect((result.data as unknown[]).length).toBe(2);
    });

    it('should return empty array for no matches', async () => {
      const result = await registry.executeToolCall('search_cards', { color: 'purple' });

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      expect((result.data as unknown[]).length).toBe(0);
    });
  });

  describe('getTool', () => {
    it('should return undefined for unknown tool', () => {
      const tool = registry.getTool('unknown_tool');
      expect(tool).toBeUndefined();
    });
  });

  describe('executeToolCall', () => {
    it('should return error for unknown tool', async () => {
      const result = await registry.executeToolCall('unknown_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });
  });

  describe('getToolDefinitions', () => {
    it('should return all tool definitions for LLM', () => {
      const definitions = registry.getToolDefinitions();

      expect(definitions.length).toBe(3);
      expect(definitions.every(d => d.name && d.description && d.input_schema)).toBe(true);
    });
  });

  describe('getAllTools', () => {
    it('should return all registered tools', () => {
      const tools = registry.getAllTools();

      expect(tools.length).toBe(3);
    });
  });
});

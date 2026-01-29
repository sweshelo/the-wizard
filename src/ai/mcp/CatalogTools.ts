// src/ai/mcp/CatalogTools.ts

import type { CatalogService } from '../catalog/CatalogService';
import type { KeywordService } from '../catalog/KeywordService';
import type { MCPTool, ToolResult, ToolDefinition } from './types';

/**
 * lookup_card ツール定義
 */
function createLookupCardTool(catalogService: CatalogService): MCPTool {
  return {
    name: 'lookup_card',
    description: 'カード名でカード情報を検索します',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'カード名',
        },
      },
      required: ['name'],
    },
    execute: async (params: Record<string, unknown>) => {
      const name = params.name as string;
      const results = catalogService.searchByName(name);
      // 完全一致を優先、なければ最初の部分一致
      const exactMatch = results.find(c => c.name === name);
      return exactMatch ?? results[0] ?? null;
    },
  };
}

/**
 * lookup_keyword ツール定義
 */
function createLookupKeywordTool(keywordService: KeywordService): MCPTool {
  return {
    name: 'lookup_keyword',
    description: 'キーワード能力の説明を取得します',
    parameters: {
      type: 'object',
      properties: {
        keyword: {
          type: 'string',
          description: 'キーワード名',
        },
      },
      required: ['keyword'],
    },
    execute: async (params: Record<string, unknown>) => {
      const keyword = params.keyword as string;
      const allKeywords = keywordService.getAllKeywords();
      // KeywordEffect型として一致するものを探す
      const matchedKeyword = allKeywords.find(k => k === keyword);
      if (!matchedKeyword) {
        return null;
      }
      const description = keywordService.getKeywordDescription(matchedKeyword);
      return description ? { name: matchedKeyword, description } : null;
    },
  };
}

/**
 * 色名から色コードへのマッピング
 */
const COLOR_MAP: Record<string, number> = {
  red: 1,
  blue: 2,
  yellow: 3,
  green: 4,
  purple: 5,
  colorless: 0,
};

/**
 * search_cards ツール定義
 */
function createSearchCardsTool(catalogService: CatalogService): MCPTool {
  return {
    name: 'search_cards',
    description: 'カードを検索します（色、コスト、タイプ等で絞り込み）',
    parameters: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'カードの色',
          enum: ['red', 'blue', 'green', 'yellow', 'purple', 'colorless'],
        },
        costMin: {
          type: 'number',
          description: '最小コスト',
        },
        costMax: {
          type: 'number',
          description: '最大コスト',
        },
        type: {
          type: 'string',
          description: 'カードタイプ',
          enum: ['unit', 'trigger', 'intercept'],
        },
      },
    },
    execute: async (params: Record<string, unknown>) => {
      const color = params.color as string | undefined;
      const costMin = params.costMin as number | undefined;
      const costMax = params.costMax as number | undefined;
      const type = params.type as string | undefined;

      // 色でフィルタ（指定がなければ全カード）
      let results = color ? catalogService.getCardsByColor(COLOR_MAP[color] ?? 0) : [];

      // タイプでフィルタ
      if (type) {
        const typeResults = catalogService.getCardsByType(type as 'unit' | 'trigger' | 'intercept');
        if (color) {
          results = results.filter(c => typeResults.some(t => t.id === c.id));
        } else {
          results = typeResults;
        }
      }

      // コストでフィルタ
      if (costMin !== undefined) {
        results = results.filter(c => c.cost >= costMin);
      }
      if (costMax !== undefined) {
        results = results.filter(c => c.cost <= costMax);
      }

      return results;
    },
  };
}

/**
 * カタログツールレジストリ
 */
export class CatalogToolRegistry {
  private tools: Map<string, MCPTool> = new Map();

  constructor(catalogService: CatalogService, keywordService: KeywordService) {
    // ツールを登録
    const lookupCard = createLookupCardTool(catalogService);
    const lookupKeyword = createLookupKeywordTool(keywordService);
    const searchCards = createSearchCardsTool(catalogService);

    this.tools.set(lookupCard.name, lookupCard);
    this.tools.set(lookupKeyword.name, lookupKeyword);
    this.tools.set(searchCards.name, searchCards);
  }

  /**
   * ツールを名前で取得
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * 全ツールを取得
   */
  getAllTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * ツール呼び出しを実行
   */
  async executeToolCall(name: string, params: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        success: false,
        error: `Unknown tool: ${name}`,
      };
    }

    try {
      const result = await tool.execute(params);
      if (result === null || result === undefined) {
        return {
          success: false,
          error: 'Not found',
        };
      }
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * LLM向けツール定義を取得
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters,
    }));
  }
}

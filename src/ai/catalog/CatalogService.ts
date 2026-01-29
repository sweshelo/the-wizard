// src/ai/catalog/CatalogService.ts
import type { Catalog, KeywordEffect } from '@/submodule/suit/types';
import catalog from '@/submodule/suit/catalog/catalog';
import { CatalogCache } from './CatalogCache';
import { KeywordService } from './KeywordService';

/**
 * 拡張カード情報
 */
export interface EnhancedCardInfo {
  /** カード基本情報 */
  id: string;
  name: string;
  cost: number;
  type: Catalog['type'];
  color: number;
  rarity: Catalog['rarity'];
  /** BP配列 [Lv1, Lv2, Lv3] */
  bp?: [number, number, number];
  /** 種族 */
  species?: string[];
  /** 能力テキスト */
  ability: string;
  /** フォーマット済み能力説明 */
  formattedAbility: string;
  /** 抽出されたキーワード能力 */
  keywords: KeywordEffect[];
}

/**
 * カタログサービス
 * カード情報の取得と検索機能を提供
 */
export class CatalogService {
  private keywordService: KeywordService;
  private enhancedCache: CatalogCache<string, EnhancedCardInfo>;

  constructor() {
    this.keywordService = new KeywordService();
    this.enhancedCache = new CatalogCache<string, EnhancedCardInfo>({ maxSize: 500 });
  }

  /**
   * IDからカード情報を取得
   */
  getById(catalogId: string): Catalog | null {
    const card = catalog.get(catalogId);
    return card ?? null;
  }

  /**
   * 名前でカードを検索（部分一致）
   */
  searchByName(name: string): Catalog[] {
    const results: Catalog[] = [];
    for (const card of catalog.values()) {
      if (card.name.includes(name)) {
        results.push(card);
      }
    }
    return results;
  }

  /**
   * カードタイプでフィルタ
   */
  getCardsByType(type: Catalog['type']): Catalog[] {
    const results: Catalog[] = [];
    for (const card of catalog.values()) {
      if (card.type === type) {
        results.push(card);
      }
    }
    return results;
  }

  /**
   * 色でフィルタ
   */
  getCardsByColor(color: number): Catalog[] {
    const results: Catalog[] = [];
    for (const card of catalog.values()) {
      if (card.color === color) {
        results.push(card);
      }
    }
    return results;
  }

  /**
   * 拡張カード情報を取得
   */
  getEnhancedCardInfo(catalogId: string): EnhancedCardInfo | null {
    // キャッシュチェック
    const cached = this.enhancedCache.get(catalogId);
    if (cached) {
      return cached;
    }

    const card = this.getById(catalogId);
    if (!card) {
      return null;
    }

    const enhanced = this.createEnhancedInfo(card);
    this.enhancedCache.set(catalogId, enhanced);
    return enhanced;
  }

  /**
   * 複数のカード情報を一括取得
   */
  getMultiple(catalogIds: string[]): Map<string, Catalog> {
    const result = new Map<string, Catalog>();
    for (const id of catalogIds) {
      const card = this.getById(id);
      if (card) {
        result.set(id, card);
      }
    }
    return result;
  }

  /**
   * 全カード数を取得
   */
  getTotalCount(): number {
    return catalog.size;
  }

  /**
   * キーワード能力を持つカードを検索
   */
  searchByKeyword(keyword: KeywordEffect): Catalog[] {
    const results: Catalog[] = [];
    for (const card of catalog.values()) {
      if (card.ability.includes(keyword)) {
        results.push(card);
      }
    }
    return results;
  }

  /**
   * 拡張情報を作成
   */
  private createEnhancedInfo(card: Catalog): EnhancedCardInfo {
    const keywords = this.keywordService.extractKeywordsFromText(card.ability);
    const formattedAbility = this.formatAbility(card.ability, keywords);

    return {
      id: card.id,
      name: card.name,
      cost: card.cost,
      type: card.type,
      color: card.color,
      rarity: card.rarity,
      bp: card.bp,
      species: card.species,
      ability: card.ability,
      formattedAbility,
      keywords,
    };
  }

  /**
   * 能力テキストをフォーマット
   */
  private formatAbility(ability: string, keywords: KeywordEffect[]): string {
    let formatted = ability;

    // キーワードの説明を追記
    if (keywords.length > 0) {
      const descriptions: string[] = [];
      for (const keyword of keywords) {
        const desc = this.keywordService.getKeywordDescription(keyword);
        if (desc) {
          descriptions.push(`${keyword}: ${desc}`);
        }
      }
      if (descriptions.length > 0) {
        formatted += `\n\n[キーワード説明]\n${descriptions.join('\n')}`;
      }
    }

    return formatted;
  }
}

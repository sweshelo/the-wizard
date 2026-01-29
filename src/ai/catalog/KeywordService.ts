// src/ai/catalog/KeywordService.ts
import type { KeywordEffect } from '@/submodule/suit/types';

/**
 * キーワード能力のカテゴリ
 */
export type KeywordCategory = 'offensive' | 'defensive' | 'debuff' | 'utility' | 'special';

/**
 * キーワード能力の説明マップ
 */
const KEYWORD_DESCRIPTIONS: Record<KeywordEffect, string> = {
  不屈: '戦闘またはダメージでユニットが破壊された時、行動権を消費して破壊を無効にする',
  貫通: '戦闘で相手ユニットに勝利した時、余剰ダメージを相手プレイヤーに与える',
  加護: '相手の効果の対象にならない',
  固着: '効果によってフィールドを離れない（破壊・バウンス無効）',
  次元干渉: 'コストを支払って相手のトリガーゾーンのカードを1枚ランダムに破壊',
  呪縛: '行動権の回復、効果発動、能力の付与ができない',
  不滅: '破壊されない（戦闘、効果両方）',
  行動制限: '攻撃とブロックができない',
  無我の境地: 'このユニットがいる間、他のユニットへの強化・弱体効果が無効',
  王の治癒力: 'ターン終了時にライフを1回復',
  秩序の盾: '相手の効果で相手がカードを引けない',
  沈黙: '効果を発動できない（既存効果は維持）',
  強制防御:
    '相手がこのユニットを攻撃対象にできる時、必ず攻撃しなければならない。このユニットがいる限り、他のユニットやプレイヤーを攻撃できない',
  攻撃禁止: '攻撃できない',
  防御禁止: 'ブロックできない',
  破壊効果耐性: '効果による破壊を無効にする',
  消滅効果耐性: '効果による消滅を無効にする',
  進化禁止: '進化できない',
  セレクトハック: '相手の選択効果で、このユニットを選択肢に含めなければならない',
  狂戦士: '攻撃時、可能なら必ず攻撃する',
  神託: 'トリガーゾーンのカードが発動した時、追加効果が発動',
  オーバーヒート: 'ターン終了時に破壊される',
  沈黙効果耐性: '沈黙を受けない',
  撤退禁止: '手札に戻らない',
  起動: 'アクティブ状態で効果を発動できる起動型能力',
};

/**
 * キーワードのカテゴリマッピング
 */
const KEYWORD_CATEGORIES: Record<KeywordCategory, KeywordEffect[]> = {
  offensive: ['貫通', '狂戦士', '次元干渉'],
  defensive: ['不屈', '加護', '固着', '不滅', '破壊効果耐性', '消滅効果耐性', '沈黙効果耐性'],
  debuff: [
    '沈黙',
    '呪縛',
    '行動制限',
    '攻撃禁止',
    '防御禁止',
    '進化禁止',
    '撤退禁止',
    'オーバーヒート',
  ],
  utility: ['無我の境地', '王の治癒力', '秩序の盾', '神託', '起動'],
  special: ['強制防御', 'セレクトハック'],
};

/**
 * 全キーワードリスト
 */
const ALL_KEYWORDS: KeywordEffect[] = Object.keys(KEYWORD_DESCRIPTIONS) as KeywordEffect[];

/**
 * キーワード能力サービス
 * キーワード能力の説明やカテゴリ分類を提供
 */
export class KeywordService {
  /**
   * キーワードの説明を取得
   */
  getKeywordDescription(keyword: KeywordEffect): string | undefined {
    return KEYWORD_DESCRIPTIONS[keyword];
  }

  /**
   * 全キーワードを取得
   */
  getAllKeywords(): KeywordEffect[] {
    return [...ALL_KEYWORDS];
  }

  /**
   * テキストからキーワードを抽出
   */
  extractKeywordsFromText(text: string): KeywordEffect[] {
    const found = new Set<KeywordEffect>();

    for (const keyword of ALL_KEYWORDS) {
      if (text.includes(keyword)) {
        found.add(keyword);
      }
    }

    return Array.from(found);
  }

  /**
   * カテゴリでキーワードを取得
   */
  getKeywordsByCategory(category: KeywordCategory): KeywordEffect[] {
    return [...(KEYWORD_CATEGORIES[category] ?? [])];
  }

  /**
   * キーワードのカテゴリを取得
   */
  getKeywordCategory(keyword: KeywordEffect): KeywordCategory | undefined {
    for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
      if (keywords.includes(keyword)) {
        return category as KeywordCategory;
      }
    }
    return undefined;
  }

  /**
   * キーワードが攻撃的かどうか
   */
  isOffensive(keyword: KeywordEffect): boolean {
    return KEYWORD_CATEGORIES.offensive.includes(keyword);
  }

  /**
   * キーワードが防御的かどうか
   */
  isDefensive(keyword: KeywordEffect): boolean {
    return KEYWORD_CATEGORIES.defensive.includes(keyword);
  }

  /**
   * キーワードがデバフかどうか
   */
  isDebuff(keyword: KeywordEffect): boolean {
    return KEYWORD_CATEGORIES.debuff.includes(keyword);
  }
}

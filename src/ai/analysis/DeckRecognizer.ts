// src/ai/analysis/DeckRecognizer.ts

/**
 * デッキタイプ
 */
export type DeckType = 'aggro' | 'midrange' | 'control' | 'combo' | 'unknown';

/**
 * カードの色
 */
export type CardColor = 'red' | 'blue' | 'yellow' | 'green' | 'purple' | 'colorless';

/**
 * カードタイプ
 */
export type CardType = 'unit' | 'trigger' | 'intercept' | 'joker';

/**
 * 観測されたカード情報
 */
export interface CardInfo {
  id: string;
  name: string;
  color: CardColor;
  cost: number;
  type: CardType;
  keywords?: string[];
}

/**
 * デッキ認識結果
 */
export interface DeckRecognitionResult {
  deckType: DeckType;
  confidence: number;
  mainColor: CardColor | null;
  secondaryColor: CardColor | null;
  estimatedStrategy: string;
}

/**
 * デッキプロファイル
 */
export interface DeckProfile {
  totalObserved: number;
  averageCost: number;
  colorDistribution: Record<string, number>;
  typeDistribution: Record<string, number>;
  costCurve: Record<number, number>;
}

/**
 * デッキ認識クラス
 * 相手のプレイしたカードからデッキタイプを推定する
 */
export class DeckRecognizer {
  private observedCards: Map<string, CardInfo> = new Map();

  // デッキタイプ判定の閾値
  private static readonly AGGRO_AVG_COST_THRESHOLD = 3.0;
  private static readonly CONTROL_AVG_COST_THRESHOLD = 4.5;
  private static readonly MIN_CARDS_FOR_CONFIDENCE = 3;
  private static readonly MAX_CARDS_FOR_FULL_CONFIDENCE = 10;

  /**
   * 観測したカードを追加
   */
  addObservedCard(card: CardInfo): void {
    if (!this.observedCards.has(card.id)) {
      this.observedCards.set(card.id, card);
    }
  }

  /**
   * 観測したカードを取得
   */
  getObservedCards(): CardInfo[] {
    return Array.from(this.observedCards.values());
  }

  /**
   * デッキタイプを認識
   */
  recognizeDeckType(): DeckRecognitionResult {
    const cards = this.getObservedCards();

    if (cards.length === 0) {
      return {
        deckType: 'unknown',
        confidence: 0,
        mainColor: null,
        secondaryColor: null,
        estimatedStrategy: '情報不足',
      };
    }

    const profile = this.getDeckProfile();
    const deckType = this.determineDeckType(profile, cards);
    const confidence = this.calculateConfidence(cards.length);
    const { mainColor, secondaryColor } = this.determineColors(cards);
    const estimatedStrategy = this.generateStrategyDescription(deckType, mainColor);

    return {
      deckType,
      confidence,
      mainColor,
      secondaryColor,
      estimatedStrategy,
    };
  }

  /**
   * デッキプロファイルを取得
   */
  getDeckProfile(): DeckProfile {
    const cards = this.getObservedCards();

    if (cards.length === 0) {
      return {
        totalObserved: 0,
        averageCost: 0,
        colorDistribution: {},
        typeDistribution: {},
        costCurve: {},
      };
    }

    const colorDistribution: Record<string, number> = {};
    const typeDistribution: Record<string, number> = {};
    const costCurve: Record<number, number> = {};
    let totalCost = 0;

    for (const card of cards) {
      // 色分布
      colorDistribution[card.color] = (colorDistribution[card.color] || 0) + 1;

      // タイプ分布
      typeDistribution[card.type] = (typeDistribution[card.type] || 0) + 1;

      // コストカーブ
      costCurve[card.cost] = (costCurve[card.cost] || 0) + 1;

      totalCost += card.cost;
    }

    return {
      totalObserved: cards.length,
      averageCost: totalCost / cards.length,
      colorDistribution,
      typeDistribution,
      costCurve,
    };
  }

  /**
   * キーカードを取得
   */
  getKeyCards(): CardInfo[] {
    const cards = this.getObservedCards();

    // キーカードの条件: 高コストユニット、トリガー
    return cards.filter(card => {
      if (card.cost >= 6 && card.type === 'unit') return true;
      if (card.type === 'trigger') return true;
      return false;
    });
  }

  /**
   * クリア
   */
  clear(): void {
    this.observedCards.clear();
  }

  /**
   * デッキタイプを判定
   */
  private determineDeckType(profile: DeckProfile, cards: CardInfo[]): DeckType {
    const { averageCost, typeDistribution } = profile;

    // トリガー数の比率
    const triggerCount = typeDistribution['trigger'] || 0;
    const triggerRatio = cards.length > 0 ? triggerCount / cards.length : 0;

    // アグロ判定: 低コスト中心
    if (averageCost <= DeckRecognizer.AGGRO_AVG_COST_THRESHOLD && triggerRatio < 0.3) {
      return 'aggro';
    }

    // コントロール判定: 高コスト + トリガー多め
    if (averageCost >= DeckRecognizer.CONTROL_AVG_COST_THRESHOLD || triggerRatio >= 0.4) {
      return 'control';
    }

    // ミッドレンジ: 中間
    return 'midrange';
  }

  /**
   * 信頼度を計算
   */
  private calculateConfidence(cardCount: number): number {
    if (cardCount < DeckRecognizer.MIN_CARDS_FOR_CONFIDENCE) {
      return (cardCount / DeckRecognizer.MIN_CARDS_FOR_CONFIDENCE) * 0.5;
    }

    const additionalCards = cardCount - DeckRecognizer.MIN_CARDS_FOR_CONFIDENCE;
    const maxAdditional =
      DeckRecognizer.MAX_CARDS_FOR_FULL_CONFIDENCE - DeckRecognizer.MIN_CARDS_FOR_CONFIDENCE;
    const additionalConfidence = Math.min(additionalCards / maxAdditional, 1) * 0.5;

    return 0.5 + additionalConfidence;
  }

  /**
   * 色を判定
   */
  private determineColors(cards: CardInfo[]): {
    mainColor: CardColor | null;
    secondaryColor: CardColor | null;
  } {
    const colorCounts: Record<string, number> = {};

    for (const card of cards) {
      if (card.color !== 'colorless') {
        colorCounts[card.color] = (colorCounts[card.color] || 0) + 1;
      }
    }

    const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);

    return {
      mainColor: sortedColors[0] ? (sortedColors[0][0] as CardColor) : null,
      secondaryColor: sortedColors[1] ? (sortedColors[1][0] as CardColor) : null,
    };
  }

  /**
   * 戦略説明を生成
   */
  private generateStrategyDescription(deckType: DeckType, mainColor: CardColor | null): string {
    const colorName = mainColor ? this.getColorName(mainColor) : '';

    switch (deckType) {
      case 'aggro':
        return `${colorName}アグロ: 早期決着を狙う攻撃的なデッキ`;
      case 'control':
        return `${colorName}コントロール: 除去とトリガーで盤面制圧`;
      case 'midrange':
        return `${colorName}ミッドレンジ: バランスの取れた構成`;
      case 'combo':
        return `${colorName}コンボ: 特定のカードシナジーを狙う`;
      default:
        return '分析中...';
    }
  }

  /**
   * 色名を取得
   */
  private getColorName(color: CardColor): string {
    const names: Record<CardColor, string> = {
      red: '赤',
      blue: '青',
      yellow: '黄',
      green: '緑',
      purple: '紫',
      colorless: '無色',
    };
    return names[color];
  }
}

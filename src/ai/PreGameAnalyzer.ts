// src/ai/PreGameAnalyzer.ts

/**
 * デッキカード情報
 */
export interface DeckCard {
  catalogId: string;
  name: string;
  cost: number;
  type: 'unit' | 'trigger' | 'intercept' | 'advanced_unit' | 'virus' | 'joker';
  color: number;
}

/**
 * デッキ構成分析結果
 */
export interface DeckComposition {
  /** ユニット枚数 */
  unitCount: number;
  /** トリガー枚数 */
  triggerCount: number;
  /** インターセプト枚数 */
  interceptCount: number;
  /** メインカラー */
  primaryColor: number;
  /** サブカラー */
  secondaryColor?: number;
  /** コスト分布 */
  costDistribution: Record<number, number>;
  /** 平均コスト */
  averageCost: number;
  /** 総枚数 */
  totalCards: number;
}

/**
 * キーカード情報
 */
export interface KeyCard {
  catalogId: string;
  name: string;
  count: number;
  role: string;
}

/**
 * 戦略情報
 */
export interface DeckStrategy {
  archetype: string;
  playstyle: string;
  winCondition: string;
}

/**
 * ゲーム開始前分析結果
 */
export interface PreGameAnalysis {
  composition: DeckComposition;
  keyCards: KeyCard[];
  strategy: DeckStrategy;
  mulliganAdvice: string;
  summary: string;
}

/**
 * ゲーム開始前分析クラス
 * デッキ構成を分析し、戦略を提案
 */
export class PreGameAnalyzer {
  /**
   * デッキ構成を分析
   */
  analyzeDeckComposition(deck: DeckCard[]): DeckComposition {
    const unitCount = deck.filter(c => c.type === 'unit' || c.type === 'advanced_unit').length;
    const triggerCount = deck.filter(c => c.type === 'trigger').length;
    const interceptCount = deck.filter(c => c.type === 'intercept').length;

    // カラー分析
    const colorCounts: Record<number, number> = {};
    for (const card of deck) {
      colorCounts[card.color] = (colorCounts[card.color] ?? 0) + 1;
    }
    const sortedColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([color]) => Number(color));

    const primaryColor = sortedColors[0] ?? 1;
    const secondaryColor = sortedColors[1];

    // コスト分布
    const costDistribution: Record<number, number> = {};
    let totalCost = 0;
    for (const card of deck) {
      costDistribution[card.cost] = (costDistribution[card.cost] ?? 0) + 1;
      totalCost += card.cost;
    }

    const averageCost = deck.length > 0 ? totalCost / deck.length : 0;

    return {
      unitCount,
      triggerCount,
      interceptCount,
      primaryColor,
      secondaryColor,
      costDistribution,
      averageCost,
      totalCards: deck.length,
    };
  }

  /**
   * キーカードを特定
   */
  identifyKeyCards(deck: DeckCard[]): KeyCard[] {
    // カード名ごとにカウント
    const cardCounts: Map<string, { card: DeckCard; count: number }> = new Map();
    for (const card of deck) {
      const existing = cardCounts.get(card.catalogId);
      if (existing) {
        existing.count++;
      } else {
        cardCounts.set(card.catalogId, { card, count: 1 });
      }
    }

    // 複数枚採用されているカードをキーカードとして抽出
    const keyCards: KeyCard[] = [];
    for (const { card, count } of cardCounts.values()) {
      if (count >= 2) {
        keyCards.push({
          catalogId: card.catalogId,
          name: card.name,
          count,
          role: this.determineCardRole(card),
        });
      }
    }

    // 枚数順にソート
    return keyCards.sort((a, b) => b.count - a.count);
  }

  /**
   * カードの役割を判定
   */
  private determineCardRole(card: DeckCard): string {
    if (card.type === 'unit' || card.type === 'advanced_unit') {
      if (card.cost <= 2) return 'アタッカー/序盤展開';
      if (card.cost <= 4) return 'ミッドレンジアタッカー';
      return 'フィニッシャー';
    }
    if (card.type === 'intercept') return '妨害/サポート';
    if (card.type === 'trigger') return 'トリガー効果';
    return '特殊';
  }

  /**
   * 戦略を生成
   */
  generateStrategy(composition: DeckComposition): DeckStrategy {
    const { averageCost, primaryColor } = composition;

    // アーキタイプ判定
    let archetype: string;
    let playstyle: string;
    let winCondition: string;

    if (averageCost <= 2.5) {
      archetype = 'アグロ';
      playstyle = '序盤から積極的に攻撃し、相手が体勢を整える前に決着を付ける';
      winCondition = '速攻で相手ライフを削り切る';
    } else if (averageCost <= 3.5) {
      archetype = 'ミッドレンジ';
      playstyle = 'バランスの良い展開で盤面を制圧し、中盤以降に有利を築く';
      winCondition = '盤面アドバンテージから押し切る';
    } else {
      archetype = 'コントロール';
      playstyle = '序盤を耐え、強力な後半戦のカードで逆転する';
      winCondition = '大型ユニットで盤面を支配する';
    }

    // 色によるアーキタイプ補正
    if (primaryColor === 1) {
      archetype = averageCost <= 3 ? 'アグロ' : archetype;
    } else if (primaryColor === 3) {
      archetype = averageCost >= 3 ? 'コントロール' : archetype;
    }

    return { archetype, playstyle, winCondition };
  }

  /**
   * マリガン指針を生成
   */
  generateMulliganAdvice(composition: DeckComposition): string {
    const { averageCost } = composition;

    if (averageCost <= 2.5) {
      return '低コストユニットを優先的にキープ。2コスト以下のユニットを2枚以上確保したい。';
    } else if (averageCost <= 3.5) {
      return '2〜3コストのユニットをバランスよくキープ。序盤の動きを確保しつつ、中盤につなげる。';
    } else {
      return '序盤の壁となるユニットを確保。高コストカードは1枚程度に抑え、序盤の展開を優先。';
    }
  }

  /**
   * 分析レポートを作成
   */
  createAnalysisReport(deck: DeckCard[]): PreGameAnalysis {
    const composition = this.analyzeDeckComposition(deck);
    const keyCards = this.identifyKeyCards(deck);
    const strategy = this.generateStrategy(composition);
    const mulliganAdvice = this.generateMulliganAdvice(composition);

    // サマリー生成
    const keyCardNames = keyCards
      .slice(0, 3)
      .map(k => k.name)
      .join('、');
    const summary =
      `【${strategy.archetype}】${strategy.playstyle}\n` +
      `キーカード: ${keyCardNames || 'なし'}\n` +
      `勝ち筋: ${strategy.winCondition}\n` +
      `マリガン: ${mulliganAdvice}`;

    return {
      composition,
      keyCards,
      strategy,
      mulliganAdvice,
      summary,
    };
  }
}

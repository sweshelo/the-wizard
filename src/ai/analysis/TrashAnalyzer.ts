// src/ai/analysis/TrashAnalyzer.ts

import type { CardColor, CardType } from './DeckRecognizer';

/**
 * 捨札のカード情報
 */
export interface TrashCard {
  id: string;
  name: string;
  color: CardColor;
  cost: number;
  type: CardType;
}

/**
 * 傾向分析結果
 */
export interface TendencyAnalysis {
  playstyle: 'aggressive' | 'defensive' | 'balanced';
  averageCost: number;
  dominantColor: CardColor | null;
  triggerRatio: number;
}

/**
 * 監視対象カード
 */
export interface WatchCard {
  card: TrashCard;
  reason: string;
  threatLevel: 'low' | 'medium' | 'high';
}

/**
 * 捨札分析クラス
 * 相手の捨札から戦略を分析する
 */
export class TrashAnalyzer {
  private trashPile: TrashCard[] = [];
  private previousTrash: Set<string> = new Set();
  private newlyTrashed: TrashCard[] = [];
  private knownDeckCards: TrashCard[] = [];

  /**
   * 捨札を更新
   */
  updateTrash(trash: TrashCard[]): void {
    // 新しく追加されたカードを検出
    const currentIds = new Set(trash.map(c => c.id));
    this.newlyTrashed = trash.filter(c => !this.previousTrash.has(c.id));

    // 状態を更新
    this.trashPile = [...trash];
    this.previousTrash = currentIds;
  }

  /**
   * 捨札を取得
   */
  getTrashPile(): TrashCard[] {
    return [...this.trashPile];
  }

  /**
   * 新しく捨てられたカードを取得
   */
  getNewlyTrashed(): TrashCard[] {
    return [...this.newlyTrashed];
  }

  /**
   * 既知のデッキカードを設定
   */
  setKnownDeckCards(cards: TrashCard[]): void {
    this.knownDeckCards = [...cards];
  }

  /**
   * 色分布を分析
   */
  analyzeColorDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const card of this.trashPile) {
      distribution[card.color] = (distribution[card.color] || 0) + 1;
    }

    return distribution;
  }

  /**
   * タイプ分布を分析
   */
  analyzeTypeDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const card of this.trashPile) {
      distribution[card.type] = (distribution[card.type] || 0) + 1;
    }

    return distribution;
  }

  /**
   * 未使用のキーカードを推定
   */
  estimateUnusedKeyCards(): TrashCard[] {
    const trashedIds = new Set(this.trashPile.map(c => c.id));

    // 既知のデッキカードで、まだ捨札にないもの
    const unused = this.knownDeckCards.filter(c => !trashedIds.has(c.id));

    // 高コストカードを優先
    return unused.filter(c => c.cost >= 5 || c.type === 'trigger').sort((a, b) => b.cost - a.cost);
  }

  /**
   * 監視リストを取得
   */
  getWatchList(): WatchCard[] {
    const unused = this.estimateUnusedKeyCards();
    const watchList: WatchCard[] = [];

    for (const card of unused) {
      let threatLevel: 'low' | 'medium' | 'high' = 'low';
      let reason = '';

      if (card.cost >= 7) {
        threatLevel = 'high';
        reason = '高コストフィニッシャー';
      } else if (card.cost >= 5) {
        threatLevel = 'medium';
        reason = '中堅カード';
      } else if (card.type === 'trigger') {
        threatLevel = 'medium';
        reason = 'トリガーカード';
      } else {
        reason = '未使用カード';
      }

      watchList.push({ card, reason, threatLevel });
    }

    return watchList.sort((a, b) => {
      const levelOrder = { high: 0, medium: 1, low: 2 };
      return levelOrder[a.threatLevel] - levelOrder[b.threatLevel];
    });
  }

  /**
   * 傾向を分析
   */
  getTendencies(): TendencyAnalysis {
    if (this.trashPile.length === 0) {
      return {
        playstyle: 'balanced',
        averageCost: 0,
        dominantColor: null,
        triggerRatio: 0,
      };
    }

    // 平均コスト
    const totalCost = this.trashPile.reduce((sum, c) => sum + c.cost, 0);
    const averageCost = totalCost / this.trashPile.length;

    // トリガー比率
    const triggerCount = this.trashPile.filter(c => c.type === 'trigger').length;
    const triggerRatio = triggerCount / this.trashPile.length;

    // 支配的な色
    const colorDist = this.analyzeColorDistribution();
    let dominantColor: CardColor | null = null;
    let maxCount = 0;
    for (const [color, count] of Object.entries(colorDist)) {
      if (count > maxCount) {
        maxCount = count;
        dominantColor = color as CardColor;
      }
    }

    // プレイスタイル判定
    let playstyle: 'aggressive' | 'defensive' | 'balanced';
    if (averageCost <= 3 && triggerRatio < 0.2) {
      playstyle = 'aggressive';
    } else if (triggerRatio >= 0.3 || averageCost >= 4) {
      playstyle = 'defensive';
    } else {
      playstyle = 'balanced';
    }

    return {
      playstyle,
      averageCost,
      dominantColor,
      triggerRatio,
    };
  }

  /**
   * クリア
   */
  clear(): void {
    this.trashPile = [];
    this.previousTrash.clear();
    this.newlyTrashed = [];
    this.knownDeckCards = [];
  }

  /**
   * プロンプト用にフォーマット
   */
  formatForPrompt(): string {
    if (this.trashPile.length === 0) {
      return '相手の捨札: なし';
    }

    const lines: string[] = [];
    lines.push(`## 相手の捨札分析 (${this.trashPile.length}枚)`);

    // カード一覧
    lines.push('### カード一覧');
    for (const card of this.trashPile) {
      lines.push(`- ${card.name} (${card.color}, コスト${card.cost}, ${card.type})`);
    }

    // 傾向
    const tendencies = this.getTendencies();
    lines.push('');
    lines.push('### 傾向');
    lines.push(`プレイスタイル: ${tendencies.playstyle}`);
    lines.push(`平均コスト: ${tendencies.averageCost.toFixed(1)}`);
    if (tendencies.dominantColor) {
      lines.push(`主要カラー: ${tendencies.dominantColor}`);
    }

    // 監視リスト
    const watchList = this.getWatchList();
    if (watchList.length > 0) {
      lines.push('');
      lines.push('### 警戒すべきカード');
      for (const watch of watchList.slice(0, 5)) {
        lines.push(`- ${watch.card.name}: ${watch.reason} (${watch.threatLevel})`);
      }
    }

    return lines.join('\n');
  }
}

// src/ai/analysis/StrategyAdapter.ts

import type { DeckRecognitionResult, CardColor } from './DeckRecognizer';

/**
 * プレイスタイル
 */
export type Playstyle = 'aggressive' | 'defensive' | 'balanced';

/**
 * 戦略適応結果
 */
export interface AdaptedStrategy {
  playstyle: Playstyle;
  priorities: string[];
  warnings: string[];
  tips: string[];
}

/**
 * マリガンアドバイス
 */
export interface MulliganAdvice {
  keepLowCost: boolean;
  targetCostRange: { min: number; max: number };
  priorityCardTypes: string[];
  advice: string;
}

/**
 * ブロッキングアドバイス
 */
export interface BlockingAdvice {
  shouldBlockAggressively: boolean;
  lifeThreshold: number;
  advice: string;
}

/**
 * 攻撃アドバイス
 */
export interface AttackAdvice {
  shouldAttackAggressively: boolean;
  preserveBlockers: boolean;
  advice: string;
}

/**
 * 戦略適応クラス
 * 相手のデッキタイプに基づいて戦略を調整する
 */
export class StrategyAdapter {
  /**
   * 戦略を適応
   */
  adaptStrategy(opponentDeck: DeckRecognitionResult): AdaptedStrategy {
    switch (opponentDeck.deckType) {
      case 'aggro':
        return this.adaptAgainstAggro(opponentDeck);
      case 'control':
        return this.adaptAgainstControl(opponentDeck);
      case 'midrange':
        return this.adaptAgainstMidrange(opponentDeck);
      case 'combo':
        return this.adaptAgainstCombo(opponentDeck);
      default:
        return this.adaptAgainstUnknown();
    }
  }

  /**
   * マリガンアドバイスを取得
   */
  getMulliganAdvice(opponentDeck: DeckRecognitionResult): MulliganAdvice {
    switch (opponentDeck.deckType) {
      case 'aggro':
        return {
          keepLowCost: true,
          targetCostRange: { min: 1, max: 4 },
          priorityCardTypes: ['unit', 'intercept'],
          advice: 'アグロ対策: 序盤を凌ぐ低コストユニットを優先',
        };
      case 'control':
        return {
          keepLowCost: false,
          targetCostRange: { min: 2, max: 6 },
          priorityCardTypes: ['unit'],
          advice: 'コントロール対策: 中〜高コストのフィニッシャーを確保',
        };
      default:
        return {
          keepLowCost: true,
          targetCostRange: { min: 2, max: 5 },
          priorityCardTypes: ['unit'],
          advice: 'バランスの取れた手札を目指す',
        };
    }
  }

  /**
   * ブロッキングアドバイスを取得
   */
  getBlockingAdvice(opponentDeck: DeckRecognitionResult): BlockingAdvice {
    switch (opponentDeck.deckType) {
      case 'aggro':
        return {
          shouldBlockAggressively: true,
          lifeThreshold: 5,
          advice: 'アグロ相手: ライフを守るため積極的にブロック',
        };
      case 'control':
        return {
          shouldBlockAggressively: false,
          lifeThreshold: 3,
          advice: 'コントロール相手: ユニットを温存し、致命的なダメージのみブロック',
        };
      default:
        return {
          shouldBlockAggressively: false,
          lifeThreshold: 4,
          advice: '状況に応じてブロック判断',
        };
    }
  }

  /**
   * 攻撃アドバイスを取得
   */
  getAttackAdvice(opponentDeck: DeckRecognitionResult): AttackAdvice {
    switch (opponentDeck.deckType) {
      case 'aggro':
        return {
          shouldAttackAggressively: false,
          preserveBlockers: true,
          advice: 'アグロ相手: ブロッカーを維持し、安全な時のみ攻撃',
        };
      case 'control':
        return {
          shouldAttackAggressively: true,
          preserveBlockers: false,
          advice: 'コントロール相手: 長期戦を避けるため積極的に攻撃',
        };
      default:
        return {
          shouldAttackAggressively: false,
          preserveBlockers: false,
          advice: '有利なトレードができる時に攻撃',
        };
    }
  }

  /**
   * LLM用の戦略プロンプトを生成
   */
  formatStrategyPrompt(opponentDeck: DeckRecognitionResult): string {
    const strategy = this.adaptStrategy(opponentDeck);
    const colorInfo = opponentDeck.mainColor
      ? `メインカラー: ${this.getColorName(opponentDeck.mainColor)}`
      : '';

    return `## 相手デッキ分析
タイプ: ${opponentDeck.deckType}
${colorInfo}
信頼度: ${Math.round(opponentDeck.confidence * 100)}%
戦略概要: ${opponentDeck.estimatedStrategy}

## 推奨プレイスタイル: ${strategy.playstyle}

### 優先事項
${strategy.priorities.map(p => `- ${p}`).join('\n')}

### 警戒ポイント
${strategy.warnings.map(w => `- ${w}`).join('\n')}

### ヒント
${strategy.tips.map(t => `- ${t}`).join('\n')}`;
  }

  /**
   * アグロ対策
   */
  private adaptAgainstAggro(opponentDeck: DeckRecognitionResult): AdaptedStrategy {
    const colorWarnings = this.getColorWarnings(opponentDeck.mainColor);

    return {
      playstyle: 'defensive',
      priorities: ['ライフ維持', '盤面安定化', '除去温存'],
      warnings: ['序盤の猛攻に注意', '低コストユニットの展開を警戒', ...colorWarnings],
      tips: ['ブロッカーを維持', '無理な攻撃は避ける', '中盤以降で逆転を狙う'],
    };
  }

  /**
   * コントロール対策
   */
  private adaptAgainstControl(opponentDeck: DeckRecognitionResult): AdaptedStrategy {
    const colorWarnings = this.getColorWarnings(opponentDeck.mainColor);

    return {
      playstyle: 'aggressive',
      priorities: ['速攻', 'ダメージ優先', 'リソース勝負を避ける'],
      warnings: ['除去カードに注意', 'トリガーを警戒', ...colorWarnings],
      tips: ['長期戦は不利', '積極的に攻撃', '全力展開よりも継続的な圧力'],
    };
  }

  /**
   * ミッドレンジ対策
   */
  private adaptAgainstMidrange(opponentDeck: DeckRecognitionResult): AdaptedStrategy {
    const colorWarnings = this.getColorWarnings(opponentDeck.mainColor);

    return {
      playstyle: 'balanced',
      priorities: ['リソース管理', '有利トレード', 'テンポ維持'],
      warnings: ['バランスの取れた構成を警戒', '中盤の主導権争い', ...colorWarnings],
      tips: ['カード効率を重視', '盤面アドバンテージを維持', 'キーカードを見極める'],
    };
  }

  /**
   * コンボ対策
   */
  private adaptAgainstCombo(_opponentDeck: DeckRecognitionResult): AdaptedStrategy {
    return {
      playstyle: 'aggressive',
      priorities: ['速攻', 'コンボパーツ除去', '妨害'],
      warnings: ['コンボ発動を警戒', '特定カードの組み合わせに注意'],
      tips: ['コンボ成立前に決着', 'キーカードを優先除去', 'ハンデスが有効'],
    };
  }

  /**
   * 不明なデッキへの対策
   */
  private adaptAgainstUnknown(): AdaptedStrategy {
    return {
      playstyle: 'balanced',
      priorities: ['情報収集', 'バランス維持', '柔軟な対応'],
      warnings: ['相手の動きを観察', '予期せぬ展開に備える'],
      tips: ['リソースを温存', '状況に応じて戦略を調整', '相手のキーカードを見極める'],
    };
  }

  /**
   * 色別の警戒ポイント
   */
  private getColorWarnings(color: CardColor | null): string[] {
    if (!color) return [];

    const warnings: Record<CardColor, string[]> = {
      red: ['赤: 速攻と高火力に警戒', '赤: バーンダメージに注意'],
      blue: ['青: 除去とバウンスに警戒', '青: トリガーが多い可能性'],
      yellow: ['黄: 展開力に警戒', '黄: 横並びからの一斉攻撃'],
      green: ['緑: 高BPユニットに警戒', '緑: 成長系効果に注意'],
      purple: ['紫: 特殊効果に警戒', '紫: トリッキーな動きに注意'],
      colorless: [],
    };

    return warnings[color] || [];
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

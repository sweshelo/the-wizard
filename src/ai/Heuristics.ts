// src/ai/Heuristics.ts

import type {
  AIGameContext,
  AIDecision,
  MulliganDecision,
  ChoiceResponse,
  CompactCard,
  CompactUnit,
} from './types';

/**
 * ヒューリスティック設定
 */
export interface HeuristicsConfig {
  /** マリガンで許容する高コストカードの枚数 */
  maxHighCostCardsForKeep: number;
  /** 高コストの閾値 */
  highCostThreshold: number;
  /** ブロック判断のBP差の閾値 */
  blockBPThreshold: number;
}

/**
 * デフォルト設定
 */
export const DEFAULT_HEURISTICS_CONFIG: HeuristicsConfig = {
  maxHighCostCardsForKeep: 2,
  highCostThreshold: 5,
  blockBPThreshold: 1000,
};

/**
 * ヒューリスティクス - API障害時のフォールバック用ルールベース判断
 */
export class Heuristics {
  private config: HeuristicsConfig;

  constructor(config: Partial<HeuristicsConfig> = {}) {
    this.config = { ...DEFAULT_HEURISTICS_CONFIG, ...config };
  }

  /**
   * マリガン判断（コスト分布に基づく）
   */
  decideMulligan(context: AIGameContext): MulliganDecision {
    const hand = context.myHand;

    // 手札が空の場合はマリガンしない
    if (hand.length === 0) {
      return {
        shouldMulligan: false,
        reason: '手札が空のため判断不可',
      };
    }

    // 高コストカードの枚数をカウント
    const highCostCards = hand.filter(card => card.cost >= this.config.highCostThreshold);
    const lowCostUnits = hand.filter(card => card.type === 'unit' && card.cost <= 3);

    // 高コストカードが多すぎる場合はマリガン
    if (highCostCards.length > this.config.maxHighCostCardsForKeep) {
      return {
        shouldMulligan: true,
        reason: `高コストカードが${highCostCards.length}枚（閾値: ${this.config.maxHighCostCardsForKeep}）`,
      };
    }

    // 低コストユニットが少なすぎる場合はマリガン
    if (lowCostUnits.length === 0) {
      return {
        shouldMulligan: true,
        reason: '序盤に出せるユニットがない',
      };
    }

    return {
      shouldMulligan: false,
      reason: `手札のコスト分布が適切（低コストユニット: ${lowCostUnits.length}枚）`,
    };
  }

  /**
   * ユニット召喚の優先順位を決定
   */
  decideUnitSummon(context: AIGameContext): AIDecision | null {
    const { myHand, self } = context;
    const currentCP = self.cp.current;

    // プレイ可能なユニットを抽出
    const playableUnits = myHand.filter(
      card => card.type === 'unit' && card.playable && card.cost <= currentCP
    );

    if (playableUnits.length === 0) {
      return null;
    }

    // CPを最大限活用できるユニットを選択
    const sortedUnits = [...playableUnits].sort((a, b) => {
      // コストが高いほど優先（CPを有効活用）
      return b.cost - a.cost;
    });

    const selectedUnit = sortedUnits[0];

    return {
      action: 'UnitDrive',
      targetId: selectedUnit.id,
      reason: `CP効率を考慮して${selectedUnit.name}（コスト${selectedUnit.cost}）を召喚`,
    };
  }

  /**
   * ブロッカー選択判断（BP比較に基づく）
   */
  decideBlock(
    context: AIGameContext,
    attackerBP: number,
    availableBlockers: CompactUnit[]
  ): ChoiceResponse {
    if (availableBlockers.length === 0) {
      return {
        selectedIds: [],
        reason: 'ブロック可能なユニットがいない',
      };
    }

    // 相打ち以上、または許容BP差以内で相討ちが取れるユニットを探す
    const viableBlockers = availableBlockers.filter(
      unit => attackerBP - unit.bp <= this.config.blockBPThreshold
    );

    if (viableBlockers.length > 0) {
      // 最もBPが低い（無駄が少ない）ユニットでブロック
      const bestBlocker = viableBlockers.reduce((prev, curr) => (curr.bp < prev.bp ? curr : prev));

      return {
        selectedIds: [bestBlocker.id],
        reason: `${bestBlocker.name}（BP ${bestBlocker.bp}）でブロック（攻撃者BP: ${attackerBP}）`,
      };
    }

    // 相打ちが取れない場合
    // ライフが危険でない限りブロックしない
    if (context.self.life <= 3) {
      // 最もBPが高いユニットでブロック（壁）
      const bestWall = availableBlockers.reduce((prev, curr) => (curr.bp > prev.bp ? curr : prev));

      return {
        selectedIds: [bestWall.id],
        reason: `ライフが危険なため${bestWall.name}でブロック`,
      };
    }

    return {
      selectedIds: [],
      reason: '有利なブロックが取れないためスルー',
    };
  }

  /**
   * カード選択判断
   */
  decideCardSelection(
    availableCards: CompactCard[],
    count: number,
    _context: AIGameContext
  ): ChoiceResponse {
    if (availableCards.length === 0) {
      return {
        selectedIds: [],
        reason: '選択可能なカードがない',
      };
    }

    // 指定枚数分選択（コストの低い順）
    const sorted = [...availableCards].sort((a, b) => a.cost - b.cost);
    const selected = sorted.slice(0, count);

    return {
      selectedIds: selected.map(c => c.id),
      reason: `${selected.map(c => c.name).join(', ')}を選択`,
    };
  }

  /**
   * ユニット選択判断
   */
  decideUnitSelection(
    availableUnits: CompactUnit[],
    _context: AIGameContext,
    isCancelable: boolean
  ): ChoiceResponse {
    if (availableUnits.length === 0) {
      return {
        selectedIds: [],
        reason: '選択可能なユニットがない',
      };
    }

    // 最もBPが低いユニットを選択（一般的に弱いユニットが効果対象になりやすい）
    const weakest = availableUnits.reduce((prev, curr) => (curr.bp < prev.bp ? curr : prev));

    // キャンセル可能で、選択が不利な場合はキャンセル
    if (isCancelable && this.shouldCancelSelection(availableUnits)) {
      return {
        selectedIds: [],
        reason: '選択をキャンセル',
      };
    }

    return {
      selectedIds: [weakest.id],
      reason: `${weakest.name}（BP ${weakest.bp}）を選択`,
    };
  }

  /**
   * インターセプト使用判断
   */
  decideIntercept(availableIntercepts: CompactCard[], _context: AIGameContext): ChoiceResponse {
    // 基本的にインターセプトは使用しない（保守的な判断）
    // より高度な判断はLLMに委ねる
    if (availableIntercepts.length === 0) {
      return {
        selectedIds: [],
        reason: '使用可能なインターセプトがない',
      };
    }

    return {
      selectedIds: [],
      reason: 'インターセプトを温存',
    };
  }

  /**
   * オプション選択判断
   */
  decideOption(
    options: Array<{ id: string; description: string }>,
    _context: AIGameContext
  ): ChoiceResponse {
    if (options.length === 0) {
      return {
        selectedIds: [],
        reason: '選択肢がない',
      };
    }

    // 最初のオプションを選択（デフォルト動作）
    return {
      selectedIds: [options[0].id],
      reason: `「${options[0].description}」を選択`,
    };
  }

  /**
   * ターンエンド判断
   */
  shouldEndTurn(context: AIGameContext): AIDecision {
    const { myHand, self, myField } = context;
    const currentCP = self.cp.current;

    // CPが残っていてもプレイ可能なカードがない場合はターンエンド
    const playableCards = myHand.filter(card => card.playable && card.cost <= currentCP);
    const hasBootableUnits = myField.some(unit => unit.canBoot);

    if (playableCards.length === 0 && !hasBootableUnits) {
      return {
        action: 'TurnEnd',
        reason: 'プレイ可能なアクションがないためターン終了',
      };
    }

    // 手札が十分にある場合は召喚を試みる
    if (playableCards.length > 0) {
      const unitDecision = this.decideUnitSummon(context);
      if (unitDecision) {
        return unitDecision;
      }
    }

    return {
      action: 'TurnEnd',
      reason: '最適なアクションがないためターン終了',
    };
  }

  /**
   * 選択をキャンセルすべきかどうか
   */
  private shouldCancelSelection(units: CompactUnit[]): boolean {
    // 全ユニットが高価値（BP 5000以上）の場合はキャンセル
    return units.every(unit => unit.bp >= 5000);
  }
}

/**
 * ヒューリスティクスインスタンスを作成
 */
export function createHeuristics(config?: Partial<HeuristicsConfig>): Heuristics {
  return new Heuristics(config);
}

/**
 * デフォルトのヒューリスティクスインスタンス
 */
export const defaultHeuristics = new Heuristics();

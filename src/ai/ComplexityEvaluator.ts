// src/ai/ComplexityEvaluator.ts

import type { AIGameContext, CompactUnit, CompactCard, LLMModel } from './types';
import { AI_CONFIG } from './constants';

/**
 * 複雑性評価の結果
 */
export interface ComplexityEvaluation {
  /** 総合複雑性スコア */
  score: number;
  /** 「場に出た時」以外の効果を持つカードがあるか */
  hasNonEntryEffects: boolean;
  /** フィールド上のDelta効果の総数 */
  deltaCount: number;
  /** トリガーゾーンにカードがセットされているか */
  triggerZoneActive: boolean;
  /** 手札のインターセプト枚数 */
  interceptsInHand: number;
  /** 相手フィールドの脅威度 */
  opponentFieldThreats: number;
  /** 自フィールドのユニット数 */
  myFieldUnitCount: number;
  /** 相手フィールドのユニット数 */
  opponentFieldUnitCount: number;
  /** 推奨モデル */
  recommendedModel: LLMModel;
}

/**
 * 複雑性評価の設定
 */
export interface ComplexityEvaluatorConfig {
  /** Opus使用の閾値 */
  opusThreshold: number;
  /** Sonnet使用の閾値 */
  sonnetThreshold: number;
}

/**
 * デフォルト設定
 */
export const DEFAULT_COMPLEXITY_CONFIG: ComplexityEvaluatorConfig = {
  opusThreshold: AI_CONFIG.COMPLEXITY_THRESHOLD,
  sonnetThreshold: 2,
};

/**
 * 非入場効果を持つキーワード
 */
const NON_ENTRY_KEYWORDS = [
  '不屈',
  '貫通',
  '加護',
  '固着',
  '秩序の盾',
  '沈黙',
  '無我の境地',
  'ウイルス',
  '呪縛',
  '不死',
  '起動',
];

/**
 * 高脅威度キーワード
 */
const HIGH_THREAT_KEYWORDS = ['不屈', '貫通', '加護', '不死'];

/**
 * 盤面複雑性評価クラス
 */
export class ComplexityEvaluator {
  private config: ComplexityEvaluatorConfig;

  constructor(config: Partial<ComplexityEvaluatorConfig> = {}) {
    this.config = { ...DEFAULT_COMPLEXITY_CONFIG, ...config };
  }

  /**
   * 盤面の複雑性を評価
   */
  evaluate(context: AIGameContext): ComplexityEvaluation {
    const hasNonEntryEffects = this.checkNonEntryEffects(context);
    const deltaCount = this.countDeltas(context);
    const triggerZoneActive = context.myTrigger.length > 0;
    const interceptsInHand = this.countIntercepts(context.myHand);
    const opponentFieldThreats = this.evaluateThreats(context.opponentField);
    const myFieldUnitCount = context.myField.length;
    const opponentFieldUnitCount = context.opponentField.length;

    // 複雑性スコアを計算
    const score = this.calculateScore({
      hasNonEntryEffects,
      deltaCount,
      triggerZoneActive,
      interceptsInHand,
      opponentFieldThreats,
      myFieldUnitCount,
      opponentFieldUnitCount,
    });

    // 推奨モデルを決定
    const recommendedModel = this.determineModel(score);

    return {
      score,
      hasNonEntryEffects,
      deltaCount,
      triggerZoneActive,
      interceptsInHand,
      opponentFieldThreats,
      myFieldUnitCount,
      opponentFieldUnitCount,
      recommendedModel,
    };
  }

  /**
   * Opusを使用すべきかどうか
   */
  shouldUseOpus(context: AIGameContext): boolean {
    const evaluation = this.evaluate(context);
    return evaluation.score >= this.config.opusThreshold;
  }

  /**
   * 推奨モデルを取得
   */
  getRecommendedModel(context: AIGameContext): LLMModel {
    return this.evaluate(context).recommendedModel;
  }

  /**
   * 非入場効果を持つカードがあるかチェック
   */
  private checkNonEntryEffects(context: AIGameContext): boolean {
    const allUnits = [...context.myField, ...context.opponentField];
    return allUnits.some(unit => this.hasNonEntryAbility(unit));
  }

  /**
   * ユニットが非入場効果を持つかチェック
   */
  private hasNonEntryAbility(unit: CompactUnit): boolean {
    return unit.abilities.some(ability =>
      NON_ENTRY_KEYWORDS.some(keyword => ability.includes(keyword))
    );
  }

  /**
   * Delta効果の数をカウント
   */
  private countDeltas(context: AIGameContext): number {
    // 現在の実装ではabilitiesの数で近似
    const myDeltas = context.myField.reduce((sum, unit) => sum + unit.abilities.length, 0);
    const oppDeltas = context.opponentField.reduce((sum, unit) => sum + unit.abilities.length, 0);
    return myDeltas + oppDeltas;
  }

  /**
   * 手札のインターセプト枚数をカウント
   */
  private countIntercepts(hand: CompactCard[]): number {
    return hand.filter(card => card.type === 'intercept').length;
  }

  /**
   * 相手フィールドの脅威度を評価
   */
  private evaluateThreats(opponentField: CompactUnit[]): number {
    let threats = 0;

    for (const unit of opponentField) {
      // 基本脅威度
      if (unit.bp >= 7000) threats += 2;
      else if (unit.bp >= 5000) threats += 1;

      // 高脅威キーワードによる追加
      const highThreatCount = unit.abilities.filter(ability =>
        HIGH_THREAT_KEYWORDS.some(keyword => ability.includes(keyword))
      ).length;
      threats += highThreatCount;

      // アクティブなユニットは追加脅威
      if (unit.active) threats += 1;
    }

    return threats;
  }

  /**
   * 複雑性スコアを計算
   */
  private calculateScore(factors: {
    hasNonEntryEffects: boolean;
    deltaCount: number;
    triggerZoneActive: boolean;
    interceptsInHand: number;
    opponentFieldThreats: number;
    myFieldUnitCount: number;
    opponentFieldUnitCount: number;
  }): number {
    let score = 0;

    // 非入場効果
    if (factors.hasNonEntryEffects) score += 3;

    // Delta効果
    score += factors.deltaCount * 1.5;

    // トリガーゾーン
    if (factors.triggerZoneActive) score += 2;

    // インターセプト
    score += factors.interceptsInHand * 1;

    // 相手脅威度
    score += factors.opponentFieldThreats * 1;

    // ユニット数（盤面の複雑さ）
    const totalUnits = factors.myFieldUnitCount + factors.opponentFieldUnitCount;
    if (totalUnits >= 6) score += 2;
    else if (totalUnits >= 4) score += 1;

    return score;
  }

  /**
   * スコアに基づいてモデルを決定
   */
  private determineModel(score: number): LLMModel {
    if (score >= this.config.opusThreshold) {
      return 'opus';
    }
    if (score >= this.config.sonnetThreshold) {
      return 'sonnet';
    }
    return 'haiku';
  }
}

/**
 * ComplexityEvaluatorインスタンスを作成
 */
export function createComplexityEvaluator(
  config?: Partial<ComplexityEvaluatorConfig>
): ComplexityEvaluator {
  return new ComplexityEvaluator(config);
}

/**
 * デフォルトのComplexityEvaluatorインスタンス
 */
export const defaultComplexityEvaluator = new ComplexityEvaluator();

// src/ai/CostOptimizer.ts

import type { LLMClient } from './LLMClient';
import { AI_CONFIG, MODEL_COST } from './constants';

/**
 * モデルタイプ
 */
export type ModelType = 'haiku' | 'sonnet' | 'opus';

/**
 * コスト予算情報
 */
export interface CostBudget {
  /** 予算上限 */
  limit: number;
  /** 使用済み金額 */
  used: number;
  /** 残高 */
  remaining: number;
  /** 警告閾値（0-1、デフォルト0.8） */
  warningThreshold: number;
}

/**
 * モデル推奨結果
 */
export interface ModelRecommendation {
  /** 推奨モデル */
  model: ModelType;
  /** 推奨理由 */
  reason: string;
  /** 推定コスト */
  estimatedCost: number;
}

/**
 * プロンプト圧縮レベル
 */
export type CompressionLevel = 'none' | 'light' | 'aggressive';

/**
 * 複雑度に基づくモデル閾値
 */
const COMPLEXITY_THRESHOLDS = {
  /** Haikuを使う複雑度の上限 */
  HAIKU_MAX: 3,
  /** Sonnetを使う複雑度の上限 */
  SONNET_MAX: 7,
};

/**
 * 予算使用率の閾値
 */
const BUDGET_THRESHOLDS = {
  /** 軽度圧縮を開始する閾値 */
  LIGHT_COMPRESSION: 0.5,
  /** 強力な圧縮を開始する閾値 */
  AGGRESSIVE_COMPRESSION: 0.8,
  /** 分析をスキップする閾値 */
  SKIP_ANALYSIS: 0.8,
  /** Haikuにフォールバックする閾値 */
  FORCE_HAIKU: 0.8,
};

/**
 * 平均的なリクエストのトークン数（推定コスト計算用）
 */
const ESTIMATED_TOKENS = {
  input: 2000,
  output: 500,
};

/**
 * コスト最適化クラス
 *
 * 1ゲームあたりのAPI費用を予算内に収めるための管理を行う
 */
export class CostOptimizer {
  private llmClient: LLMClient;
  private manualUsage: number = 0;
  private readonly warningThreshold: number = 0.8;

  constructor(llmClient: LLMClient) {
    this.llmClient = llmClient;
  }

  /**
   * 現在の予算状況を取得
   */
  getBudget(): CostBudget {
    const limit = AI_CONFIG.COST_LIMIT_PER_GAME;
    const used = this.getTotalUsed();
    const remaining = Math.max(0, limit - used);

    return {
      limit,
      used,
      remaining,
      warningThreshold: this.warningThreshold,
    };
  }

  /**
   * フォールバック（ヒューリスティック）を使うべきかどうか
   */
  shouldUseFallback(): boolean {
    const budget = this.getBudget();
    return budget.remaining <= 0;
  }

  /**
   * 複雑度に基づいてモデルを推奨
   * @param complexity 盤面の複雑度（0-10+）
   */
  recommendModel(complexity: number): ModelRecommendation {
    const usagePercentage = this.getUsagePercentage();

    // 予算が逼迫している場合はHaikuを強制
    if (usagePercentage >= BUDGET_THRESHOLDS.FORCE_HAIKU) {
      return {
        model: 'haiku',
        reason: 'Budget constraint - forcing haiku to conserve budget',
        estimatedCost: this.estimateCost('haiku'),
      };
    }

    // 複雑度に基づいてモデルを選択
    if (complexity <= COMPLEXITY_THRESHOLDS.HAIKU_MAX) {
      return {
        model: 'haiku',
        reason: `Low complexity (${complexity}) - haiku is sufficient`,
        estimatedCost: this.estimateCost('haiku'),
      };
    }

    if (complexity <= COMPLEXITY_THRESHOLDS.SONNET_MAX) {
      return {
        model: 'sonnet',
        reason: `Medium complexity (${complexity}) - using sonnet`,
        estimatedCost: this.estimateCost('sonnet'),
      };
    }

    return {
      model: 'opus',
      reason: `High complexity (${complexity}) - using opus for best results`,
      estimatedCost: this.estimateCost('opus'),
    };
  }

  /**
   * 使用量を手動で記録
   * @param cost コスト（ドル）
   */
  recordUsage(cost: number): void {
    this.manualUsage += cost;
  }

  /**
   * 手動記録をリセット
   */
  reset(): void {
    this.manualUsage = 0;
  }

  /**
   * 定期分析をスキップすべきかどうか
   */
  shouldSkipAnalysis(): boolean {
    return this.getUsagePercentage() >= BUDGET_THRESHOLDS.SKIP_ANALYSIS;
  }

  /**
   * プロンプト圧縮レベルを取得
   */
  getPromptCompressionLevel(): CompressionLevel {
    const usage = this.getUsagePercentage();

    if (usage >= BUDGET_THRESHOLDS.AGGRESSIVE_COMPRESSION) {
      return 'aggressive';
    }

    if (usage >= BUDGET_THRESHOLDS.LIGHT_COMPRESSION) {
      return 'light';
    }

    return 'none';
  }

  /**
   * 警告レベルに達しているかどうか
   */
  isWarningLevel(): boolean {
    return this.getUsagePercentage() >= this.warningThreshold;
  }

  /**
   * 使用率を取得（0-1）
   */
  getUsagePercentage(): number {
    const budget = AI_CONFIG.COST_LIMIT_PER_GAME;
    const used = this.getTotalUsed();
    return Math.min(1, used / budget);
  }

  /**
   * 合計使用量を取得
   */
  private getTotalUsed(): number {
    return this.llmClient.getTotalCost() + this.manualUsage;
  }

  /**
   * モデルの推定コストを計算
   */
  private estimateCost(model: ModelType): number {
    const rates = MODEL_COST[model];
    const inputCost = (ESTIMATED_TOKENS.input / 1_000_000) * rates.input;
    const outputCost = (ESTIMATED_TOKENS.output / 1_000_000) * rates.output;
    return inputCost + outputCost;
  }
}

// src/ai/constants.ts

/**
 * AI全般の設定
 */
export const AI_CONFIG = {
  /** 1ゲームあたりのAPI cost制限（ドル） */
  COST_LIMIT_PER_GAME: 2.0,
  /** Opus使用判断の複雑性閾値 */
  COMPLEXITY_THRESHOLD: 5,
  /** 定期分析を行うラウンド間隔 */
  PERIODIC_ANALYSIS_ROUNDS: 2,
} as const;

/**
 * Claude モデルID
 */
export const MODEL_CONFIG = {
  /** Claude 3 Haiku - 高速・低コスト */
  HAIKU: 'claude-3-haiku-20240307',
  /** Claude 3.5 Sonnet - バランス型 */
  SONNET: 'claude-3-5-sonnet-20241022',
  /** Claude 3 Opus - 高精度 */
  OPUS: 'claude-3-opus-20240229',
} as const;

/**
 * タイムアウト設定（ミリ秒）
 */
export const TIMEOUT_CONFIG = {
  /** 通常操作のタイムアウト */
  NORMAL_OPERATION: 5000,
  /** 選択肢応答のタイムアウト */
  CHOICE_RESPONSE: 8000,
  /** マリガン判断のタイムアウト */
  MULLIGAN: 8000,
  /** フォールバック警告表示までの時間 */
  FALLBACK_WARNING: 1000,
} as const;

/**
 * モデル別のコスト（1Kトークンあたりのドル）
 */
export const MODEL_COST = {
  haiku: {
    input: 0.00025,
    output: 0.00125,
  },
  sonnet: {
    input: 0.003,
    output: 0.015,
  },
  opus: {
    input: 0.015,
    output: 0.075,
  },
} as const;

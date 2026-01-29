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
  /** Claude 3.5 Haiku - 高速・低コスト */
  HAIKU: 'claude-3-5-haiku-20241022',
  /** Claude 4 Sonnet - バランス型 */
  SONNET: 'claude-sonnet-4-20250514',
  /** Claude 4.5 Opus - 高精度 */
  OPUS: 'claude-opus-4-5-20251101',
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
 * モデル別のコスト（1Mトークンあたりのドル）
 */
export const MODEL_COST = {
  haiku: {
    input: 0.8,
    output: 4.0,
  },
  sonnet: {
    input: 3.0,
    output: 15.0,
  },
  opus: {
    input: 15.0,
    output: 75.0,
  },
} as const;

/**
 * コンテキストウィンドウ管理の設定
 */
export const CONTEXT_CONFIG = {
  /** デフォルト最大トークン数 */
  DEFAULT_MAX_TOKENS: 4096,
  /** デフォルト最大ターン数 */
  DEFAULT_MAX_TURNS: 20,
  /** 要約を開始するターン数 */
  SUMMARIZE_AFTER_TURNS: 10,
  /** 詳細を保持するターン数 */
  KEEP_DETAILED_TURNS: 5,
  /** イベント要約の最大文字数 */
  MAX_EVENT_SUMMARY_LENGTH: 500,
} as const;

/**
 * 世代管理の設定
 */
export const GENERATION_CONFIG = {
  /** board_state の陳腐化ラウンド数 */
  BOARD_STATE_STALE_ROUNDS: 1,
  /** strategy の陳腐化ラウンド数 */
  STRATEGY_STALE_ROUNDS: 2,
  /** opponent_pattern の陳腐化ラウンド数 */
  OPPONENT_PATTERN_STALE_ROUNDS: 3,
  /** deck_analysis の陳腐化ラウンド数 */
  DECK_ANALYSIS_STALE_ROUNDS: 10,
  /** デフォルトの陳腐化閾値 */
  DEFAULT_STALENESS_THRESHOLD: 0.7,
} as const;

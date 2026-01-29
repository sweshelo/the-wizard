// src/ai/types.ts

/**
 * AIが処理するゲームコンテキスト
 * LLMに渡しやすい簡潔な形式
 */
export interface AIGameContext {
  /** 現在のターン番号 */
  turn: number;
  /** 現在のラウンド番号 */
  round: number;
  /** 自分のターンかどうか */
  isMyTurn: boolean;
  /** 自プレイヤーのリソース情報 */
  self: PlayerResources;
  /** 相手プレイヤーのリソース情報 */
  opponent: PlayerResources;
  /** 自フィールドのユニット */
  myField: CompactUnit[];
  /** 相手フィールドのユニット */
  opponentField: CompactUnit[];
  /** 自分の手札 */
  myHand: CompactCard[];
  /** 自分のトリガーゾーン */
  myTrigger: CompactCard[];
  /** 直近のイベント履歴 */
  recentEvents: string[];
}

/**
 * プレイヤーのリソース情報
 */
export interface PlayerResources {
  /** 現在のライフ */
  life: number;
  /** CP (Current/Max) */
  cp: { current: number; max: number };
  /** ジョーカーゲージ */
  jokerGauge: number;
  /** 手札枚数 */
  handCount: number;
  /** デッキ残り枚数 */
  deckCount: number;
}

/**
 * 簡潔なユニット情報（LLM向け）
 */
export interface CompactUnit {
  /** 短縮ID (u1, u2, ...) */
  id: string;
  /** ユニット名 */
  name: string;
  /** カタログID */
  catalogId: string;
  /** 現在のBP */
  bp: number;
  /** 基本BP */
  baseBp: number;
  /** コスト */
  cost: number;
  /** アクティブ状態か */
  active: boolean;
  /** 所持能力名リスト */
  abilities: string[];
  /** ブート起動可能か */
  canBoot: boolean;
}

/**
 * 簡潔なカード情報（LLM向け）
 */
export interface CompactCard {
  /** 短縮ID (c1, c2, ...) */
  id: string;
  /** カード名 */
  name: string;
  /** カタログID */
  catalogId: string;
  /** コスト */
  cost: number;
  /** カードタイプ */
  type: 'unit' | 'trigger' | 'intercept' | 'advanced_unit' | 'virus' | 'joker';
  /** 現在のCPでプレイ可能か */
  playable: boolean;
}

/**
 * AIのアクション種別
 */
export type AIActionType =
  | 'UnitDrive' // ユニット召喚
  | 'AttackWithUnit' // ユニットで攻撃
  | 'Block' // ブロック
  | 'UseIntercept' // インターセプト使用
  | 'UseTrigger' // トリガー使用
  | 'UseJoker' // ジョーカー使用
  | 'TurnEnd' // ターン終了
  | 'Skip'; // スキップ（選択肢でキャンセル）

/**
 * AIの決定結果
 */
export interface AIDecision {
  /** アクション種別 */
  action: AIActionType;
  /** ターゲットID（短縮ID） */
  targetId?: string;
  /** 追加パラメータ */
  params?: Record<string, unknown>;
  /** 推論理由 */
  reason: string;
}

/**
 * マリガン判断結果
 */
export interface MulliganDecision {
  /** マリガンするかどうか */
  shouldMulligan: boolean;
  /** 判断理由 */
  reason: string;
}

/**
 * 選択肢応答結果
 */
export interface ChoiceResponse {
  /** 選択したID（短縮ID） */
  selectedIds: string[];
  /** 選択理由 */
  reason: string;
}

/**
 * LLMモデル種別
 */
export type LLMModel = 'haiku' | 'sonnet' | 'opus';

/**
 * AIの状態
 */
export interface AIState {
  /** AI機能が有効か */
  enabled: boolean;
  /** 現在のゲームで使用したAPI cost */
  usedCost: number;
  /** 現在使用中のモデル */
  currentModel: LLMModel;
}

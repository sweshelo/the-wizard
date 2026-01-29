// src/ai/chat/types.ts

import type { LLMModel } from '../types';

/**
 * メッセージカテゴリ
 */
export type MessageCategory =
  | 'pregame_analysis'
  | 'periodic_analysis'
  | 'turn_decision'
  | 'choice_response'
  | 'strategy_update'
  | 'feedback_request'
  | 'user_response'
  | 'game_event'
  | 'knowledge_learned'
  | 'system';

/**
 * メッセージ優先度
 */
export type MessagePriority = 'high' | 'medium' | 'low';

/**
 * コンテンツ詳細の型
 */
export type ContentDetailType = 'text' | 'card' | 'unit' | 'keyword' | 'warning';

/**
 * コンテンツ詳細
 */
export interface ContentDetail {
  label: string;
  value: string;
  type: ContentDetailType;
}

/**
 * メッセージ内容
 */
export interface MessageContent {
  title: string;
  body: string;
  details?: ContentDetail[];
}

/**
 * インタラクションオプション
 */
export interface InteractionOption {
  id: string;
  label: string;
  description?: string;
}

/**
 * メッセージインタラクション
 */
export interface MessageInteraction {
  type: 'confirm' | 'choice' | 'rating' | 'none';
  options?: InteractionOption[];
  selected?: string;
  feedback?: string;
}

/**
 * AIチャットメッセージ
 */
export interface AIChatMessage {
  id: string;
  timestamp: Date;
  category: MessageCategory;
  priority: MessagePriority;
  content: MessageContent;
  meta: {
    model: LLMModel;
    tokenUsed?: number;
    latencyMs?: number;
    gameState?: {
      turn: number;
      round: number;
    };
  };
  interaction?: MessageInteraction;
}

/**
 * ユーザーフィードバック
 */
export interface UserFeedback {
  messageId: string;
  interactionType: 'confirm' | 'choice' | 'rating' | 'text';
  response: {
    selected?: string;
    rating?: number;
    text?: string;
  };
  timestamp: Date;
}

/**
 * チャット表示設定
 */
export interface AIChatSettings {
  position: 'bottom' | 'right' | 'floating';
  height: 'compact' | 'normal' | 'expanded';
  detailLevel: 'full' | 'summary';
  showModelBadge: boolean;
  autoScroll: boolean;
  isVisible: boolean;
  showGameEvents: boolean;
}

/**
 * デフォルト設定
 */
export const DEFAULT_CHAT_SETTINGS: AIChatSettings = {
  position: 'bottom',
  height: 'normal',
  detailLevel: 'summary',
  showModelBadge: true,
  autoScroll: true,
  isVisible: true,
  showGameEvents: true,
};

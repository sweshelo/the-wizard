// src/ai/chat/store.ts

import { create } from 'zustand';
import type {
  AIChatMessage,
  AIChatSettings,
  UserFeedback,
  MessageCategory,
  MessagePriority,
  MessageContent,
} from './types';
import { DEFAULT_CHAT_SETTINGS } from './types';
import type { LLMModel } from '../types';

/**
 * AIチャットストアの状態
 */
interface AIChatState {
  /** メッセージ履歴 */
  messages: AIChatMessage[];
  /** 表示設定 */
  settings: AIChatSettings;
  /** 未読数 */
  unreadCount: number;
  /** 最終既読時刻 */
  lastReadTimestamp: Date | null;
}

/**
 * AIチャットストアのアクション
 */
interface AIChatActions {
  /** メッセージを追加 */
  addMessage: (message: AIChatMessage) => void;
  /** メッセージを更新 */
  updateMessage: (id: string, update: Partial<AIChatMessage>) => void;
  /** フィードバックを送信 */
  submitFeedback: (feedback: UserFeedback) => void;
  /** メッセージをクリア */
  clearMessages: () => void;
  /** 設定を更新 */
  updateSettings: (settings: Partial<AIChatSettings>) => void;
  /** 既読にする */
  markAsRead: () => void;
  /** 表示/非表示切り替え */
  toggleVisibility: () => void;
}

/**
 * AIチャットストア
 */
export const useAIChatStore = create<AIChatState & AIChatActions>((set, get) => ({
  // 初期状態
  messages: [],
  settings: DEFAULT_CHAT_SETTINGS,
  unreadCount: 0,
  lastReadTimestamp: null,

  // アクション
  addMessage: message => {
    set(state => ({
      messages: [...state.messages, message],
      unreadCount: state.settings.isVisible ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  updateMessage: (id, update) => {
    set(state => ({
      messages: state.messages.map(msg => (msg.id === id ? { ...msg, ...update } : msg)),
    }));
  },

  submitFeedback: feedback => {
    set(state => ({
      messages: state.messages.map(msg =>
        msg.id === feedback.messageId
          ? {
              ...msg,
              interaction: msg.interaction
                ? {
                    ...msg.interaction,
                    selected: feedback.response.selected,
                    feedback: feedback.response.text,
                  }
                : undefined,
            }
          : msg
      ),
    }));
  },

  clearMessages: () => {
    set({ messages: [], unreadCount: 0 });
  },

  updateSettings: settings => {
    set(state => ({
      settings: { ...state.settings, ...settings },
    }));
  },

  markAsRead: () => {
    set({ unreadCount: 0, lastReadTimestamp: new Date() });
  },

  toggleVisibility: () => {
    const currentVisible = get().settings.isVisible;
    set(state => ({
      settings: { ...state.settings, isVisible: !currentVisible },
      unreadCount: !currentVisible ? 0 : state.unreadCount,
    }));
  },
}));

/**
 * メッセージIDを生成
 */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * メッセージを作成するヘルパー
 */
export function createMessage(
  category: MessageCategory,
  content: MessageContent,
  options: {
    priority?: MessagePriority;
    model?: LLMModel;
    tokenUsed?: number;
    latencyMs?: number;
    gameState?: { turn: number; round: number };
  } = {}
): AIChatMessage {
  return {
    id: generateMessageId(),
    timestamp: new Date(),
    category,
    priority: options.priority ?? 'medium',
    content,
    meta: {
      model: options.model ?? 'sonnet',
      tokenUsed: options.tokenUsed,
      latencyMs: options.latencyMs,
      gameState: options.gameState,
    },
  };
}

/**
 * ターン決定メッセージを作成
 */
export function createTurnDecisionMessage(
  title: string,
  body: string,
  details: MessageContent['details'],
  options: {
    model?: LLMModel;
    tokenUsed?: number;
    latencyMs?: number;
    turn: number;
    round: number;
  }
): AIChatMessage {
  return createMessage(
    'turn_decision',
    { title, body, details },
    {
      model: options.model,
      tokenUsed: options.tokenUsed,
      latencyMs: options.latencyMs,
      gameState: { turn: options.turn, round: options.round },
    }
  );
}

/**
 * システムメッセージを作成
 */
export function createSystemMessage(title: string, body: string): AIChatMessage {
  return createMessage('system', { title, body }, { priority: 'low', model: 'haiku' });
}

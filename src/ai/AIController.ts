// src/ai/AIController.ts

import type { Message } from '@/submodule/suit/types';
import type { AIGameContext, AIDecision, MulliganDecision, ChoiceResponse } from './types';
import { TIMEOUT_CONFIG } from './constants';

/**
 * AIControllerの設定
 */
export interface AIControllerConfig {
  /** AI機能が有効か */
  enabled: boolean;
  /** 自プレイヤーID */
  playerId: string;
}

/**
 * AIが処理するイベントタイプ
 */
export type AIEventType =
  | 'mulligan' // マリガン判断
  | 'turn_action' // ターン中のアクション決定
  | 'choice_option' // オプション選択
  | 'choice_card' // カード選択
  | 'choice_unit' // ユニット選択
  | 'choice_block' // ブロッカー選択
  | 'choice_intercept' // インターセプト選択
  | 'continue'; // 効果表示後の続行

/**
 * AIイベントのペイロード
 */
export interface AIEvent {
  type: AIEventType;
  promptId?: string;
  context: AIGameContext;
  choices?: {
    type: string;
    items: unknown[];
    title?: string;
    count?: number;
    isCancelable?: boolean;
  };
}

/**
 * AIレスポンスコールバック
 */
export type AIResponseCallback = (response: AIControllerResponse) => void;

/**
 * AIControllerのレスポンス
 */
export interface AIControllerResponse {
  type: 'mulligan' | 'action' | 'choice' | 'continue';
  decision?: AIDecision;
  mulligan?: MulliganDecision;
  choice?: ChoiceResponse;
}

/**
 * AIモード状態
 */
interface AIControllerState {
  enabled: boolean;
  playerId: string;
  isFrozen: boolean;
  pendingEvents: AIEvent[];
  currentGameContext: AIGameContext | null;
}

/**
 * AIController - WebSocketメッセージをインターセプトしAIモジュールにルーティング
 */
export class AIController {
  private state: AIControllerState;
  private decisionHandler: ((event: AIEvent) => Promise<AIControllerResponse>) | null = null;
  private timeoutIds: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: AIControllerConfig) {
    this.state = {
      enabled: config.enabled,
      playerId: config.playerId,
      isFrozen: false,
      pendingEvents: [],
      currentGameContext: null,
    };
  }

  /**
   * AI機能を有効化
   */
  enable(): void {
    this.state.enabled = true;
  }

  /**
   * AI機能を無効化
   */
  disable(): void {
    this.state.enabled = false;
    this.clearAllTimeouts();
  }

  /**
   * AI機能が有効かどうか
   */
  isEnabled(): boolean {
    return this.state.enabled;
  }

  /**
   * 現在のプレイヤーIDを取得
   */
  getPlayerId(): string {
    return this.state.playerId;
  }

  /**
   * プレイヤーIDを設定
   */
  setPlayerId(playerId: string): void {
    this.state.playerId = playerId;
  }

  /**
   * 決定ハンドラーを設定
   */
  setDecisionHandler(handler: (event: AIEvent) => Promise<AIControllerResponse>): void {
    this.decisionHandler = handler;
  }

  /**
   * ゲームコンテキストを更新
   */
  updateGameContext(context: AIGameContext): void {
    this.state.currentGameContext = context;
  }

  /**
   * 現在のゲームコンテキストを取得
   */
  getGameContext(): AIGameContext | null {
    return this.state.currentGameContext;
  }

  /**
   * WebSocketメッセージを処理
   * @returns true = AIが処理、false = 通常処理に委譲
   */
  async handleMessage(message: Message): Promise<boolean> {
    if (!this.state.enabled) {
      return false;
    }

    const { payload } = message;

    // Operation メッセージの処理
    if (payload.type === 'Operation') {
      this.handleOperation(payload as unknown as Record<string, unknown>);
      return false; // Operation自体は通常処理も必要
    }

    // AIが処理すべきメッセージかチェック
    const aiEvent = this.extractAIEvent(payload as unknown as Record<string, unknown>);
    if (!aiEvent) {
      return false;
    }

    // freeze中はイベントをバッファに蓄積
    if (this.state.isFrozen) {
      this.state.pendingEvents.push(aiEvent);
      // イベントは蓄積するが、通常処理にも委譲
      return false;
    }

    // 自分宛のメッセージかチェック
    if ('player' in payload && payload.player !== this.state.playerId) {
      return false;
    }

    // AIによる判断を実行
    await this.processAIEvent(aiEvent);
    return true;
  }

  /**
   * Operationメッセージを処理
   */
  private handleOperation(
    payload: Record<string, unknown> & { action?: string; type?: string }
  ): void {
    const action = payload.action ?? payload.type;
    if (action === 'freeze') {
      this.state.isFrozen = true;
    } else if (action === 'defrost') {
      this.state.isFrozen = false;
      // バッファされたイベントをフラッシュ（非同期で処理）
      void this.flushPendingEvents();
    }
  }

  /**
   * ゲームイベントかどうかを判定
   */
  private isGameEvent(payload: Record<string, unknown>): boolean {
    const eventTypes = ['DisplayEffect', 'VisualEffect', 'SoundEffect'];
    return eventTypes.includes(payload.type as string);
  }

  /**
   * メッセージからAIイベントを抽出
   */
  private extractAIEvent(payload: Record<string, unknown>): AIEvent | null {
    if (!this.state.currentGameContext) {
      return null;
    }

    const context = this.state.currentGameContext;

    switch (payload.type) {
      case 'MulliganStart':
        return {
          type: 'mulligan',
          context,
        };

      case 'Choices': {
        const choices = payload.choices as {
          type: string;
          items: unknown[];
          title?: string;
          count?: number;
          isCancelable?: boolean;
        };
        const promptId = payload.promptId as string | undefined;

        const eventType = this.mapChoiceType(choices.type);
        if (!eventType) return null;

        return {
          type: eventType,
          promptId,
          context,
          choices,
        };
      }

      case 'DisplayEffect':
        return {
          type: 'continue',
          promptId: payload.promptId as string | undefined,
          context,
        };

      default:
        return null;
    }
  }

  /**
   * 選択肢タイプをAIイベントタイプにマッピング
   */
  private mapChoiceType(choiceType: string): AIEventType | null {
    const mapping: Record<string, AIEventType> = {
      option: 'choice_option',
      card: 'choice_card',
      unit: 'choice_unit',
      block: 'choice_block',
      intercept: 'choice_intercept',
    };
    return mapping[choiceType] ?? null;
  }

  /**
   * AIイベントを処理
   */
  private async processAIEvent(event: AIEvent): Promise<void> {
    if (!this.decisionHandler) {
      console.warn('[AIController] No decision handler set');
      return;
    }

    // 一意のタイムアウトキーを生成（同一タイプの複数イベントに対応）
    const timeoutKey = this.generateTimeoutKey(event);

    // タイムアウトを設定
    const timeoutMs = this.getTimeoutForEvent(event);
    const timeoutPromise = this.createTimeout(timeoutKey, timeoutMs);

    try {
      // 決定ハンドラーを呼び出し（タイムアウト付き）
      const response = await Promise.race([this.decisionHandler(event), timeoutPromise]);

      // タイムアウトをクリア
      this.clearTimeout(timeoutKey);

      // レスポンスを処理（実際のWebSocket送信は上位層で行う）
      console.log('[AIController] Decision made:', response);
    } catch (error) {
      console.error('[AIController] Decision error:', error);
      // タイムアウトをクリア
      this.clearTimeout(timeoutKey);
    }
  }

  /**
   * イベントからユニークなタイムアウトキーを生成
   */
  private generateTimeoutKey(event: AIEvent): string {
    const uniqueId = event.promptId ?? Date.now().toString();
    return `${event.type}:${uniqueId}`;
  }

  /**
   * イベントタイプに応じたタイムアウト時間を取得
   */
  private getTimeoutForEvent(event: AIEvent): number {
    switch (event.type) {
      case 'mulligan':
        return TIMEOUT_CONFIG.MULLIGAN;
      case 'choice_option':
      case 'choice_card':
      case 'choice_unit':
      case 'choice_block':
      case 'choice_intercept':
        return TIMEOUT_CONFIG.CHOICE_RESPONSE;
      default:
        return TIMEOUT_CONFIG.NORMAL_OPERATION;
    }
  }

  /**
   * タイムアウトPromiseを作成
   */
  private createTimeout(timeoutKey: string, timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`AI decision timeout for ${timeoutKey}`));
      }, timeoutMs);
      this.timeoutIds.set(timeoutKey, timeoutId);
    });
  }

  /**
   * タイムアウトをクリア
   */
  private clearTimeout(timeoutKey: string): void {
    const timeoutId = this.timeoutIds.get(timeoutKey);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeoutIds.delete(timeoutKey);
    }
  }

  /**
   * 全タイムアウトをクリア
   */
  private clearAllTimeouts(): void {
    for (const timeoutId of this.timeoutIds.values()) {
      clearTimeout(timeoutId);
    }
    this.timeoutIds.clear();
  }

  /**
   * バッファされたイベントをフラッシュして順次処理
   */
  private async flushPendingEvents(): Promise<void> {
    const events = [...this.state.pendingEvents];
    this.state.pendingEvents = [];
    console.log('[AIController] Flushing', events.length, 'pending events');

    // バッファされたイベントを順次処理
    for (const event of events) {
      await this.processAIEvent(event);
    }
  }

  /**
   * リセット
   */
  reset(): void {
    this.clearAllTimeouts();
    this.state.isFrozen = false;
    this.state.pendingEvents = [];
    this.state.currentGameContext = null;
  }
}

/**
 * AIControllerインスタンスを作成
 */
export function createAIController(config: AIControllerConfig): AIController {
  return new AIController(config);
}

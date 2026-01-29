// src/ai/context/GenerationManager.ts

import { GENERATION_CONFIG } from '../constants';

/**
 * 情報のカテゴリ
 */
export type InfoCategory =
  | 'board_state' // 盤面状態
  | 'strategy' // 戦略分析
  | 'opponent_pattern' // 相手の行動パターン
  | 'deck_analysis'; // デッキ分析

/**
 * 世代管理される情報
 */
export interface GenerationalInfo {
  /** 一意のID */
  id: string;
  /** 情報の内容 */
  content: string;
  /** 世代番号 */
  generation: number;
  /** 作成日時 */
  createdAt: Date;
  /** 最終アクセス日時 */
  lastAccessedAt: Date;
  /** 作成時のゲームラウンド */
  gameRound: number;
  /** 情報のカテゴリ */
  category: InfoCategory;
}

/**
 * 陳腐化した情報
 */
export interface StaleInfo {
  /** 情報 */
  info: GenerationalInfo;
  /** 陳腐化度合い (0-1) */
  staleness: number;
  /** 陳腐化の理由 */
  reason: string;
}

/**
 * 情報登録時の入力
 */
export interface RegisterInput {
  /** 情報の内容 */
  content: string;
  /** 情報のカテゴリ */
  category: InfoCategory;
  /** 作成時のゲームラウンド */
  gameRound: number;
}

/**
 * 世代管理マネージャー
 * ゲーム中の情報の陳腐化を追跡し、更新が必要なタイミングを検出する
 */
export class GenerationManager {
  private infoMap: Map<string, GenerationalInfo> = new Map();
  private currentGeneration: number = 1;
  private currentRound: number = 1;
  private idCounter: number = 0;

  /**
   * カテゴリごとの陳腐化ラウンド数を取得
   */
  private getStaleRoundsForCategory(category: InfoCategory): number {
    switch (category) {
      case 'board_state':
        return GENERATION_CONFIG.BOARD_STATE_STALE_ROUNDS;
      case 'strategy':
        return GENERATION_CONFIG.STRATEGY_STALE_ROUNDS;
      case 'opponent_pattern':
        return GENERATION_CONFIG.OPPONENT_PATTERN_STALE_ROUNDS;
      case 'deck_analysis':
        return GENERATION_CONFIG.DECK_ANALYSIS_STALE_ROUNDS;
    }
  }

  /**
   * 情報を登録し世代番号を付与
   */
  register(input: RegisterInput): GenerationalInfo {
    const id = this.generateId();
    const now = new Date();

    const info: GenerationalInfo = {
      id,
      content: input.content,
      generation: this.currentGeneration,
      createdAt: now,
      lastAccessedAt: now,
      gameRound: input.gameRound,
      category: input.category,
    };

    this.infoMap.set(id, info);
    return info;
  }

  /**
   * 特定情報の陳腐化度を計算
   * @returns 0-1の陳腐化度、-1は存在しないID
   */
  checkStaleness(id: string): number {
    const info = this.infoMap.get(id);
    if (!info) {
      return -1;
    }

    const roundsDiff = this.currentRound - info.gameRound;
    const staleRounds = this.getStaleRoundsForCategory(info.category);

    if (roundsDiff <= 0) {
      return 0;
    }

    // 陳腐化度を計算 (0-1に正規化)
    const staleness = Math.min(roundsDiff / staleRounds, 1);
    return staleness;
  }

  /**
   * 陳腐化した情報を検索
   * @param threshold 陳腐化閾値 (デフォルト: DEFAULT_STALENESS_THRESHOLD)
   */
  findStaleEntries(threshold?: number): StaleInfo[] {
    const effectiveThreshold = threshold ?? GENERATION_CONFIG.DEFAULT_STALENESS_THRESHOLD;
    const staleEntries: StaleInfo[] = [];

    for (const info of this.infoMap.values()) {
      const staleness = this.checkStaleness(info.id);
      if (staleness > effectiveThreshold) {
        staleEntries.push({
          info,
          staleness,
          reason: this.buildStaleReason(info, staleness),
        });
      }
    }

    // 陳腐化度の高い順にソート
    staleEntries.sort((a, b) => b.staleness - a.staleness);

    return staleEntries;
  }

  /**
   * 更新が必要な情報のリストを取得
   */
  getUpdateTriggers(): StaleInfo[] {
    return this.findStaleEntries();
  }

  /**
   * 世代を進める（新ラウンド開始時に呼び出し）
   */
  incrementGeneration(): void {
    this.currentGeneration++;
  }

  /**
   * 情報へのアクセスを記録
   */
  markAsAccessed(id: string): boolean {
    const info = this.infoMap.get(id);
    if (!info) {
      return false;
    }

    info.lastAccessedAt = new Date();
    return true;
  }

  /**
   * IDで情報を取得
   */
  getInfo(id: string): GenerationalInfo | undefined {
    return this.infoMap.get(id);
  }

  /**
   * 現在のラウンドを設定
   */
  setCurrentRound(round: number): void {
    this.currentRound = round;
  }

  /**
   * 現在のラウンドを取得
   */
  getCurrentRound(): number {
    return this.currentRound;
  }

  /**
   * 現在の世代を取得
   */
  getCurrentGeneration(): number {
    return this.currentGeneration;
  }

  /**
   * すべての情報をクリア
   */
  clear(): void {
    this.infoMap.clear();
  }

  /**
   * カテゴリで情報をフィルタリング
   */
  getInfoByCategory(category: InfoCategory): GenerationalInfo[] {
    const results: GenerationalInfo[] = [];
    for (const info of this.infoMap.values()) {
      if (info.category === category) {
        results.push(info);
      }
    }
    return results;
  }

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    this.idCounter++;
    return `gen-${Date.now()}-${this.idCounter}`;
  }

  /**
   * 陳腐化の理由を構築
   */
  private buildStaleReason(info: GenerationalInfo, staleness: number): string {
    const roundsDiff = this.currentRound - info.gameRound;
    const staleRounds = this.getStaleRoundsForCategory(info.category);

    if (staleness >= 1) {
      return `${info.category}は${staleRounds}ラウンドで陳腐化（${roundsDiff}ラウンド経過）`;
    }

    return `${info.category}が${Math.round(staleness * 100)}%陳腐化（${roundsDiff}ラウンド経過）`;
  }
}

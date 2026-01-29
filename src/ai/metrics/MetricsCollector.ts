// src/ai/metrics/MetricsCollector.ts

import { AI_CONFIG } from '../constants';

/**
 * モデルタイプ
 */
export type ModelType = 'haiku' | 'sonnet' | 'opus';

/**
 * 決定メトリクス
 */
export interface DecisionMetric {
  /** ターン番号 */
  turn: number;
  /** 決定タイプ */
  type: string;
  /** 使用モデル */
  model: ModelType;
  /** レイテンシ（ms） */
  latencyMs: number;
  /** トークン数 */
  tokens: {
    input: number;
    output: number;
  };
  /** コスト（USD） */
  cost: number;
  /** フォールバック使用 */
  usedFallback: boolean;
}

/**
 * ゲームメトリクス
 */
export interface GameMetrics {
  /** ゲームID */
  gameId: string;
  /** 開始時刻 */
  startTime: Date;
  /** 終了時刻 */
  endTime?: Date;
  /** 合計コスト */
  totalCost: number;
  /** リクエスト数 */
  requestCount: number;
  /** 平均レイテンシ */
  averageLatency: number;
  /** タイムアウト数 */
  timeoutCount: number;
  /** モデル使用回数 */
  modelUsage: Record<ModelType, number>;
  /** 決定履歴 */
  decisions: DecisionMetric[];
}

/**
 * 集計メトリクス
 */
export interface AggregateMetrics {
  /** 合計ゲーム数 */
  totalGames: number;
  /** ゲームあたり平均コスト */
  averageCostPerGame: number;
  /** 平均レイテンシ */
  averageLatency: number;
  /** タイムアウト率 */
  timeoutRate: number;
  /** モデル使用分布 */
  modelDistribution: Record<ModelType, number>;
}

/**
 * アラート
 */
export interface Alert {
  /** アラートタイプ */
  type: 'cost' | 'timeout' | 'latency';
  /** メッセージ */
  message: string;
  /** 重要度 */
  severity: 'warning' | 'error';
  /** 値 */
  value: number;
  /** 閾値 */
  threshold: number;
}

/**
 * 内部ゲーム状態
 */
interface InternalGame {
  gameId: string;
  startTime: Date;
  endTime?: Date;
  decisions: DecisionMetric[];
}

/**
 * メトリクス収集クラス
 */
export class MetricsCollector {
  private games: Map<string, InternalGame> = new Map();
  private completedGames: InternalGame[] = [];
  private idCounter: number = 0;

  /**
   * ゲームを開始
   */
  startGame(): string {
    const gameId = this.generateId();
    this.games.set(gameId, {
      gameId,
      startTime: new Date(),
      decisions: [],
    });
    return gameId;
  }

  /**
   * ゲームを終了
   */
  endGame(gameId: string): void {
    const game = this.games.get(gameId);
    if (game) {
      game.endTime = new Date();
      this.completedGames.push(game);
      this.games.delete(gameId);
    }
  }

  /**
   * 決定を記録
   */
  recordDecision(gameId: string, metric: DecisionMetric): void {
    const game = this.games.get(gameId);
    if (game) {
      game.decisions.push(metric);
    }
  }

  /**
   * ゲームメトリクスを取得
   */
  getGameMetrics(gameId: string): GameMetrics | null {
    const game = this.games.get(gameId) ?? this.completedGames.find(g => g.gameId === gameId);
    if (!game) {
      return null;
    }
    return this.buildGameMetrics(game);
  }

  /**
   * 集計メトリクスを取得
   */
  getAggregateMetrics(): AggregateMetrics {
    const allGames = [...this.completedGames, ...Array.from(this.games.values())];

    if (allGames.length === 0) {
      return {
        totalGames: 0,
        averageCostPerGame: 0,
        averageLatency: 0,
        timeoutRate: 0,
        modelDistribution: { haiku: 0, sonnet: 0, opus: 0 },
      };
    }

    const gameMetrics = allGames.map(g => this.buildGameMetrics(g));

    const totalCost = gameMetrics.reduce((sum, g) => sum + g.totalCost, 0);
    const totalLatency = gameMetrics.reduce((sum, g) => sum + g.averageLatency * g.requestCount, 0);
    const totalRequests = gameMetrics.reduce((sum, g) => sum + g.requestCount, 0);
    const totalTimeouts = gameMetrics.reduce((sum, g) => sum + g.timeoutCount, 0);

    const modelDistribution: Record<ModelType, number> = { haiku: 0, sonnet: 0, opus: 0 };
    for (const metrics of gameMetrics) {
      modelDistribution.haiku += metrics.modelUsage.haiku;
      modelDistribution.sonnet += metrics.modelUsage.sonnet;
      modelDistribution.opus += metrics.modelUsage.opus;
    }

    return {
      totalGames: allGames.length,
      averageCostPerGame: totalCost / allGames.length,
      averageLatency: totalRequests > 0 ? totalLatency / totalRequests : 0,
      timeoutRate: totalRequests > 0 ? totalTimeouts / totalRequests : 0,
      modelDistribution,
    };
  }

  /**
   * アラートを取得
   */
  getAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const aggregate = this.getAggregateMetrics();

    // コスト超過アラート
    if (aggregate.averageCostPerGame > AI_CONFIG.COST_LIMIT_PER_GAME) {
      alerts.push({
        type: 'cost',
        message: `Average cost per game ($${aggregate.averageCostPerGame.toFixed(2)}) exceeds limit ($${AI_CONFIG.COST_LIMIT_PER_GAME})`,
        severity: 'error',
        value: aggregate.averageCostPerGame,
        threshold: AI_CONFIG.COST_LIMIT_PER_GAME,
      });
    }

    // タイムアウト率アラート
    const timeoutThreshold = 0.01; // 1%
    if (aggregate.timeoutRate > timeoutThreshold) {
      alerts.push({
        type: 'timeout',
        message: `Timeout rate (${(aggregate.timeoutRate * 100).toFixed(1)}%) exceeds threshold (${timeoutThreshold * 100}%)`,
        severity: aggregate.timeoutRate > 0.05 ? 'error' : 'warning',
        value: aggregate.timeoutRate,
        threshold: timeoutThreshold,
      });
    }

    return alerts;
  }

  /**
   * JSONエクスポート
   */
  exportJSON(): string {
    const allGames = [...this.completedGames, ...Array.from(this.games.values())];
    const gameMetrics = allGames.map(g => this.buildGameMetrics(g));

    return JSON.stringify(
      {
        games: gameMetrics,
        aggregate: this.getAggregateMetrics(),
        alerts: this.getAlerts(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }

  /**
   * データをクリア
   */
  clear(): void {
    this.games.clear();
    this.completedGames = [];
  }

  /**
   * GameMetricsを構築
   */
  private buildGameMetrics(game: InternalGame): GameMetrics {
    const decisions = game.decisions;
    const totalCost = decisions.reduce((sum, d) => sum + d.cost, 0);
    const totalLatency = decisions.reduce((sum, d) => sum + d.latencyMs, 0);
    const timeoutCount = decisions.filter(d => d.usedFallback).length;

    const modelUsage: Record<ModelType, number> = { haiku: 0, sonnet: 0, opus: 0 };
    for (const decision of decisions) {
      modelUsage[decision.model]++;
    }

    return {
      gameId: game.gameId,
      startTime: game.startTime,
      endTime: game.endTime,
      totalCost,
      requestCount: decisions.length,
      averageLatency: decisions.length > 0 ? totalLatency / decisions.length : 0,
      timeoutCount,
      modelUsage,
      decisions,
    };
  }

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    this.idCounter++;
    return `game-${Date.now()}-${this.idCounter}`;
  }
}

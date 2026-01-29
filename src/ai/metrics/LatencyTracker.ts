// src/ai/metrics/LatencyTracker.ts

import { TIMEOUT_CONFIG } from '../constants';

/**
 * 操作タイプ
 */
export type OperationType = 'mulligan' | 'turn_action' | 'choice' | 'block' | 'intercept';

/**
 * レイテンシ計測結果
 */
export interface LatencyMetric {
  operationType: OperationType;
  startTime: number;
  endTime: number;
  duration: number;
  isWithinTarget: boolean;
}

/**
 * 進行中の操作
 */
interface PendingOperation {
  operationType: OperationType;
  startTime: number;
}

/**
 * 操作タイプごとの目標レイテンシ（ms）
 */
const LATENCY_TARGETS: Record<OperationType, number> = {
  mulligan: TIMEOUT_CONFIG.MULLIGAN,
  turn_action: TIMEOUT_CONFIG.NORMAL_OPERATION,
  choice: TIMEOUT_CONFIG.CHOICE_RESPONSE,
  block: TIMEOUT_CONFIG.NORMAL_OPERATION,
  intercept: TIMEOUT_CONFIG.NORMAL_OPERATION,
};

/**
 * レイテンシ計測クラス
 *
 * 操作の応答時間を追跡し、目標達成率を計算する
 */
export class LatencyTracker {
  private metrics: LatencyMetric[] = [];
  private pending: Map<string, PendingOperation> = new Map();
  private idCounter: number = 0;

  /**
   * 操作の計測を開始
   * @param operationType 操作タイプ
   * @returns トラッキングID
   */
  start(operationType: OperationType): string {
    const trackingId = this.generateId();
    this.pending.set(trackingId, {
      operationType,
      startTime: Date.now(),
    });
    return trackingId;
  }

  /**
   * 操作の計測を終了
   * @param trackingId トラッキングID
   * @returns レイテンシ計測結果
   */
  end(trackingId: string): LatencyMetric {
    const pendingOp = this.pending.get(trackingId);
    if (!pendingOp) {
      throw new Error(`Unknown tracking ID: ${trackingId}`);
    }

    const endTime = Date.now();
    const duration = endTime - pendingOp.startTime;
    const target = LATENCY_TARGETS[pendingOp.operationType];
    const isWithinTarget = duration <= target;

    const metric: LatencyMetric = {
      operationType: pendingOp.operationType,
      startTime: pendingOp.startTime,
      endTime,
      duration,
      isWithinTarget,
    };

    this.metrics.push(metric);
    this.pending.delete(trackingId);

    return metric;
  }

  /**
   * 平均レイテンシを取得
   * @param operationType 特定の操作タイプでフィルタ（省略時は全体）
   * @returns 平均レイテンシ（ms）
   */
  getAverageLatency(operationType?: OperationType): number {
    const filtered = operationType
      ? this.metrics.filter(m => m.operationType === operationType)
      : this.metrics;

    if (filtered.length === 0) {
      return 0;
    }

    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }

  /**
   * 目標達成率を取得
   * @returns 0-1の値（1が100%達成）
   */
  getTargetCompliance(): number {
    if (this.metrics.length === 0) {
      return 1;
    }

    const withinTarget = this.metrics.filter(m => m.isWithinTarget).length;
    return withinTarget / this.metrics.length;
  }

  /**
   * 全ての計測結果を取得
   * @returns レイテンシ計測結果の配列
   */
  getMetrics(): LatencyMetric[] {
    return [...this.metrics];
  }

  /**
   * 保留中の操作数を取得
   * @returns 保留中の操作数
   */
  getPendingCount(): number {
    return this.pending.size;
  }

  /**
   * 全ての計測データをクリア
   */
  clear(): void {
    this.metrics = [];
    this.pending.clear();
  }

  /**
   * 一意のIDを生成
   */
  private generateId(): string {
    this.idCounter++;
    return `latency-${Date.now()}-${this.idCounter}`;
  }
}

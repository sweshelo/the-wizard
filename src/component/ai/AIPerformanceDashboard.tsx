// src/component/ai/AIPerformanceDashboard.tsx

'use client';

import React from 'react';
import type { GameMetrics, AggregateMetrics, Alert } from '@/ai/metrics';

interface AIPerformanceDashboardProps {
  currentGame?: GameMetrics;
  aggregate: AggregateMetrics;
  alerts: Alert[];
  costLimit?: number;
}

/**
 * AIパフォーマンスダッシュボード
 */
export const AIPerformanceDashboard: React.FC<AIPerformanceDashboardProps> = ({
  currentGame,
  aggregate,
  alerts,
  costLimit = 2.0,
}) => {
  const costPercentage = currentGame ? Math.min(100, (currentGame.totalCost / costLimit) * 100) : 0;

  return (
    <div className="ai-performance-dashboard">
      {/* 現在のゲーム */}
      {currentGame && (
        <section className="current-game">
          <h3>Current Game</h3>

          {/* コスト進捗バー */}
          <div className="cost-progress">
            <label>
              Cost: ${currentGame.totalCost.toFixed(3)} / ${costLimit.toFixed(2)}
            </label>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${costPercentage}%`,
                  backgroundColor: costPercentage > 80 ? '#ff4444' : '#44ff44',
                }}
              />
            </div>
          </div>

          {/* メトリクス */}
          <div className="metrics-grid">
            <div className="metric">
              <span className="label">Requests</span>
              <span className="value">{currentGame.requestCount}</span>
            </div>
            <div className="metric">
              <span className="label">Avg Latency</span>
              <span className="value">{currentGame.averageLatency.toFixed(0)}ms</span>
            </div>
            <div className="metric">
              <span className="label">Timeouts</span>
              <span className="value">{currentGame.timeoutCount}</span>
            </div>
          </div>

          {/* モデル使用率 */}
          <div className="model-usage">
            <span>Haiku: {currentGame.modelUsage.haiku}</span>
            <span>Sonnet: {currentGame.modelUsage.sonnet}</span>
            <span>Opus: {currentGame.modelUsage.opus}</span>
          </div>
        </section>
      )}

      {/* 集計メトリクス */}
      <section className="aggregate">
        <h3>Aggregate ({aggregate.totalGames} games)</h3>
        <div className="metrics-grid">
          <div className="metric">
            <span className="label">Avg Cost/Game</span>
            <span className="value">${aggregate.averageCostPerGame.toFixed(3)}</span>
          </div>
          <div className="metric">
            <span className="label">Avg Latency</span>
            <span className="value">{aggregate.averageLatency.toFixed(0)}ms</span>
          </div>
          <div className="metric">
            <span className="label">Timeout Rate</span>
            <span className="value">{(aggregate.timeoutRate * 100).toFixed(1)}%</span>
          </div>
        </div>
      </section>

      {/* アラート */}
      {alerts.length > 0 && (
        <section className="alerts">
          <h3>Alerts</h3>
          {alerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.severity}`}>
              <span className="icon">{alert.severity === 'error' ? '!' : '!'}</span>
              <span className="message">{alert.message}</span>
            </div>
          ))}
        </section>
      )}

      <style>{`
        .ai-performance-dashboard {
          font-family: monospace;
          padding: 1rem;
          background: #1a1a2e;
          color: #eee;
          border-radius: 8px;
          font-size: 12px;
        }

        h3 {
          margin: 0 0 0.5rem 0;
          font-size: 14px;
          color: #88f;
        }

        section {
          margin-bottom: 1rem;
        }

        .cost-progress {
          margin-bottom: 0.5rem;
        }

        .progress-bar {
          height: 8px;
          background: #333;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .metrics-grid {
          display: flex;
          gap: 1rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
        }

        .metric .label {
          color: #888;
          font-size: 10px;
        }

        .metric .value {
          font-size: 16px;
          font-weight: bold;
        }

        .model-usage {
          display: flex;
          gap: 1rem;
          margin-top: 0.5rem;
          color: #888;
        }

        .alerts {
          border-top: 1px solid #333;
          padding-top: 0.5rem;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          margin-bottom: 0.25rem;
        }

        .alert-warning {
          background: #443300;
        }

        .alert-error {
          background: #440000;
        }

        .alert .icon {
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

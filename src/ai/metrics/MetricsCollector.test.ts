// src/ai/metrics/MetricsCollector.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { MetricsCollector } from './MetricsCollector';
import type { DecisionMetric } from './MetricsCollector';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('startGame', () => {
    it('should create a new game and return gameId', () => {
      const gameId = collector.startGame();

      expect(gameId).toBeDefined();
      expect(typeof gameId).toBe('string');
    });

    it('should generate unique IDs for each game', () => {
      const id1 = collector.startGame();
      collector.endGame(id1);
      const id2 = collector.startGame();

      expect(id1).not.toBe(id2);
    });
  });

  describe('endGame', () => {
    it('should mark game as ended', () => {
      const gameId = collector.startGame();
      collector.endGame(gameId);

      const metrics = collector.getGameMetrics(gameId);
      expect(metrics?.endTime).toBeDefined();
    });
  });

  describe('recordDecision', () => {
    it('should record decision metric', () => {
      const gameId = collector.startGame();
      const decision: DecisionMetric = {
        turn: 1,
        type: 'mulligan',
        model: 'haiku',
        latencyMs: 1000,
        tokens: { input: 500, output: 100 },
        cost: 0.001,
        usedFallback: false,
      };

      collector.recordDecision(gameId, decision);

      const metrics = collector.getGameMetrics(gameId);
      expect(metrics?.decisions).toHaveLength(1);
      expect(metrics?.decisions[0].turn).toBe(1);
    });

    it('should accumulate total cost', () => {
      const gameId = collector.startGame();

      collector.recordDecision(gameId, createDecision({ cost: 0.01 }));
      collector.recordDecision(gameId, createDecision({ cost: 0.02 }));

      const metrics = collector.getGameMetrics(gameId);
      expect(metrics?.totalCost).toBeCloseTo(0.03, 5);
    });

    it('should count requests', () => {
      const gameId = collector.startGame();

      collector.recordDecision(gameId, createDecision({}));
      collector.recordDecision(gameId, createDecision({}));
      collector.recordDecision(gameId, createDecision({}));

      const metrics = collector.getGameMetrics(gameId);
      expect(metrics?.requestCount).toBe(3);
    });
  });

  describe('getGameMetrics', () => {
    it('should return null for unknown gameId', () => {
      const metrics = collector.getGameMetrics('unknown-id');
      expect(metrics).toBeNull();
    });

    it('should calculate average latency', () => {
      const gameId = collector.startGame();

      collector.recordDecision(gameId, createDecision({ latencyMs: 1000 }));
      collector.recordDecision(gameId, createDecision({ latencyMs: 2000 }));
      collector.recordDecision(gameId, createDecision({ latencyMs: 3000 }));

      const metrics = collector.getGameMetrics(gameId);
      expect(metrics?.averageLatency).toBe(2000);
    });

    it('should track model usage', () => {
      const gameId = collector.startGame();

      collector.recordDecision(gameId, createDecision({ model: 'haiku' }));
      collector.recordDecision(gameId, createDecision({ model: 'haiku' }));
      collector.recordDecision(gameId, createDecision({ model: 'sonnet' }));

      const metrics = collector.getGameMetrics(gameId);
      expect(metrics?.modelUsage.haiku).toBe(2);
      expect(metrics?.modelUsage.sonnet).toBe(1);
    });

    it('should count timeouts', () => {
      const gameId = collector.startGame();

      collector.recordDecision(gameId, createDecision({ usedFallback: true }));
      collector.recordDecision(gameId, createDecision({ usedFallback: false }));
      collector.recordDecision(gameId, createDecision({ usedFallback: true }));

      const metrics = collector.getGameMetrics(gameId);
      expect(metrics?.timeoutCount).toBe(2);
    });
  });

  describe('getAggregateMetrics', () => {
    it('should return aggregate metrics across games', () => {
      const game1 = collector.startGame();
      collector.recordDecision(game1, createDecision({ cost: 0.5, latencyMs: 1000 }));
      collector.endGame(game1);

      const game2 = collector.startGame();
      collector.recordDecision(game2, createDecision({ cost: 1.0, latencyMs: 2000 }));
      collector.endGame(game2);

      const aggregate = collector.getAggregateMetrics();

      expect(aggregate.totalGames).toBe(2);
      expect(aggregate.averageCostPerGame).toBeCloseTo(0.75, 5);
      expect(aggregate.averageLatency).toBe(1500);
    });

    it('should calculate timeout rate', () => {
      const game1 = collector.startGame();
      collector.recordDecision(game1, createDecision({ usedFallback: true }));
      collector.recordDecision(game1, createDecision({ usedFallback: false }));
      collector.recordDecision(game1, createDecision({ usedFallback: false }));
      collector.recordDecision(game1, createDecision({ usedFallback: false }));
      collector.endGame(game1);

      const aggregate = collector.getAggregateMetrics();

      expect(aggregate.timeoutRate).toBe(0.25);
    });
  });

  describe('getAlerts', () => {
    it('should return empty array when no issues', () => {
      const gameId = collector.startGame();
      collector.recordDecision(gameId, createDecision({ cost: 0.01, latencyMs: 1000 }));
      collector.endGame(gameId);

      const alerts = collector.getAlerts();

      expect(alerts).toHaveLength(0);
    });

    it('should alert when cost exceeds threshold', () => {
      const gameId = collector.startGame();
      collector.recordDecision(gameId, createDecision({ cost: 2.5 }));
      collector.endGame(gameId);

      const alerts = collector.getAlerts();

      expect(alerts.some(a => a.type === 'cost')).toBe(true);
    });

    it('should alert when timeout rate is high', () => {
      const gameId = collector.startGame();
      // 50% timeout rate (> 1% threshold)
      collector.recordDecision(gameId, createDecision({ usedFallback: true }));
      collector.recordDecision(gameId, createDecision({ usedFallback: true }));
      collector.recordDecision(gameId, createDecision({ usedFallback: false }));
      collector.recordDecision(gameId, createDecision({ usedFallback: false }));
      collector.endGame(gameId);

      const alerts = collector.getAlerts();

      expect(alerts.some(a => a.type === 'timeout')).toBe(true);
    });
  });

  describe('exportJSON', () => {
    it('should export all data as JSON', () => {
      const gameId = collector.startGame();
      collector.recordDecision(gameId, createDecision({}));
      collector.endGame(gameId);

      const json = collector.exportJSON();
      const data = JSON.parse(json);

      expect(data.games).toBeDefined();
      expect(data.aggregate).toBeDefined();
      expect(data.alerts).toBeDefined();
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      const gameId = collector.startGame();
      collector.recordDecision(gameId, createDecision({}));
      collector.endGame(gameId);

      collector.clear();

      const aggregate = collector.getAggregateMetrics();
      expect(aggregate.totalGames).toBe(0);
    });
  });
});

// ヘルパー関数
function createDecision(overrides: Partial<DecisionMetric>): DecisionMetric {
  return {
    turn: 1,
    type: 'turn_action',
    model: 'haiku',
    latencyMs: 1000,
    tokens: { input: 500, output: 100 },
    cost: 0.001,
    usedFallback: false,
    ...overrides,
  };
}

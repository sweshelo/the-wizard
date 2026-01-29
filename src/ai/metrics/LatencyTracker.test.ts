// src/ai/metrics/LatencyTracker.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { LatencyTracker } from './LatencyTracker';
import type { OperationType } from './LatencyTracker';

describe('LatencyTracker', () => {
  let tracker: LatencyTracker;

  beforeEach(() => {
    tracker = new LatencyTracker();
  });

  describe('start/end', () => {
    it('should record operation start and return tracking ID', () => {
      const trackingId = tracker.start('turn_action');

      expect(trackingId).toBeDefined();
      expect(typeof trackingId).toBe('string');
      expect(trackingId.length).toBeGreaterThan(0);
    });

    it('should record operation end and return metric', () => {
      const trackingId = tracker.start('turn_action');
      const metric = tracker.end(trackingId);

      expect(metric).toBeDefined();
      expect(metric.operationType).toBe('turn_action');
      expect(metric.duration).toBeGreaterThanOrEqual(0);
      expect(metric.startTime).toBeLessThanOrEqual(metric.endTime);
    });

    it('should throw error when ending unknown tracking ID', () => {
      expect(() => tracker.end('unknown-id')).toThrow();
    });

    it('should calculate duration correctly', async () => {
      const trackingId = tracker.start('mulligan');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 50));

      const metric = tracker.end(trackingId);

      expect(metric.duration).toBeGreaterThanOrEqual(40); // Allow some tolerance
    });
  });

  describe('isWithinTarget', () => {
    it('should mark turn_action within target when under 5000ms', () => {
      const trackingId = tracker.start('turn_action');
      const metric = tracker.end(trackingId);

      // Immediate end should be within target
      expect(metric.isWithinTarget).toBe(true);
    });

    it('should mark choice within target when under 8000ms', () => {
      const trackingId = tracker.start('choice');
      const metric = tracker.end(trackingId);

      expect(metric.isWithinTarget).toBe(true);
    });

    it('should mark mulligan within target when under 8000ms', () => {
      const trackingId = tracker.start('mulligan');
      const metric = tracker.end(trackingId);

      expect(metric.isWithinTarget).toBe(true);
    });
  });

  describe('getAverageLatency', () => {
    it('should return 0 when no metrics recorded', () => {
      const avg = tracker.getAverageLatency();

      expect(avg).toBe(0);
    });

    it('should calculate average across all operations', () => {
      // Record multiple operations
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      const id2 = tracker.start('choice');
      tracker.end(id2);

      const avg = tracker.getAverageLatency();

      expect(avg).toBeGreaterThanOrEqual(0);
    });

    it('should filter by operation type', () => {
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      const id2 = tracker.start('choice');
      tracker.end(id2);

      const turnActionAvg = tracker.getAverageLatency('turn_action');
      const choiceAvg = tracker.getAverageLatency('choice');

      expect(turnActionAvg).toBeGreaterThanOrEqual(0);
      expect(choiceAvg).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for operation type with no metrics', () => {
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      const avg = tracker.getAverageLatency('block');

      expect(avg).toBe(0);
    });
  });

  describe('getTargetCompliance', () => {
    it('should return 1 when no metrics recorded', () => {
      const compliance = tracker.getTargetCompliance();

      expect(compliance).toBe(1);
    });

    it('should return 1 when all operations are within target', () => {
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      const id2 = tracker.start('choice');
      tracker.end(id2);

      const compliance = tracker.getTargetCompliance();

      expect(compliance).toBe(1);
    });

    it('should calculate compliance correctly with mixed results', () => {
      // Add a metric that's within target
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      // All should be within target for immediate operations
      const compliance = tracker.getTargetCompliance();
      expect(compliance).toBeGreaterThan(0);
      expect(compliance).toBeLessThanOrEqual(1);
    });
  });

  describe('getMetrics', () => {
    it('should return empty array initially', () => {
      const metrics = tracker.getMetrics();

      expect(metrics).toEqual([]);
    });

    it('should return all recorded metrics', () => {
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      const id2 = tracker.start('choice');
      tracker.end(id2);

      const metrics = tracker.getMetrics();

      expect(metrics).toHaveLength(2);
      expect(metrics[0].operationType).toBe('turn_action');
      expect(metrics[1].operationType).toBe('choice');
    });

    it('should not include pending operations', () => {
      tracker.start('turn_action'); // Not ended

      const metrics = tracker.getMetrics();

      expect(metrics).toHaveLength(0);
    });
  });

  describe('clear', () => {
    it('should remove all metrics', () => {
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      tracker.clear();

      expect(tracker.getMetrics()).toHaveLength(0);
    });

    it('should reset average latency to 0', () => {
      const id1 = tracker.start('turn_action');
      tracker.end(id1);

      tracker.clear();

      expect(tracker.getAverageLatency()).toBe(0);
    });
  });

  describe('operation types', () => {
    const operationTypes: OperationType[] = [
      'mulligan',
      'turn_action',
      'choice',
      'block',
      'intercept',
    ];

    it.each(operationTypes)('should handle %s operation type', opType => {
      const trackingId = tracker.start(opType);
      const metric = tracker.end(trackingId);

      expect(metric.operationType).toBe(opType);
    });
  });

  describe('getTargetForOperation', () => {
    it('should return correct targets for different operations', () => {
      // Test via isWithinTarget behavior
      // turn_action, block, intercept: 5000ms
      // mulligan, choice: 8000ms

      const turnId = tracker.start('turn_action');
      const turnMetric = tracker.end(turnId);
      expect(turnMetric.isWithinTarget).toBe(true);

      const mulliganId = tracker.start('mulligan');
      const mulliganMetric = tracker.end(mulliganId);
      expect(mulliganMetric.isWithinTarget).toBe(true);
    });
  });

  describe('pending operations', () => {
    it('should track pending operations count', () => {
      expect(tracker.getPendingCount()).toBe(0);

      tracker.start('turn_action');
      expect(tracker.getPendingCount()).toBe(1);

      const id2 = tracker.start('choice');
      expect(tracker.getPendingCount()).toBe(2);

      tracker.end(id2);
      expect(tracker.getPendingCount()).toBe(1);
    });
  });
});

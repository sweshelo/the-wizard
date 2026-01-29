// src/ai/ParallelInference.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { ParallelInference } from './ParallelInference';
import type { InferenceTask } from './ParallelInference';
import type { LLMClient } from './LLMClient';
import { BackgroundRunner } from './BackgroundRunner';

// モックLLMClient
const createMockLLMClient = (delay: number = 10): LLMClient => {
  return {
    send: mock(async (_systemPrompt: string, _userMessage: string, _options?: unknown) => {
      await new Promise(resolve => setTimeout(resolve, delay));
      return {
        content: 'Test response',
        model: 'haiku',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
      };
    }),
  } as unknown as LLMClient;
};

describe('ParallelInference', () => {
  let inference: ParallelInference;
  let mockClient: LLMClient;
  let runner: BackgroundRunner;

  beforeEach(() => {
    mockClient = createMockLLMClient();
    runner = new BackgroundRunner();
    inference = new ParallelInference(mockClient, runner);
  });

  describe('submitTasks', () => {
    it('should return task IDs for submitted tasks', () => {
      const tasks: InferenceTask[] = [
        { id: 'task1', type: 'analysis', prompt: 'Test prompt 1' },
        { id: 'task2', type: 'decision', prompt: 'Test prompt 2' },
      ];

      const taskIds = inference.submitTasks(tasks);

      expect(taskIds).toHaveLength(2);
      expect(taskIds[0]).toBeDefined();
      expect(taskIds[1]).toBeDefined();
    });

    it('should submit tasks to background runner', () => {
      const tasks: InferenceTask[] = [{ id: 'task1', type: 'analysis', prompt: 'Test prompt' }];

      inference.submitTasks(tasks);

      expect(runner.getPendingCount()).toBeGreaterThan(0);
    });
  });

  describe('awaitAll', () => {
    it('should wait for all tasks to complete', async () => {
      const tasks: InferenceTask[] = [
        { id: 'task1', type: 'analysis', prompt: 'Test prompt 1' },
        { id: 'task2', type: 'decision', prompt: 'Test prompt 2' },
      ];

      const taskIds = inference.submitTasks(tasks);
      const results = await inference.awaitAll(taskIds);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should return results with latency information', async () => {
      const tasks: InferenceTask[] = [{ id: 'task1', type: 'analysis', prompt: 'Test prompt' }];

      const taskIds = inference.submitTasks(tasks);
      const results = await inference.awaitAll(taskIds);

      expect(results[0].latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle timeout gracefully', async () => {
      // Create a slow client
      mockClient = createMockLLMClient(500);
      inference = new ParallelInference(mockClient, runner);

      const tasks: InferenceTask[] = [{ id: 'task1', type: 'analysis', prompt: 'Test prompt' }];

      const taskIds = inference.submitTasks(tasks);
      const results = await inference.awaitAll(taskIds, 50); // 50ms timeout

      // Should timeout - task may not complete
      expect(results).toBeDefined();
    });
  });

  describe('awaitFirst', () => {
    it('should return the first completed result', async () => {
      const tasks: InferenceTask[] = [
        { id: 'task1', type: 'analysis', prompt: 'Test prompt 1' },
        { id: 'task2', type: 'decision', prompt: 'Test prompt 2' },
      ];

      const taskIds = inference.submitTasks(tasks);
      const result = await inference.awaitFirst(taskIds);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });

  describe('aggregateResults', () => {
    it('should combine successful results', async () => {
      const tasks: InferenceTask[] = [
        { id: 'task1', type: 'analysis', prompt: 'Test prompt 1' },
        { id: 'task2', type: 'decision', prompt: 'Test prompt 2' },
      ];

      const taskIds = inference.submitTasks(tasks);
      const results = await inference.awaitAll(taskIds);
      const aggregated = inference.aggregateResults(results);

      expect(aggregated).toContain('Test response');
    });

    it('should skip failed results', () => {
      const results = [
        { taskId: 'task1', success: true, result: 'Result 1', latencyMs: 100 },
        { taskId: 'task2', success: false, error: new Error('Failed'), latencyMs: 50 },
        { taskId: 'task3', success: true, result: 'Result 3', latencyMs: 150 },
      ];

      const aggregated = inference.aggregateResults(results);

      expect(aggregated).toContain('Result 1');
      expect(aggregated).toContain('Result 3');
      expect(aggregated).not.toContain('Failed');
    });

    it('should return empty string for all failed results', () => {
      const results = [
        { taskId: 'task1', success: false, error: new Error('Failed 1'), latencyMs: 50 },
        { taskId: 'task2', success: false, error: new Error('Failed 2'), latencyMs: 60 },
      ];

      const aggregated = inference.aggregateResults(results);

      expect(aggregated).toBe('');
    });
  });

  describe('withFallback', () => {
    it('should return primary result when successful', async () => {
      const result = await inference.withFallback(
        async () => 'Primary result',
        () => 'Fallback result',
        1000
      );

      expect(result).toBe('Primary result');
    });

    it('should return fallback when primary times out', async () => {
      const result = await inference.withFallback(
        async () => {
          await new Promise(resolve => setTimeout(resolve, 200));
          return 'Primary result';
        },
        () => 'Fallback result',
        50
      );

      expect(result).toBe('Fallback result');
    });

    it('should return fallback when primary throws', async () => {
      const result = await inference.withFallback(
        async () => {
          throw new Error('Primary failed');
        },
        () => 'Fallback result',
        1000
      );

      expect(result).toBe('Fallback result');
    });
  });

  describe('cancel', () => {
    it('should cancel pending tasks', () => {
      const tasks: InferenceTask[] = [{ id: 'task1', type: 'analysis', prompt: 'Test prompt' }];

      const taskIds = inference.submitTasks(tasks);
      const cancelled = inference.cancel(taskIds[0]);

      expect(cancelled).toBe(true);
    });
  });

  describe('getCompletedCount', () => {
    it('should return number of completed tasks', async () => {
      const tasks: InferenceTask[] = [{ id: 'task1', type: 'analysis', prompt: 'Test prompt' }];

      const taskIds = inference.submitTasks(tasks);
      await inference.awaitAll(taskIds);

      const completed = inference.getCompletedCount();

      expect(completed).toBe(1);
    });
  });

  describe('clear', () => {
    it('should clear completed tasks', async () => {
      const tasks: InferenceTask[] = [{ id: 'task1', type: 'analysis', prompt: 'Test prompt' }];

      const taskIds = inference.submitTasks(tasks);
      await inference.awaitAll(taskIds);

      inference.clear();

      expect(inference.getCompletedCount()).toBe(0);
    });
  });
});

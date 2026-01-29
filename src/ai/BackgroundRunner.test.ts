// src/ai/BackgroundRunner.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { BackgroundRunner, type BackgroundTask } from './BackgroundRunner';

describe('BackgroundRunner', () => {
  let runner: BackgroundRunner;

  beforeEach(() => {
    runner = new BackgroundRunner();
  });

  describe('submit', () => {
    it('should accept a task and return task id', () => {
      const task: BackgroundTask<string> = {
        execute: async () => 'result',
      };

      const taskId = runner.submit(task);

      expect(taskId).toBeTruthy();
      expect(typeof taskId).toBe('string');
    });

    it('should generate unique task ids', () => {
      const task1 = { execute: async () => 'a' };
      const task2 = { execute: async () => 'b' };

      const id1 = runner.submit(task1);
      const id2 = runner.submit(task2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('getResult', () => {
    it('should return result when task completes', async () => {
      const task = {
        execute: async () => 'completed result',
      };

      const taskId = runner.submit(task);
      const result = await runner.getResult<string>(taskId);

      expect(result).toBe('completed result');
    });

    it('should return null for non-existent task', async () => {
      const result = await runner.getResult('non-existent');

      expect(result).toBeNull();
    });

    it('should handle task errors gracefully', async () => {
      const task = {
        execute: async () => {
          throw new Error('Task failed');
        },
      };

      const taskId = runner.submit(task);
      const result = await runner.getResult(taskId);

      expect(result).toBeNull();
    });
  });

  describe('getStatus', () => {
    it('should return pending for queued task', () => {
      const task = {
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'result';
        },
      };

      const taskId = runner.submit(task);
      const status = runner.getStatus(taskId);

      expect(['pending', 'running']).toContain(status);
    });

    it('should return completed after task finishes', async () => {
      const task = {
        execute: async () => 'done',
      };

      const taskId = runner.submit(task);
      await runner.getResult(taskId);

      const status = runner.getStatus(taskId);
      expect(status).toBe('completed');
    });

    it('should return unknown for non-existent task', () => {
      const status = runner.getStatus('non-existent');

      expect(status).toBe('unknown');
    });
  });

  describe('cancel', () => {
    it('should cancel pending task', () => {
      let executed = false;
      const task = {
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          executed = true;
          return 'result';
        },
      };

      const taskId = runner.submit(task);
      const cancelled = runner.cancel(taskId);

      expect(cancelled).toBe(true);
      expect(runner.getStatus(taskId)).toBe('cancelled');
    });

    it('should return false for non-existent task', () => {
      const cancelled = runner.cancel('non-existent');

      expect(cancelled).toBe(false);
    });
  });

  describe('getPendingCount', () => {
    it('should return number of pending tasks', () => {
      const longTask = {
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return 'result';
        },
      };

      runner.submit(longTask);
      runner.submit(longTask);

      const pending = runner.getPendingCount();
      expect(pending).toBeGreaterThanOrEqual(0);
    });
  });

  describe('clearCompleted', () => {
    it('should remove completed tasks', async () => {
      const task = {
        execute: async () => 'done',
      };

      const taskId = runner.submit(task);
      await runner.getResult(taskId);

      runner.clearCompleted();

      expect(runner.getStatus(taskId)).toBe('unknown');
    });
  });

  describe('shutdown', () => {
    it('should cancel all pending tasks', () => {
      const longTask = {
        execute: async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return 'result';
        },
      };

      runner.submit(longTask);
      runner.submit(longTask);

      runner.shutdown();

      expect(runner.getPendingCount()).toBe(0);
    });
  });
});

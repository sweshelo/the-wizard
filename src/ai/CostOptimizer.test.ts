// src/ai/CostOptimizer.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { CostOptimizer } from './CostOptimizer';
import type { LLMClient } from './LLMClient';
import { AI_CONFIG } from './constants';

// モックLLMClient
const createMockLLMClient = (totalCost: number = 0): LLMClient => {
  return {
    getTotalCost: mock(() => totalCost),
    resetTotalCost: mock(() => {}),
    send: mock(() =>
      Promise.resolve({ content: '', model: 'haiku', inputTokens: 0, outputTokens: 0, cost: 0 })
    ),
  } as unknown as LLMClient;
};

describe('CostOptimizer', () => {
  let optimizer: CostOptimizer;
  let mockClient: LLMClient;

  beforeEach(() => {
    mockClient = createMockLLMClient(0);
    optimizer = new CostOptimizer(mockClient);
  });

  describe('getBudget', () => {
    it('should return initial budget with full remaining', () => {
      const budget = optimizer.getBudget();

      expect(budget.limit).toBe(AI_CONFIG.COST_LIMIT_PER_GAME);
      expect(budget.used).toBe(0);
      expect(budget.remaining).toBe(AI_CONFIG.COST_LIMIT_PER_GAME);
      expect(budget.warningThreshold).toBe(0.8);
    });

    it('should track used budget from LLMClient', () => {
      mockClient = createMockLLMClient(0.5);
      optimizer = new CostOptimizer(mockClient);

      const budget = optimizer.getBudget();

      expect(budget.used).toBe(0.5);
      expect(budget.remaining).toBe(AI_CONFIG.COST_LIMIT_PER_GAME - 0.5);
    });

    it('should include manually recorded usage', () => {
      optimizer.recordUsage(0.3);

      const budget = optimizer.getBudget();

      expect(budget.used).toBe(0.3);
    });
  });

  describe('shouldUseFallback', () => {
    it('should return false when budget is available', () => {
      expect(optimizer.shouldUseFallback()).toBe(false);
    });

    it('should return true when budget is exhausted', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME);

      expect(optimizer.shouldUseFallback()).toBe(true);
    });

    it('should return true when budget exceeds limit', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME + 0.1);

      expect(optimizer.shouldUseFallback()).toBe(true);
    });
  });

  describe('recommendModel', () => {
    it('should recommend haiku for low complexity', () => {
      const recommendation = optimizer.recommendModel(2);

      expect(recommendation.model).toBe('haiku');
      expect(recommendation.reason).toBeDefined();
    });

    it('should recommend sonnet for medium complexity', () => {
      const recommendation = optimizer.recommendModel(5);

      expect(recommendation.model).toBe('sonnet');
    });

    it('should recommend opus for high complexity', () => {
      const recommendation = optimizer.recommendModel(10);

      expect(recommendation.model).toBe('opus');
    });

    it('should downgrade to haiku when budget is low', () => {
      // Use 90% of budget
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 0.9);

      const recommendation = optimizer.recommendModel(10);

      expect(recommendation.model).toBe('haiku');
      expect(recommendation.reason).toContain('budget');
    });

    it('should include estimated cost in recommendation', () => {
      const recommendation = optimizer.recommendModel(5);

      expect(recommendation.estimatedCost).toBeGreaterThan(0);
    });
  });

  describe('recordUsage', () => {
    it('should accumulate usage', () => {
      optimizer.recordUsage(0.1);
      optimizer.recordUsage(0.2);

      const budget = optimizer.getBudget();

      expect(budget.used).toBeCloseTo(0.3, 5);
    });

    it('should not affect LLMClient directly', () => {
      optimizer.recordUsage(0.5);

      // LLMClient's getTotalCost should still return 0
      expect(mockClient.getTotalCost()).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear manually recorded usage', () => {
      optimizer.recordUsage(0.5);
      optimizer.reset();

      const budget = optimizer.getBudget();

      expect(budget.used).toBe(0); // Only manual usage reset
    });
  });

  describe('shouldSkipAnalysis', () => {
    it('should return false when budget is healthy', () => {
      expect(optimizer.shouldSkipAnalysis()).toBe(false);
    });

    it('should return true when budget exceeds warning threshold', () => {
      // Use more than 80% of budget
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 0.85);

      expect(optimizer.shouldSkipAnalysis()).toBe(true);
    });
  });

  describe('getPromptCompressionLevel', () => {
    it('should return none when budget is healthy', () => {
      expect(optimizer.getPromptCompressionLevel()).toBe('none');
    });

    it('should return light when budget is at 50%', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 0.55);

      expect(optimizer.getPromptCompressionLevel()).toBe('light');
    });

    it('should return aggressive when budget is at 80%', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 0.85);

      expect(optimizer.getPromptCompressionLevel()).toBe('aggressive');
    });
  });

  describe('isWarningLevel', () => {
    it('should return false when under warning threshold', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 0.5);

      expect(optimizer.isWarningLevel()).toBe(false);
    });

    it('should return true when at or over warning threshold', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 0.8);

      expect(optimizer.isWarningLevel()).toBe(true);
    });
  });

  describe('getUsagePercentage', () => {
    it('should return 0 when no usage', () => {
      expect(optimizer.getUsagePercentage()).toBe(0);
    });

    it('should return correct percentage', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 0.5);

      expect(optimizer.getUsagePercentage()).toBeCloseTo(0.5, 2);
    });

    it('should cap at 1 even when over budget', () => {
      optimizer.recordUsage(AI_CONFIG.COST_LIMIT_PER_GAME * 1.5);

      expect(optimizer.getUsagePercentage()).toBe(1);
    });
  });

  describe('integration with LLMClient', () => {
    it('should combine LLMClient cost with manual recording', () => {
      mockClient = createMockLLMClient(0.5);
      optimizer = new CostOptimizer(mockClient);
      optimizer.recordUsage(0.3);

      const budget = optimizer.getBudget();

      expect(budget.used).toBe(0.8);
    });
  });
});

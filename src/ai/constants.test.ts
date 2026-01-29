// src/ai/constants.test.ts
import { describe, it, expect } from 'bun:test';
import { AI_CONFIG, MODEL_CONFIG, TIMEOUT_CONFIG } from './constants';

describe('AI Constants', () => {
  describe('AI_CONFIG', () => {
    it('should define COST_LIMIT_PER_GAME', () => {
      expect(AI_CONFIG.COST_LIMIT_PER_GAME).toBeDefined();
      expect(typeof AI_CONFIG.COST_LIMIT_PER_GAME).toBe('number');
    });

    it('should define COMPLEXITY_THRESHOLD', () => {
      expect(AI_CONFIG.COMPLEXITY_THRESHOLD).toBeDefined();
      expect(typeof AI_CONFIG.COMPLEXITY_THRESHOLD).toBe('number');
    });

    it('should define PERIODIC_ANALYSIS_ROUNDS', () => {
      expect(AI_CONFIG.PERIODIC_ANALYSIS_ROUNDS).toBeDefined();
      expect(typeof AI_CONFIG.PERIODIC_ANALYSIS_ROUNDS).toBe('number');
    });
  });

  describe('MODEL_CONFIG', () => {
    it('should define HAIKU model', () => {
      expect(MODEL_CONFIG.HAIKU).toBeDefined();
      expect(typeof MODEL_CONFIG.HAIKU).toBe('string');
    });

    it('should define SONNET model', () => {
      expect(MODEL_CONFIG.SONNET).toBeDefined();
      expect(typeof MODEL_CONFIG.SONNET).toBe('string');
    });

    it('should define OPUS model', () => {
      expect(MODEL_CONFIG.OPUS).toBeDefined();
      expect(typeof MODEL_CONFIG.OPUS).toBe('string');
    });
  });

  describe('TIMEOUT_CONFIG', () => {
    it('should define NORMAL_OPERATION timeout', () => {
      expect(TIMEOUT_CONFIG.NORMAL_OPERATION).toBeDefined();
      expect(TIMEOUT_CONFIG.NORMAL_OPERATION).toBeLessThan(60000);
    });

    it('should define CHOICE_RESPONSE timeout', () => {
      expect(TIMEOUT_CONFIG.CHOICE_RESPONSE).toBeDefined();
      expect(TIMEOUT_CONFIG.CHOICE_RESPONSE).toBeLessThan(10000);
    });

    it('should define MULLIGAN timeout', () => {
      expect(TIMEOUT_CONFIG.MULLIGAN).toBeDefined();
      expect(TIMEOUT_CONFIG.MULLIGAN).toBeLessThan(15000);
    });

    it('should define FALLBACK_WARNING timeout', () => {
      expect(TIMEOUT_CONFIG.FALLBACK_WARNING).toBeDefined();
      expect(TIMEOUT_CONFIG.FALLBACK_WARNING).toBeLessThan(5000);
    });
  });
});

// src/ai/index.test.ts
import { describe, it, expect } from 'bun:test';
import * as AIModule from './index';

describe('AI Module', () => {
  describe('exports', () => {
    it('should export AI_CONFIG', () => {
      expect(AIModule.AI_CONFIG).toBeDefined();
    });

    it('should export MODEL_CONFIG', () => {
      expect(AIModule.MODEL_CONFIG).toBeDefined();
    });

    it('should export TIMEOUT_CONFIG', () => {
      expect(AIModule.TIMEOUT_CONFIG).toBeDefined();
    });
  });
});

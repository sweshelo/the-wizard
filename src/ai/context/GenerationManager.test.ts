// src/ai/context/GenerationManager.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { GenerationManager, type InfoCategory } from './GenerationManager';

describe('GenerationManager', () => {
  let manager: GenerationManager;

  beforeEach(() => {
    manager = new GenerationManager();
  });

  describe('register', () => {
    it('should assign generation number to new info', () => {
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });

      expect(info.generation).toBe(1);
    });

    it('should increment id counter for each registration', () => {
      const info1 = manager.register({
        content: 'content 1',
        category: 'board_state',
        gameRound: 1,
      });
      const info2 = manager.register({
        content: 'content 2',
        category: 'strategy',
        gameRound: 1,
      });

      expect(info1.id).not.toBe(info2.id);
    });

    it('should record creation timestamp', () => {
      const before = new Date();
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });
      const after = new Date();

      expect(info.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(info.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should associate info with current game round', () => {
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 5,
      });

      expect(info.gameRound).toBe(5);
    });

    it('should set lastAccessedAt to creation time', () => {
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });

      expect(info.lastAccessedAt.getTime()).toBe(info.createdAt.getTime());
    });
  });

  describe('checkStaleness', () => {
    it('should return 0 for fresh info in same round', () => {
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });
      manager.setCurrentRound(1);

      const staleness = manager.checkStaleness(info.id);
      expect(staleness).toBe(0);
    });

    it('should return higher value for older info', () => {
      // Use deck_analysis which has 10 rounds stale threshold
      const info = manager.register({
        content: 'test content',
        category: 'deck_analysis',
        gameRound: 1,
      });

      manager.setCurrentRound(3);
      const staleness1 = manager.checkStaleness(info.id);

      manager.setCurrentRound(6);
      const staleness2 = manager.checkStaleness(info.id);

      expect(staleness2).toBeGreaterThan(staleness1);
    });

    it('should consider game round difference', () => {
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });

      // board_state stales in 1 round
      manager.setCurrentRound(2);
      const staleness = manager.checkStaleness(info.id);

      expect(staleness).toBeGreaterThan(0);
    });

    it('should consider category-specific thresholds', () => {
      const boardInfo = manager.register({
        content: 'board state',
        category: 'board_state',
        gameRound: 1,
      });
      const deckInfo = manager.register({
        content: 'deck analysis',
        category: 'deck_analysis',
        gameRound: 1,
      });

      // Move forward 2 rounds
      manager.setCurrentRound(3);

      const boardStaleness = manager.checkStaleness(boardInfo.id);
      const deckStaleness = manager.checkStaleness(deckInfo.id);

      // board_state should be more stale than deck_analysis
      expect(boardStaleness).toBeGreaterThan(deckStaleness);
    });

    it('should return 1 for fully stale info', () => {
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });

      // Move forward many rounds
      manager.setCurrentRound(10);
      const staleness = manager.checkStaleness(info.id);

      expect(staleness).toBe(1);
    });

    it('should return -1 for non-existent id', () => {
      const staleness = manager.checkStaleness('non-existent-id');
      expect(staleness).toBe(-1);
    });
  });

  describe('findStaleEntries', () => {
    it('should return empty array when no stale info', () => {
      manager.register({
        content: 'test content',
        category: 'deck_analysis',
        gameRound: 1,
      });
      manager.setCurrentRound(1);

      const stale = manager.findStaleEntries();
      expect(stale).toHaveLength(0);
    });

    it('should return stale entries above threshold', () => {
      manager.register({
        content: 'board state',
        category: 'board_state',
        gameRound: 1,
      });
      manager.setCurrentRound(5);

      const stale = manager.findStaleEntries(0.5);
      expect(stale.length).toBeGreaterThan(0);
    });

    it('should prioritize by staleness level', () => {
      manager.register({
        content: 'older board state',
        category: 'board_state',
        gameRound: 1,
      });
      manager.register({
        content: 'newer board state',
        category: 'board_state',
        gameRound: 3,
      });
      manager.setCurrentRound(5);

      const stale = manager.findStaleEntries(0);
      expect(stale.length).toBe(2);
      // First should be more stale
      expect(stale[0].staleness).toBeGreaterThanOrEqual(stale[1].staleness);
    });
  });

  describe('getUpdateTriggers', () => {
    it('should return empty array when no stale info', () => {
      manager.register({
        content: 'test content',
        category: 'deck_analysis',
        gameRound: 1,
      });
      manager.setCurrentRound(1);

      const triggers = manager.getUpdateTriggers();
      expect(triggers).toHaveLength(0);
    });

    it('should return stale entries above default threshold', () => {
      manager.register({
        content: 'board state',
        category: 'board_state',
        gameRound: 1,
      });
      manager.setCurrentRound(10);

      const triggers = manager.getUpdateTriggers();
      expect(triggers.length).toBeGreaterThan(0);
    });

    it('should include reason for each trigger', () => {
      manager.register({
        content: 'board state',
        category: 'board_state',
        gameRound: 1,
      });
      manager.setCurrentRound(10);

      const triggers = manager.getUpdateTriggers();
      expect(triggers[0].reason).toBeTruthy();
      expect(typeof triggers[0].reason).toBe('string');
    });
  });

  describe('incrementGeneration', () => {
    it('should increment global generation counter', () => {
      const info1 = manager.register({
        content: 'content 1',
        category: 'board_state',
        gameRound: 1,
      });

      manager.incrementGeneration();

      const info2 = manager.register({
        content: 'content 2',
        category: 'board_state',
        gameRound: 2,
      });

      expect(info2.generation).toBe(info1.generation + 1);
    });
  });

  describe('markAsAccessed', () => {
    it('should update lastAccessedAt', async () => {
      const info = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });

      const originalAccessTime = info.lastAccessedAt.getTime();

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 10));

      manager.markAsAccessed(info.id);
      const updatedInfo = manager.getInfo(info.id);

      expect(updatedInfo?.lastAccessedAt.getTime()).toBeGreaterThan(originalAccessTime);
    });

    it('should return false for non-existent id', () => {
      const result = manager.markAsAccessed('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('getInfo', () => {
    it('should return registered info by id', () => {
      const registered = manager.register({
        content: 'test content',
        category: 'board_state',
        gameRound: 1,
      });

      const retrieved = manager.getInfo(registered.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toBe('test content');
    });

    it('should return undefined for non-existent id', () => {
      const retrieved = manager.getInfo('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all registered info', () => {
      manager.register({
        content: 'content 1',
        category: 'board_state',
        gameRound: 1,
      });
      manager.register({
        content: 'content 2',
        category: 'strategy',
        gameRound: 1,
      });

      manager.clear();

      const stale = manager.findStaleEntries(0);
      expect(stale).toHaveLength(0);
    });
  });

  describe('getInfoByCategory', () => {
    it('should return info filtered by category', () => {
      manager.register({
        content: 'board 1',
        category: 'board_state',
        gameRound: 1,
      });
      manager.register({
        content: 'strategy 1',
        category: 'strategy',
        gameRound: 1,
      });
      manager.register({
        content: 'board 2',
        category: 'board_state',
        gameRound: 2,
      });

      const boardInfos = manager.getInfoByCategory('board_state');
      expect(boardInfos).toHaveLength(2);
      expect(boardInfos.every(info => info.category === 'board_state')).toBe(true);
    });
  });
});

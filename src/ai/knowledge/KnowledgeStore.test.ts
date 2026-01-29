// src/ai/knowledge/KnowledgeStore.test.ts

import { describe, it, expect, beforeEach } from 'bun:test';
import { KnowledgeStore, type KnowledgeEntry } from './KnowledgeStore';

describe('KnowledgeStore', () => {
  let store: KnowledgeStore;

  beforeEach(() => {
    store = new KnowledgeStore();
    store.clear(); // テスト間で状態をクリア
  });

  describe('save', () => {
    it('should save a knowledge entry', () => {
      const entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'opponent_pattern',
        content: 'Test pattern',
        importance: 0.8,
        tags: ['test'],
      };

      const saved = store.save(entry);

      expect(saved.id).toBeTruthy();
      expect(saved.content).toBe('Test pattern');
      expect(saved.createdAt).toBeInstanceOf(Date);
    });

    it('should generate unique ids', () => {
      const entry1 = store.save({ type: 'combo', content: 'Combo 1', importance: 0.5, tags: [] });
      const entry2 = store.save({ type: 'combo', content: 'Combo 2', importance: 0.5, tags: [] });

      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('get', () => {
    it('should retrieve entry by id', () => {
      const saved = store.save({
        type: 'strategy',
        content: 'Strategy',
        importance: 0.7,
        tags: [],
      });

      const retrieved = store.get(saved.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.content).toBe('Strategy');
    });

    it('should return undefined for non-existent id', () => {
      const retrieved = store.get('non-existent');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('search', () => {
    it('should find entries by type', () => {
      store.save({ type: 'combo', content: 'Combo 1', importance: 0.5, tags: [] });
      store.save({ type: 'combo', content: 'Combo 2', importance: 0.5, tags: [] });
      store.save({ type: 'strategy', content: 'Strategy', importance: 0.5, tags: [] });

      const results = store.search({ type: 'combo' });

      expect(results).toHaveLength(2);
      expect(results.every(e => e.type === 'combo')).toBe(true);
    });

    it('should find entries by tag', () => {
      store.save({ type: 'combo', content: 'Red combo', importance: 0.5, tags: ['red', 'aggro'] });
      store.save({
        type: 'combo',
        content: 'Blue combo',
        importance: 0.5,
        tags: ['blue', 'control'],
      });

      const results = store.search({ tag: 'red' });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Red combo');
    });

    it('should find entries by minimum importance', () => {
      store.save({ type: 'combo', content: 'Low', importance: 0.3, tags: [] });
      store.save({ type: 'combo', content: 'High', importance: 0.9, tags: [] });

      const results = store.search({ minImportance: 0.5 });

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('High');
    });
  });

  describe('update', () => {
    it('should update existing entry', () => {
      const saved = store.save({
        type: 'strategy',
        content: 'Original',
        importance: 0.5,
        tags: [],
      });

      const updated = store.update(saved.id, { content: 'Updated', importance: 0.8 });

      expect(updated).toBeDefined();
      expect(updated?.content).toBe('Updated');
      expect(updated?.importance).toBe(0.8);
    });

    it('should update updatedAt timestamp', () => {
      const saved = store.save({ type: 'strategy', content: 'Test', importance: 0.5, tags: [] });
      const originalUpdatedAt = saved.updatedAt;

      // 少し待ってから更新
      const updated = store.update(saved.id, { content: 'Updated' });

      expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    });

    it('should return undefined for non-existent id', () => {
      const updated = store.update('non-existent', { content: 'Test' });

      expect(updated).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete entry', () => {
      const saved = store.save({ type: 'strategy', content: 'Test', importance: 0.5, tags: [] });

      const deleted = store.delete(saved.id);

      expect(deleted).toBe(true);
      expect(store.get(saved.id)).toBeUndefined();
    });

    it('should return false for non-existent id', () => {
      const deleted = store.delete('non-existent');

      expect(deleted).toBe(false);
    });
  });

  describe('getByImportance', () => {
    it('should return entries sorted by importance', () => {
      store.save({ type: 'combo', content: 'Low', importance: 0.3, tags: [] });
      store.save({ type: 'combo', content: 'High', importance: 0.9, tags: [] });
      store.save({ type: 'combo', content: 'Mid', importance: 0.6, tags: [] });

      const results = store.getByImportance(2);

      expect(results).toHaveLength(2);
      expect(results[0].importance).toBe(0.9);
      expect(results[1].importance).toBe(0.6);
    });
  });

  describe('pruneOld', () => {
    it('should remove entries older than specified days', () => {
      const oldEntry = store.save({ type: 'combo', content: 'Old', importance: 0.5, tags: [] });

      // 日付を過去に設定（テスト用のハック）
      const entry = store.get(oldEntry.id);
      if (entry) {
        entry.createdAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10日前
      }

      store.save({ type: 'combo', content: 'New', importance: 0.5, tags: [] });

      const pruned = store.pruneOld(7);

      expect(pruned).toBe(1);
      expect(store.get(oldEntry.id)).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      store.save({ type: 'combo', content: 'Test 1', importance: 0.5, tags: [] });
      store.save({ type: 'combo', content: 'Test 2', importance: 0.5, tags: [] });

      store.clear();

      expect(store.search({})).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return store statistics', () => {
      store.save({ type: 'combo', content: 'Combo 1', importance: 0.5, tags: [] });
      store.save({ type: 'combo', content: 'Combo 2', importance: 0.8, tags: [] });
      store.save({ type: 'strategy', content: 'Strategy', importance: 0.6, tags: [] });

      const stats = store.getStats();

      expect(stats.totalEntries).toBe(3);
      expect(stats.byType['combo']).toBe(2);
      expect(stats.byType['strategy']).toBe(1);
      expect(stats.averageImportance).toBeCloseTo(0.633, 2);
    });
  });
});

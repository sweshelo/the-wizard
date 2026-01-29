// src/ai/catalog/CatalogCache.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { CatalogCache } from './CatalogCache';

describe('CatalogCache', () => {
  let cache: CatalogCache<string, { id: string; name: string }>;

  beforeEach(() => {
    cache = new CatalogCache<string, { id: string; name: string }>({ maxSize: 3 });
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      const value = { id: '1', name: 'Test Card' };
      cache.set('key1', value);

      expect(cache.get('key1')).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      expect(cache.get('nonexistent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true for existing keys', () => {
      cache.set('key1', { id: '1', name: 'Test' });

      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent keys', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should remove items from cache', () => {
      cache.set('key1', { id: '1', name: 'Test' });
      cache.delete('key1');

      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      cache.set('key1', { id: '1', name: 'Test1' });
      cache.set('key2', { id: '2', name: 'Test2' });
      cache.clear();

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
      expect(cache.size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used item when max size reached', () => {
      cache.set('key1', { id: '1', name: 'First' });
      cache.set('key2', { id: '2', name: 'Second' });
      cache.set('key3', { id: '3', name: 'Third' });

      // maxSize=3なので、4つ目を追加するとkey1が削除される
      cache.set('key4', { id: '4', name: 'Fourth' });

      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(true);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });

    it('should update LRU order on access', () => {
      cache.set('key1', { id: '1', name: 'First' });
      cache.set('key2', { id: '2', name: 'Second' });
      cache.set('key3', { id: '3', name: 'Third' });

      // key1にアクセスしてLRU順序を更新
      cache.get('key1');

      // key4を追加するとkey2（最も古いアクセス）が削除される
      cache.set('key4', { id: '4', name: 'Fourth' });

      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(false);
      expect(cache.has('key3')).toBe(true);
      expect(cache.has('key4')).toBe(true);
    });
  });

  describe('size', () => {
    it('should return current cache size', () => {
      expect(cache.size).toBe(0);

      cache.set('key1', { id: '1', name: 'Test1' });
      expect(cache.size).toBe(1);

      cache.set('key2', { id: '2', name: 'Test2' });
      expect(cache.size).toBe(2);
    });

    it('should not exceed max size', () => {
      cache.set('key1', { id: '1', name: 'Test1' });
      cache.set('key2', { id: '2', name: 'Test2' });
      cache.set('key3', { id: '3', name: 'Test3' });
      cache.set('key4', { id: '4', name: 'Test4' });
      cache.set('key5', { id: '5', name: 'Test5' });

      expect(cache.size).toBe(3); // maxSize = 3
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', () => {
      cache.set('key1', { id: '1', name: 'Cached' });

      const result = cache.getOrSet('key1', () => ({ id: '1', name: 'New' }));

      expect(result.name).toBe('Cached');
    });

    it('should compute and cache value if not exists', () => {
      const result = cache.getOrSet('key1', () => ({ id: '1', name: 'Computed' }));

      expect(result.name).toBe('Computed');
      expect(cache.get('key1')?.name).toBe('Computed');
    });
  });
});

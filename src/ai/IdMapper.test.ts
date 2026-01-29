// src/ai/IdMapper.test.ts
import { describe, it, expect, beforeEach } from 'bun:test';
import { IdMapper } from './IdMapper';

describe('IdMapper', () => {
  let mapper: IdMapper;

  beforeEach(() => {
    mapper = new IdMapper();
  });

  describe('shortenUnit', () => {
    it('should shorten unit IDs to u1, u2, ...', () => {
      const shortened = mapper.shortenUnit('unit-abc123-def456');
      expect(shortened).toBe('u1');
    });

    it('should return same short ID for same original ID', () => {
      const first = mapper.shortenUnit('unit-abc123');
      const second = mapper.shortenUnit('unit-abc123');
      expect(first).toBe(second);
    });

    it('should generate sequential IDs for different units', () => {
      const first = mapper.shortenUnit('unit-1');
      const second = mapper.shortenUnit('unit-2');
      const third = mapper.shortenUnit('unit-3');
      expect(first).toBe('u1');
      expect(second).toBe('u2');
      expect(third).toBe('u3');
    });
  });

  describe('shortenCard', () => {
    it('should shorten card IDs to c1, c2, ...', () => {
      const shortened = mapper.shortenCard('card-xyz789');
      expect(shortened).toBe('c1');
    });

    it('should return same short ID for same original ID', () => {
      const first = mapper.shortenCard('card-abc');
      const second = mapper.shortenCard('card-abc');
      expect(first).toBe(second);
    });

    it('should generate sequential IDs for different cards', () => {
      const first = mapper.shortenCard('card-1');
      const second = mapper.shortenCard('card-2');
      expect(first).toBe('c1');
      expect(second).toBe('c2');
    });
  });

  describe('restoreUnit', () => {
    it('should restore original unit ID from short ID', () => {
      const originalId = 'unit-abc123-def456';
      const shortId = mapper.shortenUnit(originalId);
      const restored = mapper.restoreUnit(shortId);
      expect(restored).toBe(originalId);
    });

    it('should return undefined for unknown short ID', () => {
      const restored = mapper.restoreUnit('u999');
      expect(restored).toBeUndefined();
    });
  });

  describe('restoreCard', () => {
    it('should restore original card ID from short ID', () => {
      const originalId = 'card-xyz789';
      const shortId = mapper.shortenCard(originalId);
      const restored = mapper.restoreCard(shortId);
      expect(restored).toBe(originalId);
    });

    it('should return undefined for unknown short ID', () => {
      const restored = mapper.restoreCard('c999');
      expect(restored).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear all mappings', () => {
      mapper.shortenUnit('unit-1');
      mapper.shortenCard('card-1');
      mapper.reset();

      // After reset, new IDs should start from 1 again
      expect(mapper.shortenUnit('unit-2')).toBe('u1');
      expect(mapper.shortenCard('card-2')).toBe('c1');
    });

    it('should not restore previously mapped IDs after reset', () => {
      const shortUnit = mapper.shortenUnit('unit-1');
      const shortCard = mapper.shortenCard('card-1');
      mapper.reset();

      expect(mapper.restoreUnit(shortUnit)).toBeUndefined();
      expect(mapper.restoreCard(shortCard)).toBeUndefined();
    });
  });

  describe('restore (generic)', () => {
    it('should restore unit ID when given u-prefixed short ID', () => {
      const originalId = 'unit-abc';
      const shortId = mapper.shortenUnit(originalId);
      const restored = mapper.restore(shortId);
      expect(restored).toBe(originalId);
    });

    it('should restore card ID when given c-prefixed short ID', () => {
      const originalId = 'card-xyz';
      const shortId = mapper.shortenCard(originalId);
      const restored = mapper.restore(shortId);
      expect(restored).toBe(originalId);
    });

    it('should return undefined for unknown prefix', () => {
      const restored = mapper.restore('x1');
      expect(restored).toBeUndefined();
    });
  });
});

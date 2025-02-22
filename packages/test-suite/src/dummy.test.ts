import { describe, it, expect, beforeEach } from 'vitest';
import { FastMemoryStore } from '../../keyc/src/stores/fast-memory.js';

describe('FastMemoryStore', () => {
  let store: FastMemoryStore;

  beforeEach(() => {
    store = new FastMemoryStore();
  });

  describe('get()', () => {
    it('should return undefined for non-existent keys', async () => {
      const value = await store.get('missing');
      expect(value).toBeUndefined();
    });

    it('should return stored value', async () => {
      await store.set('test', 'value');
      expect(await store.get('test')).toBe('value');
    });

    it('should return undefined for expired entries', async () => {
      await store.set('temp', 'data', 10);
      await new Promise(resolve => setTimeout(resolve, 15));
      expect(await store.get('temp')).toBeUndefined();
    });
  });

  describe('set()', () => {
    it('should store values without TTL', async () => {
      await store.set('persistent', 'data');
      expect(await store.get('persistent')).toBe('data');
    });

    it('should store values with TTL', async () => {
      await store.set('temp', 'data', 100);
      const value = await store.get('temp');
      expect(value).toBe('data');
    });
  });

  describe('delete()', () => {
    it('should remove existing entries', async () => {
      await store.set('test', 'value');
      expect(await store.delete('test')).toBe(true);
      expect(await store.get('test')).toBeUndefined();
    });

    it('should return false for non-existent keys', async () => {
      expect(await store.delete('missing')).toBe(false);
    });
  });

  describe('clear()', () => {
    it('should empty the store', async () => {
      await store.set('a', 1);
      await store.set('b', 2);
      await store.clear();
      expect(await store.has('a')).toBe(false);
      expect(await store.has('b')).toBe(false);
    });
  });

  describe('has()', () => {
    it('should return true for existing keys', async () => {
      await store.set('exists', true);
      expect(await store.has('exists')).toBe(true);
    });

    it('should return false for expired keys', async () => {
      await store.set('temp', true, 10);
      await new Promise(resolve => setTimeout(resolve, 15));
      expect(await store.has('temp')).toBe(false);
    });
  });

  describe('expiration', () => {
    it('should automatically clean expired entries on access', async () => {
      await store.set('a', 1, 10);
      await store.set('b', 2, 20);
      await new Promise(resolve => setTimeout(resolve, 15));
      
      // Access should trigger cleanup
      await store.get('a');
      
      expect(await store.has('a')).toBe(false);
      expect(await store.has('b')).toBe(true);
    });
  });
});

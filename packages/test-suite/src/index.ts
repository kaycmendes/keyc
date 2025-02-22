import { describe, it, expect, beforeEach } from 'vitest';
import { Keyc, FastMemoryStore, MiddlewareContext } from '@keyc/core';

// Add new test cases
//- Test FastMemoryStore
//- Test middleware pipeline
//- Test batch operations 

//- Test TTL handling
//- Test namespace handling
//- Test serialization
//- Test deserialization
//- Test middleware pipeline
//- Test batch operations 

describe('Keyc', () => {
  let keyc: Keyc<string>;

  beforeEach(() => {
    keyc = new Keyc({
      store: new FastMemoryStore()
    });
  });

  describe('Basic Operations', () => {
    it('should set and get a value', async () => {
      await keyc.set('test', 'value');
      expect(await keyc.get('test')).toBe('value');
    });

    it('should handle TTL', async () => {
      await keyc.set('test', 'value', 100);
      expect(await keyc.get('test')).toBe('value');
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(await keyc.get('test')).toBeUndefined();
    });
  });

  describe('Middleware', () => {
    it('should execute middleware', async () => {
      const operations: string[] = [];
      keyc.use(async (ctx: MiddlewareContext<string>, next: () => Promise<void>) => {
        operations.push('before');
        await next();
        operations.push('after');
      });

      await keyc.set('test', 'value');
      expect(operations).toEqual(['before', 'after']);
    });
  });
});

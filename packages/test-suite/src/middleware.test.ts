import { describe, it, expect } from 'vitest';
import { commonMiddleware } from '@keyc/core';

describe('Middleware Pipeline', () => {
  it('executes middleware in order', async () => {
    const order: string[] = [];
    const middleware1 = async (ctx, next) => {
      order.push('before1');
      await next();
      order.push('after1');
    };
    const middleware2 = async (ctx, next) => {
      order.push('before2');
      await next();
      order.push('after2');
    };

    // Create a simple pipeline runner
    let index = 0;
    const pipeline = [middleware1, middleware2];
    const runner = async (): Promise<void> => {
      if (index < pipeline.length) {
        await pipeline[index++]({ operation: 'set', key: 'test', value: 'dummy' }, runner);
      }
    };

    await runner();
    expect(order).toEqual(['before1', 'before2', 'after2', 'after1']);
  });

  it('throws an error on failed validation', async () => {
    const validatorMiddleware = commonMiddleware.validate<string>(value => value === 'valid');
    let error: any = null;
    try {
      await validatorMiddleware({ operation: 'set', key: 'test', value: 'invalid' }, async () => {});
    } catch (err) {
      error = err;
    }
    expect(error).not.toBeNull();
  });
}); 
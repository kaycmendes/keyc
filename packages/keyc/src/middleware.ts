import { Middleware, MiddlewareContext } from './types.js';

export const commonMiddleware = {
  logger<T>(): Middleware<T> {
    return async (context: MiddlewareContext<T>, next: () => Promise<void>): Promise<void> => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      console.log(`${context.operation} ${context.key} (${duration}ms)`);
    };
  },

  validate<T>(validator: (value: T) => boolean): Middleware<T> {
    return async (context: MiddlewareContext<T>, next: () => Promise<void>): Promise<void> => {
      if (context.operation === 'set' && !validator(context.value!)) {
        throw new Error('Validation failed');
      }
      await next();
    };
  },

  stats<T>(): Middleware<T> {
    const stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };

    return async (context: MiddlewareContext<T>, next: () => Promise<void>): Promise<void> => {
      await next();
      switch (context.operation) {
        case 'get':
          context.value ? stats.hits++ : stats.misses++;
          break;
        case 'set':
          stats.sets++;
          break;
        case 'delete':
          stats.deletes++;
          break;
      }
    };
  }
};
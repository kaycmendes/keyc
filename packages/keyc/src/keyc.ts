import { EventManager } from './event-manager.js';
import { KeyvStoreAdapter, KeycOptions, Middleware, MiddlewareContext } from './types.js';
import { FastMemoryStore } from './stores/fast-memory.js';

export class Keyc<T = any> extends EventManager {
  private store: KeyvStoreAdapter<T>;
  private namespace?: string;
  private ttl?: number;
  private middleware: Middleware<T>[] = [];
  private serialize: (value: T) => string;
  private deserialize: (value: string) => T;

  constructor(options: KeycOptions<T> = {}) {
    super();
    this.store = options.store || new FastMemoryStore<T>();
    this.namespace = options.namespace;
    this.ttl = options.ttl;
    this.serialize = options.serialize || JSON.stringify;
    this.deserialize = options.deserialize || JSON.parse;
  }

  use(fn: Middleware<T>): this {
    this.middleware.push(fn);
    return this;
  }

  async get(key: string): Promise<T | undefined> {
    const prefixedKey = this.getNamespacedKey(key);
    const context: MiddlewareContext<T> = {
      operation: 'get',
      key: prefixedKey
    };

    try {
      await this.executeMiddleware(context);
      const raw = await this.store.get(prefixedKey);
      if (!raw) return undefined;
      
      const value = this.deserialize(raw as string);
      context.value = value;
      return value;
    } catch (error) {
      this.emit('error', error as Error);
      return undefined;
    }
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const prefixedKey = this.getNamespacedKey(key);
    const context: MiddlewareContext<T> = {
      operation: 'set',
      key: prefixedKey,
      value,
      ttl: ttl ?? this.ttl
    };

    try {
      await this.executeMiddleware(context);
      const serialized = this.serialize(value);
      await this.store.set(prefixedKey, serialized as any, context.ttl);
      this.emit('set', { key, value });
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.getNamespacedKey(key);
    const context: MiddlewareContext<T> = {
      operation: 'delete',
      key: prefixedKey
    };

    try {
      await this.executeMiddleware(context);
      const result = await this.store.delete(prefixedKey);
      if (result) this.emit('delete', key);
      return result;
    } catch (error) {
      this.emit('error', error as Error);
      return false;
    }
  }

  async clear(): Promise<void> {
    const context: MiddlewareContext<T> = {
      operation: 'clear'
    };

    try {
      await this.executeMiddleware(context);
      await this.store.clear();
      this.emit('clear', undefined);
    } catch (error) {
      this.emit('error', error as Error);
    }
  }

  private async executeMiddleware(context: MiddlewareContext<T>): Promise<void> {
    let index = 0;
    const runner = async (): Promise<void> => {
      if (index < this.middleware.length) {
        await this.middleware[index++](context, runner);
      }
    };
    await runner();
  }

  private getNamespacedKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }
}
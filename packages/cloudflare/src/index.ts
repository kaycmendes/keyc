// Create new Cloudflare adapter
//- Implement KV namespace handling
//- Add edge-specific optimizations
//- Support TTL natively 

// New Cloudflare KV adapter

import { KeyvStoreAdapter } from '@keyc/core';

interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }>;
}

export class CloudflareKVAdapter<T = any> implements KeyvStoreAdapter<T> {
  constructor(private kv: KVNamespace) {}

  async get(key: string): Promise<T | undefined> {
    const value = await this.kv.get(key);
    if (!value) return undefined;
    return JSON.parse(value) as T;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    await this.kv.put(key, JSON.stringify(value), {
      expirationTtl: ttl ? Math.floor(ttl / 1000) : undefined
    });
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.kv.delete(key);
      return true;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    const list = await this.kv.list();
    await Promise.all(list.keys.map(k => this.kv.delete(k.name)));
  }

  async has(key: string): Promise<boolean> {
    const value = await this.kv.get(key);
    return value !== null;
  }

  // Batch operations
  async getMany(keys: string[]): Promise<Array<T | undefined>> {
    return Promise.all(keys.map(key => this.get(key)));
  }

  async setMany(entries: Array<[string, T, number?]>): Promise<void> {
    await Promise.all(
      entries.map(([key, value, ttl]) => this.set(key, value, ttl))
    );
  }
}


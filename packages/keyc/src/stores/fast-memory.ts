import { KeyvStoreAdapter } from '../types.js';

interface StoredValue<T> {
  value: T;
  expires?: number;
}

export class FastMemoryStore<T = any> implements KeyvStoreAdapter<T> {
  private data: Record<string, StoredValue<T>> = {};
  private expiries: [string, number][] = [];

  async get(key: string): Promise<T | undefined> {
    this.clean();
    const entry = this.data[key];
    if (!entry || (entry.expires && entry.expires < Date.now())) {
      delete this.data[key];
      return undefined;
    }
    return entry.value;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    this.data[key] = {
      value,
      expires: ttl ? Date.now() + ttl : undefined
    };
    if (ttl) {
      this.expiries.push([key, this.data[key].expires!]);
      this.sortExpiries();
    }
  }

  async delete(key: string): Promise<boolean> {
    const existed = key in this.data;
    delete this.data[key];
    this.expiries = this.expiries.filter(([k]) => k !== key);
    return existed;
  }

  async clear(): Promise<void> {
    this.data = {};
    this.expiries = [];
  }

  async has(key: string): Promise<boolean> {
    this.clean();
    const entry = this.data[key];
    return !!entry && (!entry.expires || entry.expires > Date.now());
  }

  private clean(): void {
    const now = Date.now();
    while (this.expiries.length && this.expiries[0][1] <= now) {
      const [key] = this.expiries.shift()!;
      delete this.data[key];
    }
  }

  private sortExpiries(): void {
    this.expiries.sort((a, b) => a[1] - b[1]);
  }
} 
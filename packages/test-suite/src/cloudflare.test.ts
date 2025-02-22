import { describe, it, expect } from 'vitest';
import { CloudflareKVAdapter } from '@keyc/cloudflare';

// Create a simple mock KV Namespace
class MockKVNamespace {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
    this.store.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async list(options?: { prefix?: string }): Promise<{ keys: Array<{ name: string }> }> {
    const keys = Array.from(this.store.keys()).map(k => ({ name: k }));
    return { keys };
  }
}

describe('CloudflareKVAdapter', () => {
  const mockKV = new MockKVNamespace();
  const adapter = new CloudflareKVAdapter(mockKV);

  it('should set and get a value', async () => {
    await adapter.set('testKey', 'value');
    const result = await adapter.get('testKey');
    expect(result).toBe('value');
  });

  it('should delete a key correctly', async () => {
    await adapter.set('delKey', 'toDelete');
    const delResult = await adapter.delete('delKey');
    expect(delResult).toBe(true);
    const result = await adapter.get('delKey');
    expect(result).toBeUndefined();
  });

  it('should support batch operations', async () => {
    const entries: Array<[string, string, number?]> = [
      ['k1', 'v1', 1000],
      ['k2', 'v2']
    ];
    await adapter.setMany(entries);
    const values = await adapter.getMany(['k1', 'k2', 'k3']);
    expect(values).toEqual(['v1', 'v2', undefined]);
  });
}); 
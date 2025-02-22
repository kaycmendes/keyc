import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SQLiteAdapter } from '@keyc/sqlite';

let sqliteAdapter: SQLiteAdapter;

describe('SQLiteAdapter', () => {
  beforeAll(() => {
    sqliteAdapter = new SQLiteAdapter(':memory:');
  });

  afterAll(async () => {
    await sqliteAdapter.close();
  });

  it('sets and gets values correctly', async () => {
    await sqliteAdapter.set('key', 'value');
    const result = await sqliteAdapter.get('key');
    expect(result).toBe('value');
  });

  it('deletes a key correctly', async () => {
    await sqliteAdapter.set('key2', 'value2');
    const delResult = await sqliteAdapter.delete('key2');
    expect(delResult).toBe(true);
    const result = await sqliteAdapter.get('key2');
    expect(result).toBeUndefined();
  });
}); 
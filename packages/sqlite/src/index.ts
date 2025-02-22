import pkg from 'sqlite3';
const { Database } = pkg;
import type { Database as DatabaseType } from 'sqlite3';
import { KeyvStoreAdapter } from '@keyc/core';

export class SQLiteAdapter<T = any> implements KeyvStoreAdapter<T> {
  private db: DatabaseType;
  
  constructor(filename: string = ':memory:') {
    this.db = new Database(filename);
    this.init().catch(console.error);
  }

  private async init() {
    await this.exec(`
      CREATE TABLE IF NOT EXISTS keyc (
        key TEXT PRIMARY KEY,
        value TEXT,
        expires INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_expires ON keyc(expires);
    `);
  }

  private exec(sql: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async get(key: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT value FROM keyc WHERE key = ? AND (expires IS NULL OR expires > ?)',
        [key, Date.now()],
        (err, row: any) => {
          if (err) reject(err);
          else resolve(row ? JSON.parse(row.value) : undefined);
        }
      );
    });
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    const expires = ttl ? Date.now() + ttl : null;
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT OR REPLACE INTO keyc (key, value, expires) VALUES (?, ?, ?)',
        [key, JSON.stringify(value), expires],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async delete(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run('DELETE FROM keyc WHERE key = ?', [key], function(err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  }

  async clear(): Promise<void> {
    return this.exec('DELETE FROM keyc');
  }

  async has(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT 1 FROM keyc WHERE key = ? AND (expires IS NULL OR expires > ?)',
        [key, Date.now()],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
} 
import { Database } from 'sqlite3';
export class SQLiteAdapter {
    constructor(filename = ':memory:') {
        this.db = new Database(filename);
        this.init().catch(console.error);
    }
    async init() {
        await this.exec(`
      CREATE TABLE IF NOT EXISTS keyc (
        key TEXT PRIMARY KEY,
        value TEXT,
        expires INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_expires ON keyc(expires);
    `);
    }
    exec(sql) {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async get(key) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT value FROM keyc WHERE key = ? AND (expires IS NULL OR expires > ?)', [key, Date.now()], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row ? JSON.parse(row.value) : undefined);
            });
        });
    }
    async set(key, value, ttl) {
        const expires = ttl ? Date.now() + ttl : null;
        return new Promise((resolve, reject) => {
            this.db.run('INSERT OR REPLACE INTO keyc (key, value, expires) VALUES (?, ?, ?)', [key, JSON.stringify(value), expires], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async delete(key) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM keyc WHERE key = ?', [key], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.changes > 0);
            });
        });
    }
    async clear() {
        return this.exec('DELETE FROM keyc');
    }
    async has(key) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT 1 FROM keyc WHERE key = ? AND (expires IS NULL OR expires > ?)', [key, Date.now()], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(!!row);
            });
        });
    }
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}

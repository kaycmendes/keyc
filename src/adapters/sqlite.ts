/**
 * SQLite adapter for Keyc
 * Enables using SQLite as a storage backend
 */
export class SQLiteAdapter {
  private db: any;
  private namespace: string;
  private tableName: string;
  
  /**
   * Create a new SQLite adapter
   * @param path Path to SQLite database file
   * @param options Adapter options
   */
  constructor(path: string, options: SQLiteOptions = {}) {
    // Lazy load SQLite to avoid requiring it when not used
    const sqlite3 = require('sqlite3');
    
    this.namespace = options.namespace || 'keyc';
    this.tableName = `keyc_${this.namespace}`;
    
    // Connect to database
    this.db = new sqlite3.Database(path);
    
    // Create table if it doesn't exist
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          key TEXT PRIMARY KEY,
          value TEXT,
          expires INTEGER
        )
      `);
      
      // Create index on expires for faster cleanup
      this.db.run(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_expires 
        ON ${this.tableName} (expires)
      `);
    });
    
    // Set up periodic cleanup of expired keys
    if (options.cleanupInterval) {
      setInterval(() => this.cleanupExpired(), options.cleanupInterval);
    }
  }
  
  /**
   * Get a value from SQLite
   * @param key The key to get
   * @returns Promise resolving to the value or undefined
   */
  async get(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT value, expires FROM ${this.tableName} WHERE key = ?`,
        [key],
        (err: Error | null, row: any) => {
          if (err) {
            return resolve(undefined);
          }
          
          if (!row) {
            return resolve(undefined);
          }
          
          // Check if expired
          if (row.expires && row.expires < Date.now()) {
            // Delete expired key
            this.delete(key).catch(() => {});
            return resolve(undefined);
          }
          
          try {
            // Parse the stored JSON value
            resolve(JSON.parse(row.value));
          } catch (err) {
            resolve(undefined);
          }
        }
      );
    });
  }
  
  /**
   * Set a value in SQLite
   * @param key The key to set
   * @param value The value to set
   * @param options Options including expiration
   * @returns Promise resolving to success status
   */
  async set(key: string, value: any, options: { expires?: number } = {}): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const expires = options.expires ? options.expires : null;
      const serializedValue = JSON.stringify(value);
      
      this.db.run(
        `INSERT OR REPLACE INTO ${this.tableName} (key, value, expires) VALUES (?, ?, ?)`,
        [key, serializedValue, expires],
        (err: Error | null) => {
          if (err) {
            return resolve(false);
          }
          resolve(true);
        }
      );
    });
  }
  
  /**
   * Delete a key from SQLite
   * @param key The key to delete
   * @returns Promise resolving to success status
   */
  async delete(key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM ${this.tableName} WHERE key = ?`,
        [key],
        (err: Error | null, result?: any) => {
          if (err) {
            return resolve(false);
          }
          
          const changes = this.db.changes ? this.db.changes() : 1;
          resolve(changes > 0);
        }
      );
    });
  }
  
  /**
   * Clear all keys in the namespace
   * @returns Promise resolving when clear is complete
   */
  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM ${this.tableName}`,
        (err: Error | null) => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });
  }
  
  /**
   * Clean up expired keys
   * @returns Promise resolving when cleanup is complete
   */
  private async cleanupExpired(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM ${this.tableName} WHERE expires < ? AND expires IS NOT NULL`,
        [Date.now()],
        (err: Error | null) => {
          if (err) {
            return reject(err);
          }
          resolve();
        }
      );
    });
  }
  
  /**
   * Disconnect from SQLite
   * @returns Promise resolving when disconnection is complete
   */
  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err: Error | null) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
  
  /**
   * Iterate through all keys in the namespace
   * @returns AsyncIterator for key-value pairs
   */
  async *iterator(): AsyncIterableIterator<[string, any]> {
    const rows = await new Promise<any[]>((resolve, reject) => {
      this.db.all(
        `SELECT key, value FROM ${this.tableName} WHERE expires IS NULL OR expires > ?`,
        [Date.now()],
        (err: Error | null, rows: any[]) => {
          if (err) {
            return resolve([]);
          }
          resolve(rows);
        }
      );
    });
    
    for (const row of rows) {
      try {
        const value = JSON.parse(row.value);
        yield [row.key, value];
      } catch (err) {
        // Skip items that can't be parsed
      }
    }
  }
}

/**
 * Options for SQLite adapter
 */
interface SQLiteOptions {
  /**
   * Namespace for keys
   */
  namespace?: string;
  
  /**
   * Interval in ms to clean up expired keys
   */
  cleanupInterval?: number;
}

export default SQLiteAdapter; 
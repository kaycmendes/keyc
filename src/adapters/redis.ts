/**
 * Redis adapter for Keyc
 * Enables using Redis as a storage backend
 */
export class RedisAdapter {
  /**
   * Create a new Redis adapter
   * @param client Redis client instance
   * @param options Adapter options
   */
  constructor(
    private client: any, 
    private options: RedisAdapterOptions = {}
  ) {}
  
  /**
   * Get a value from Redis
   * @param key The key to get
   * @returns Promise resolving to the value or undefined
   */
  async get(key: string): Promise<any> {
    try {
      const value = await this.client.get(key);
      if (value === null) {
        return undefined;
      }
      return value;
    } catch (error) {
      return undefined;
    }
  }
  
  /**
   * Set a value in Redis
   * @param key The key to set
   * @param value The value to set
   * @param options Options including expiration
   * @returns Promise resolving to success status
   */
  async set(key: string, value: any, options: { expires?: number } = {}): Promise<boolean> {
    try {
      if (options.expires) {
        // Convert to seconds for Redis
        const ttlSeconds = Math.ceil((options.expires - Date.now()) / 1000);
        await this.client.set(key, value, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Delete a key from Redis
   * @param key The key to delete
   * @returns Promise resolving to success status
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Clear all keys with a specific pattern
   * @param pattern The pattern to match keys (defaults to *)
   * @returns Promise resolving when clear is complete
   */
  async clear(pattern?: string): Promise<void> {
    try {
      // Use SCAN for safe iteration over large datasets
      let cursor = '0';
      const prefix = pattern || '*';
      
      do {
        // SCAN to get a batch of keys
        const [nextCursor, keys] = await this.client.scan(
          cursor, 
          'MATCH', 
          prefix, 
          'COUNT', 
          1000
        );
        
        cursor = nextCursor;
        
        // Delete found keys if any
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
        
      } while (cursor !== '0');
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Disconnect from Redis
   * @returns Promise resolving when disconnection is complete
   */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (error) {
      // Ignore errors on disconnect
    }
  }
  
  /**
   * Iterate through keys with a specific pattern
   * @param pattern The pattern to match keys (defaults to *)
   * @returns AsyncIterator for key-value pairs
   */
  async *iterator(pattern?: string): AsyncIterableIterator<[string, any]> {
    const prefix = pattern || '*';
    let cursor = '0';
    
    try {
      do {
        // SCAN to get a batch of keys
        const [nextCursor, keys] = await this.client.scan(
          cursor, 
          'MATCH', 
          prefix, 
          'COUNT', 
          100
        );
        
        cursor = nextCursor;
        
        // Get values for keys
        for (const key of keys) {
          const value = await this.client.get(key);
          if (value !== null) {
            yield [key, value];
          }
        }
        
      } while (cursor !== '0');
    } catch (error) {
      // Handle errors and stop iteration
    }
  }
}

/**
 * Options for Redis adapter
 */
interface RedisAdapterOptions {
  /**
   * Max reconnection attempts
   */
  reconnectAttempts?: number;
  
  /**
   * Key prefix for all operations
   */
  keyPrefix?: string;
}

export default RedisAdapter; 
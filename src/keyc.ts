import { EventEmitter } from 'events';
import { Compressor } from './compressors/base';
import { Middleware, MiddlewarePipeline } from './middleware';

/**
 * Keyc - Next Generation Key-Value Storage
 * TypeScript-first with middleware, compression, and edge computing support
 */
export class Keyc<ValueType = any> extends EventEmitter {
  private store: Map<string, any> | any;
  private namespace?: string;
  private ttl?: number;
  private middlewarePipeline: MiddlewarePipeline;
  private serializer: (value: any) => string | Buffer;
  private deserializer: (value: string | Buffer) => any;
  private compressor?: Compressor;
  private useKeyPrefix: boolean = true;
  
  constructor(options: KeycOptions = {}) {
    super();
    
    // Initialize properties
    this.namespace = options.namespace ?? 'keyc';
    this.ttl = options.ttl;
    this.store = options.store ?? new Map();
    this.serializer = options.serializer ?? JSON.stringify;
    this.deserializer = options.deserializer ?? ((value: string | Buffer) => {
      if (Buffer.isBuffer(value)) {
        return JSON.parse(value.toString());
      }
      return JSON.parse(value);
    });
    this.compressor = options.compressor;
    this.useKeyPrefix = options.useKeyPrefix !== false;
    
    // Initialize middleware pipeline
    this.middlewarePipeline = new MiddlewarePipeline();
    
    // Register default middlewares if provided
    if (options.middlewares) {
      options.middlewares.forEach(middleware => 
        this.use(middleware));
    }
    
    // Setup error handling
    if (options.emitErrors !== false) {
      // Handle store connection errors
      if (typeof this.store.on === 'function') {
        this.store.on('error', (err: Error) => this.emit('error', err));
      }
    }
  }
  
  /**
   * Get a value from the store
   * @param key The key to get
   * @param options Options for the get operation
   * @returns Promise resolving to the value
   */
  async get<T = ValueType>(key: string, options: GetOptions = {}): Promise<T | undefined> {
    // Process through middleware pipeline
    const processedKey = await this.middlewarePipeline.runPreGet(key);
    const namespacedKey = this.getNamespacedKey(processedKey);
    
    try {
      // Get from store
      let data = await this.store.get(namespacedKey);
      
      // Return undefined if not found
      if (data === undefined || data === null) {
        return await this.middlewarePipeline.runPostGet(key, undefined) as T | undefined;
      }
      
      // Return raw data if requested
      if (options.raw) {
        return await this.middlewarePipeline.runPostGet(key, data) as T | undefined;
      }
      
      // Parse stored data (if it's a string or Buffer)
      if (typeof data === 'string' || Buffer.isBuffer(data)) {
        data = this.deserializer(data);
      }
      
      // Check if data has expiry information
      if (data && typeof data === 'object' && 'value' in data) {
        // Check for expiration
        if (data.expires && typeof data.expires === 'number') {
          // Check if data is expired
          if (Date.now() > data.expires) {
            // Delete expired data
            this.delete(key).catch(err => this.emit('error', err));
            return await this.middlewarePipeline.runPostGet(key, undefined) as T | undefined;
          }
        }
        
        // Get the value from the wrapper object
        let value = data.value;
        
        // Decompress if compressor is available
        if (this.compressor && data.compressed) {
          try {
            value = await this.compressor.decompress(value);
          } catch (err) {
            this.emit('error', err);
            // If decompression fails, return undefined
            return await this.middlewarePipeline.runPostGet(key, undefined) as T | undefined;
          }
        }
        
        // Process through middleware pipeline and return just the value
        return await this.middlewarePipeline.runPostGet(key, value) as T | undefined;
      }
      
      // If data doesn't have the expected structure, return it as is
      return await this.middlewarePipeline.runPostGet(key, data) as T | undefined;
      
    } catch (err) {
      this.emit('error', err);
      return await this.middlewarePipeline.runPostGet(key, undefined) as T | undefined;
    }
  }
  
  /**
   * Set a value in the store
   * @param key The key to set
   * @param value The value to set
   * @param ttl Time-to-live in milliseconds
   * @returns Promise resolving to success status
   */
  async set<T = ValueType>(key: string, value: T, ttl?: number): Promise<boolean> {
    // Process through middleware pipeline
    const { modifiedKey, modifiedValue } = await this.middlewarePipeline.runPreSet(key, value);
    const namespacedKey = this.getNamespacedKey(modifiedKey);
    
    try {
      // Use provided TTL or instance default
      const expiryTtl = ttl ?? this.ttl;
      
      // Create storage object
      const storageObject: any = { value: modifiedValue };
      
      // Add expiry if TTL is provided
      if (expiryTtl !== undefined) {
        storageObject.expires = Date.now() + expiryTtl;
      }
      
      // Compress value if compressor is available
      if (this.compressor) {
        try {
          storageObject.value = await this.compressor.compress(modifiedValue);
          storageObject.compressed = true;
        } catch (err) {
          this.emit('error', err);
          return false;
        }
      }
      
      // Serialize if needed
      const serializedValue = this.serializer(storageObject);
      
      // Set in store
      const result = await this.store.set(
        namespacedKey, 
        serializedValue,
        expiryTtl !== undefined ? { expires: Date.now() + expiryTtl } : undefined
      );
      
      // Emit event
      this.emit('set', key, value);
      
      // Process through middleware pipeline
      await this.middlewarePipeline.runPostSet(key, value);
      
      return result === undefined ? true : !!result;
    } catch (err) {
      this.emit('error', err);
      return false;
    }
  }
  
  /**
   * Delete a key from the store
   * @param key The key to delete
   * @returns Promise resolving to success status
   */
  async delete(key: string): Promise<boolean> {
    // Process through middleware pipeline
    const processedKey = await this.middlewarePipeline.runPreDelete(key);
    const namespacedKey = this.getNamespacedKey(processedKey);
    
    try {
      // Delete from store
      const result = await this.store.delete(namespacedKey);
      
      // Emit event
      this.emit('delete', key);
      
      // Process through middleware pipeline
      await this.middlewarePipeline.runPostDelete(key, !!result);
      
      return result === undefined ? true : !!result;
    } catch (err) {
      this.emit('error', err);
      return false;
    }
  }
  
  /**
   * Clear all keys in the namespace
   * @returns Promise resolving when clear is complete
   */
  async clear(): Promise<void> {
    try {
      // If store has clear method, use it with namespace
      if (typeof this.store.clear === 'function') {
        await this.store.clear(this.namespace);
      } 
      // Otherwise iterate and delete keys
      else if (typeof this.store[Symbol.iterator] === 'function') {
        for (const [key] of this.store) {
          if (this.namespace && key.startsWith(`${this.namespace}:`)) {
            await this.store.delete(key);
          } else if (!this.namespace) {
            await this.store.delete(key);
          }
        }
      }
      else if (typeof this.store.iterator === 'function') {
        for await (const [key] of this.store.iterator()) {
          if (this.namespace && key.startsWith(`${this.namespace}:`)) {
            await this.store.delete(key);
          } else if (!this.namespace) {
            await this.store.delete(key);
          }
        }
      }
      
      // Emit event
      this.emit('clear');
      
      return;
    } catch (err) {
      this.emit('error', err);
      throw err;
    }
  }
  
  /**
   * Get multiple values from the store
   * @param keys Array of keys to get
   * @returns Promise resolving to array of values
   */
  async getMany<T = ValueType>(keys: string[]): Promise<(T | undefined)[]> {
    try {
      // Use Promise.all for parallel execution
      return await Promise.all(
        keys.map(key => this.get<T>(key))
      );
    } catch (err) {
      this.emit('error', err);
      return keys.map(() => undefined);
    }
  }
  
  /**
   * Set multiple values in the store
   * @param entries Array of key-value pairs to set
   * @param ttl Time-to-live in milliseconds
   * @returns Promise resolving to success status
   */
  async setMany<T = ValueType>(entries: [string, T][], ttl?: number): Promise<boolean> {
    try {
      // Use Promise.all for parallel execution
      const results = await Promise.all(
        entries.map(([key, value]) => this.set<T>(key, value, ttl))
      );
      
      // Return true only if all operations succeeded
      return results.every(result => result === true);
    } catch (err) {
      this.emit('error', err);
      return false;
    }
  }
  
  /**
   * Increment a numeric value by delta (default: 1)
   * @param key The key to increment
   * @param delta The amount to increment by
   * @returns Promise resolving to the new value or false on failure
   */
  async increment(key: string, delta: number = 1): Promise<number | false> {
    try {
      // Get current value
      const value = await this.get<number>(key);
      
      // Initialize to delta if not found
      if (value === undefined) {
        const success = await this.set<number>(key, delta);
        return success ? delta : false;
      }
      
      // Check if value is a number
      if (typeof value !== 'number') {
        this.emit('error', new Error(`Cannot increment non-numeric value at key: ${key}`));
        return false;
      }
      
      // Increment and store new value
      const newValue = value + delta;
      const success = await this.set<number>(key, newValue);
      
      return success ? newValue : false;
    } catch (err) {
      this.emit('error', err);
      return false;
    }
  }
  
  /**
   * Add middleware to the pipeline
   * @param middleware The middleware to add
   * @returns This instance for chaining
   */
  use(middleware: Middleware): Keyc<ValueType> {
    this.middlewarePipeline.add(middleware);
    return this;
  }
  
  /**
   * Iterate through all keys in the namespace
   * @returns Async iterator for key-value pairs
   */
  async *iterator(): AsyncIterableIterator<[string, any]> {
    // Skip if store doesn't support iteration
    if (typeof this.store[Symbol.iterator] !== 'function' && 
        typeof this.store.iterator !== 'function') {
      return;
    }
    
    try {
      // Use store's iterator if available
      if (typeof this.store.iterator === 'function') {
        for await (const [key, value] of this.store.iterator()) {
          // Only yield keys in the current namespace
          if (this.namespace && key.startsWith(`${this.namespace}:`)) {
            // Remove namespace prefix
            const unPrefixedKey = key.substring(this.namespace.length + 1);
            yield [unPrefixedKey, value];
          } else if (!this.namespace) {
            yield [key, value];
          }
        }
      } else {
        for (const [key, value] of this.store) {
          // Only yield keys in the current namespace
          if (this.namespace && key.startsWith(`${this.namespace}:`)) {
            // Remove namespace prefix
            const unPrefixedKey = key.substring(this.namespace.length + 1);
            yield [unPrefixedKey, value];
          } else if (!this.namespace) {
            yield [key, value];
          }
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
  }
  
  /**
   * Get the namespaced key
   * @param key The original key
   * @returns The namespaced key
   */
  private getNamespacedKey(key: string): string {
    return this.namespace && this.useKeyPrefix ? `${this.namespace}:${key}` : key;
  }
  
  /**
   * Disconnect from the store
   * @returns Promise resolving when disconnection is complete
   */
  async disconnect(): Promise<void> {
    if (typeof this.store.disconnect === 'function') {
      await this.store.disconnect();
    }
    this.emit('disconnect');
  }
}

/**
 * Options for Keyc constructor
 */
export interface KeycOptions {
  namespace?: string;
  ttl?: number;
  store?: any;
  serializer?: (value: any) => string | Buffer;
  deserializer?: (value: string | Buffer) => any;
  compressor?: Compressor;
  emitErrors?: boolean;
  middlewares?: Middleware[];
  useKeyPrefix?: boolean;
}

/**
 * Options for get operations
 */
export interface GetOptions {
  raw?: boolean;
}

export default Keyc; 
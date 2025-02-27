import { EventEmitter } from 'events';
import { Compressor } from './compressors/base';
import { Middleware, MiddlewarePipeline } from './middleware';

// Enhanced TypeScript generic interface
export class Keyc<ValueType = any> extends EventEmitter {
  private store: Map<string, any> | any;
  private namespace?: string;
  private ttl?: number;
  private middlewarePipeline: MiddlewarePipeline;
  private serializer: (value: any) => string | Buffer;
  private deserializer: (value: string | Buffer) => any;
  private compressor?: Compressor;
  
  constructor(options: KeycOptions = {}) {
    super();
    
    // Initialize properties
    this.namespace = options.namespace ?? 'keyc';
    this.ttl = options.ttl;
    this.store = options.store ?? new Map();
    this.serializer = options.serializer ?? JSON.stringify;
    this.deserializer = options.deserializer ?? JSON.parse;
    this.compressor = options.compressor;
    
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
        return await this.middlewarePipeline.runPostGet(key, undefined);
      }
      
      // Return raw data if requested
      if (options.raw) {
        return await this.middlewarePipeline.runPostGet(key, data);
      }
      
      // Parse stored data (if it's an object with value and expiry)
      if (typeof data === 'string' || Buffer.isBuffer(data)) {
        data = this.deserializer(data);
      }
      
      // Check if data has expiry information
      if (data && data.expires && typeof data.expires === 'number') {
        // Check if data is expired
        if (Date.now() > data.expires) {
          // Delete expired data
          this.delete(key).catch(err => this.emit('error', err));
          return await this.middlewarePipeline.runPostGet(key, undefined);
        }
        
        // Return value
        let value = data.value;
        
        // Decompress if compressor is available
        if (this.compressor && value) {
          try {
            value = await this.compressor.decompress(value);
          } catch (err) {
            this.emit('error', err);
            // If decompression fails, return undefined
            return await this.middlewarePipeline.runPostGet(key, undefined);
          }
        }
        
        // Process through middleware pipeline and return
        return await this.middlewarePipeline.runPostGet(key, value);
      }
      
      // If data doesn't have expiry, return as is
      let value = data;
      
      // Decompress if compressor is available
      if (this.compressor && value) {
        try {
          value = await this.compressor.decompress(value);
        } catch (err) {
          this.emit('error', err);
          return await this.middlewarePipeline.runPostGet(key, undefined);
        }
      }
      
      // Process through middleware pipeline and return
      return await this.middlewarePipeline.runPostGet(key, value);
      
    } catch (err) {
      this.emit('error', err);
      return await this.middlewarePipeline.runPostGet(key, undefined);
    }
  }
  
  /**
   * Set a value in the store
   */
  async set<T = ValueType>(key: string, value: T, ttl?: number): Promise<boolean> {
    // Process through middleware pipeline
    const { modifiedKey, modifiedValue } = await this.middlewarePipeline.runPreSet(key, value);
    const namespacedKey = this.getNamespacedKey(modifiedKey);
    
    try {
      // Use provided TTL or instance default
      const expiryTtl = ttl ?? this.ttl;
      
      // Compress value if compressor is available
      let processedValue = modifiedValue;
      if (this.compressor && processedValue !== undefined) {
        try {
          processedValue = await this.compressor.compress(processedValue);
        } catch (err) {
          this.emit('error', err);
          return false;
        }
      }
      
      // Create storage object with expiry (if TTL is provided)
      let storageValue;
      if (expiryTtl !== undefined) {
        storageValue = {
          value: processedValue,
          expires: Date.now() + expiryTtl
        };
      } else {
        storageValue = processedValue;
      }
      
      // Serialize if needed
      let serializedValue = 
        typeof storageValue === 'object' && !Buffer.isBuffer(storageValue)
          ? this.serializer(storageValue)
          : storageValue;
      
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
      
      return result === undefined ? true : result;
    } catch (err) {
      this.emit('error', err);
      return false;
    }
  }
  
  /**
   * Delete a key from the store
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
      await this.middlewarePipeline.runPostDelete(key, result);
      
      return result === undefined ? true : result;
    } catch (err) {
      this.emit('error', err);
      return false;
    }
  }
  
  /**
   * Clear all keys in the namespace
   */
  async clear(): Promise<void> {
    try {
      // If store has clear method, use it with namespace
      if (typeof this.store.clear === 'function') {
        await this.store.clear(this.namespace);
      } 
      // Otherwise iterate and delete keys
      else if (typeof this.store.delete === 'function' && typeof this.store[Symbol.iterator] === 'function') {
        for (const [key] of this.store) {
          if (this.namespace) {
            if (key.startsWith(`${this.namespace}:`)) {
              await this.store.delete(key);
            }
          } else {
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
   */
  async getMany<T = ValueType>(keys: string[]): Promise<(T | undefined)[]> {
    // Use Promise.all for parallel execution
    return Promise.all(keys.map(key => this.get<T>(key)));
  }
  
  /**
   * Set multiple values in the store
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
   */
  use(middleware: Middleware): Keyc<ValueType> {
    this.middlewarePipeline.add(middleware);
    return this;
  }
  
  /**
   * Iterate through all keys in the namespace
   */
  async *iterator(): AsyncIterableIterator<[string, any]> {
    // Skip if store doesn't support iteration
    if (typeof this.store[Symbol.iterator] !== 'function' && 
        typeof this.store.iterator !== 'function') {
      return;
    }
    
    try {
      // Use store's iterator if available
      const iterator = typeof this.store.iterator === 'function' 
        ? this.store.iterator() 
        : this.store[Symbol.iterator]();
      
      for await (const [key, value] of iterator) {
        // Only yield keys in the current namespace
        if (this.namespace) {
          if (key.startsWith(`${this.namespace}:`)) {
            // Remove namespace prefix
            const unPrefixedKey = key.substring(this.namespace.length + 1);
            yield [unPrefixedKey, value];
          }
        } else {
          yield [key, value];
        }
      }
    } catch (err) {
      this.emit('error', err);
    }
  }
  
  /**
   * Get the namespaced key
   */
  private getNamespacedKey(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key;
  }
  
  /**
   * Disconnect from the store
   */
  async disconnect(): Promise<void> {
    if (typeof this.store.disconnect === 'function') {
      await this.store.disconnect();
    }
    this.emit('disconnect');
  }
}

// Type definitions
interface KeycOptions {
  namespace?: string;
  ttl?: number;
  store?: any;
  serializer?: (value: any) => string | Buffer;
  deserializer?: (value: string | Buffer) => any;
  compressor?: Compressor;
  emitErrors?: boolean;
  middlewares?: Middleware[];
}

interface GetOptions {
  raw?: boolean;
}

export default Keyc; 
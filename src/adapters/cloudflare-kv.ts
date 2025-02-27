/**
 * Cloudflare KV adapter for Keyc
 * Enables using Cloudflare KV as a storage backend
 */
export class CloudflareKVAdapter {
  /**
   * Create a new Cloudflare KV adapter
   * @param namespace Cloudflare KV namespace
   * @param options Adapter options
   */
  constructor(
    private namespace: any, // Changed from KVNamespace to any to avoid type errors
    private options: CloudflareKVOptions = {}
  ) {}
  
  /**
   * Get a value from Cloudflare KV
   * @param key The key to get
   * @returns Promise resolving to the value
   */
  async get(key: string): Promise<any> {
    try {
      const value = await this.namespace.get(key, { type: 'json' });
      return value;
    } catch (error) {
      return undefined;
    }
  }
  
  /**
   * Set a value in Cloudflare KV
   * @param key The key to set
   * @param value The value to set
   * @param options Options including expiration
   * @returns Promise resolving to success status
   */
  async set(key: string, value: any, options: { expires?: number } = {}): Promise<boolean> {
    try {
      const kvOptions: any = {}; // Changed from KVNamespacePutOptions to any
      
      if (options.expires) {
        kvOptions.expirationTtl = Math.ceil((options.expires - Date.now()) / 1000);
      }
      
      await this.namespace.put(key, JSON.stringify(value), kvOptions);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Delete a key from Cloudflare KV
   * @param key The key to delete
   * @returns Promise resolving to success status
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.namespace.delete(key);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Clear all keys in the namespace
   * @returns Promise resolving when clear is complete
   */
  async clear(): Promise<void> {
    try {
      // Cloudflare KV doesn't have a native clear operation
      // We need to list and delete keys in batches
      let cursor: string | undefined;
      
      do {
        const { keys, list_complete, cursor: nextCursor } = 
          await this.namespace.list({ cursor });
          
        // Fixed the 'any' type issue for key parameter
        await Promise.all(keys.map((key: any) => this.namespace.delete(key.name)));
        
        cursor = list_complete ? undefined : nextCursor;
      } while (cursor);
      
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Options for Cloudflare KV adapter
 */
interface CloudflareKVOptions {
  // Cloud-specific options can go here
}

/**
 * Type definition for KV namespace operations
 */
interface KVNamespacePutOptions {
  expiration?: number;
  expirationTtl?: number;
  metadata?: any;
}

export default CloudflareKVAdapter;

// This adapter would be used in a Cloudflare Workers environment
// where KVNamespace is available globally 
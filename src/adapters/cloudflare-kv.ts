export class CloudflareKVAdapter {
  constructor(private namespace: KVNamespace, private options: CloudflareKVOptions = {}) {}
  
  async get(key: string): Promise<any> {
    try {
      const value = await this.namespace.get(key, { type: 'json' });
      return value;
    } catch (error) {
      return undefined;
    }
  }
  
  async set(key: string, value: any, options: { expires?: number } = {}): Promise<boolean> {
    try {
      const kvOptions: KVNamespacePutOptions = {};
      
      if (options.expires) {
        kvOptions.expirationTtl = Math.ceil((options.expires - Date.now()) / 1000);
      }
      
      await this.namespace.put(key, JSON.stringify(value), kvOptions);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async delete(key: string): Promise<boolean> {
    try {
      await this.namespace.delete(key);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async clear(): Promise<void> {
    try {
      // Cloudflare KV doesn't have a native clear operation
      // We need to list and delete keys in batches
      let cursor: string | undefined;
      
      do {
        const { keys, list_complete, cursor: nextCursor } = 
          await this.namespace.list({ cursor });
          
        await Promise.all(keys.map(key => this.namespace.delete(key.name)));
        
        cursor = list_complete ? undefined : nextCursor;
      } while (cursor);
      
    } catch (error) {
      throw error;
    }
  }
}

interface CloudflareKVOptions {
  // Cloud-specific options can go here
}

// This adapter would be used in a Cloudflare Workers environment
// where KVNamespace is available globally 
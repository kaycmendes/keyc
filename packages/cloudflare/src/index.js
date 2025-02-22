// Create new Cloudflare adapter
//- Implement KV namespace handling
//- Add edge-specific optimizations
//- Support TTL natively 
export class CloudflareKVAdapter {
    constructor(kv) {
        this.kv = kv;
    }
    async get(key) {
        const value = await this.kv.get(key);
        if (!value)
            return undefined;
        return JSON.parse(value);
    }
    async set(key, value, ttl) {
        await this.kv.put(key, JSON.stringify(value), {
            expirationTtl: ttl ? Math.floor(ttl / 1000) : undefined
        });
    }
    async delete(key) {
        try {
            await this.kv.delete(key);
            return true;
        }
        catch {
            return false;
        }
    }
    async clear() {
        const list = await this.kv.list();
        await Promise.all(list.keys.map(k => this.kv.delete(k.name)));
    }
    async has(key) {
        const value = await this.kv.get(key);
        return value !== null;
    }
    // Batch operations
    async getMany(keys) {
        return Promise.all(keys.map(key => this.get(key)));
    }
    async setMany(entries) {
        await Promise.all(entries.map(([key, value, ttl]) => this.set(key, value, ttl)));
    }
}

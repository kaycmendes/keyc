import { EventManager } from './event-manager';
import { FastMemoryStore } from './stores/fast-memory';
export class Keyc extends EventManager {
    constructor(options = {}) {
        super();
        this.middleware = [];
        this.store = options.store || new FastMemoryStore();
        this.namespace = options.namespace;
        this.ttl = options.ttl;
        this.serialize = options.serialize || JSON.stringify;
        this.deserialize = options.deserialize || JSON.parse;
    }
    use(fn) {
        this.middleware.push(fn);
        return this;
    }
    async get(key) {
        const prefixedKey = this.getNamespacedKey(key);
        const context = {
            operation: 'get',
            key: prefixedKey
        };
        try {
            await this.executeMiddleware(context);
            const raw = await this.store.get(prefixedKey);
            if (!raw)
                return undefined;
            const value = this.deserialize(raw);
            context.value = value;
            return value;
        }
        catch (error) {
            this.emit('error', error);
            return undefined;
        }
    }
    async set(key, value, ttl) {
        const prefixedKey = this.getNamespacedKey(key);
        const context = {
            operation: 'set',
            key: prefixedKey,
            value,
            ttl: ttl ?? this.ttl
        };
        try {
            await this.executeMiddleware(context);
            const serialized = this.serialize(value);
            await this.store.set(prefixedKey, serialized, context.ttl);
            this.emit('set', { key, value });
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    async delete(key) {
        const prefixedKey = this.getNamespacedKey(key);
        const context = {
            operation: 'delete',
            key: prefixedKey
        };
        try {
            await this.executeMiddleware(context);
            const result = await this.store.delete(prefixedKey);
            if (result)
                this.emit('delete', key);
            return result;
        }
        catch (error) {
            this.emit('error', error);
            return false;
        }
    }
    async clear() {
        const context = {
            operation: 'clear'
        };
        try {
            await this.executeMiddleware(context);
            await this.store.clear();
            this.emit('clear', undefined);
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    async executeMiddleware(context) {
        let index = 0;
        const runner = async () => {
            if (index < this.middleware.length) {
                await this.middleware[index++](context, runner);
            }
        };
        await runner();
    }
    getNamespacedKey(key) {
        return this.namespace ? `${this.namespace}:${key}` : key;
    }
}

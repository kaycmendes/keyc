import { KeyvStoreAdapter } from '@keyc/core';
interface KVNamespace {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, options?: {
        expirationTtl?: number;
    }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: {
        prefix?: string;
    }): Promise<{
        keys: Array<{
            name: string;
        }>;
    }>;
}
export declare class CloudflareKVAdapter<T = any> implements KeyvStoreAdapter<T> {
    private kv;
    constructor(kv: KVNamespace);
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    getMany(keys: string[]): Promise<Array<T | undefined>>;
    setMany(entries: Array<[string, T, number?]>): Promise<void>;
}
export {};

import { KeyvStoreAdapter } from '../types';
export declare class FastMemoryStore<T = any> implements KeyvStoreAdapter<T> {
    private data;
    private expiries;
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    private clean;
    private sortExpiries;
}

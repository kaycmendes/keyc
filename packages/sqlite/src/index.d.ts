import { KeyvStoreAdapter } from '@keyc/core';
export declare class SQLiteAdapter<T = any> implements KeyvStoreAdapter<T> {
    private db;
    constructor(filename?: string);
    private init;
    private exec;
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
    close(): Promise<void>;
}

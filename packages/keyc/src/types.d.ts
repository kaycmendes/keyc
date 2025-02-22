export interface KeyvStoreAdapter<T = any> {
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    has(key: string): Promise<boolean>;
}
export interface KeycOptions<T> {
    store?: KeyvStoreAdapter<T>;
    namespace?: string;
    ttl?: number;
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
}
export interface MiddlewareContext<T> {
    operation: 'get' | 'set' | 'delete' | 'clear';
    key?: string;
    value?: T;
    ttl?: number;
}
export type Middleware<T> = (context: MiddlewareContext<T>, next: () => Promise<void>) => Promise<void>;

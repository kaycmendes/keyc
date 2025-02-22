import { EventManager } from './event-manager';
import { KeycOptions, Middleware } from './types';
export declare class Keyc<T = any> extends EventManager {
    private store;
    private namespace?;
    private ttl?;
    private middleware;
    private serialize;
    private deserialize;
    constructor(options?: KeycOptions<T>);
    use(fn: Middleware<T>): this;
    get(key: string): Promise<T | undefined>;
    set(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    clear(): Promise<void>;
    private executeMiddleware;
    private getNamespacedKey;
}

import { Middleware } from './types';
export declare const commonMiddleware: {
    logger<T>(): Middleware<T>;
    validate<T>(validator: (value: T) => boolean): Middleware<T>;
    stats<T>(): Middleware<T>;
};

export type EventListener = (...args: any[]) => void;
export declare class EventManager {
    private listeners;
    protected emit(event: string, data?: any): void;
    on(event: string, listener: EventListener): this;
    off(event: string, listener: EventListener): this;
}

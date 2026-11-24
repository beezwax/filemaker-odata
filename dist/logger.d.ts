export interface ILogger {
    log(message: unknown): void;
}
export declare class Logger implements ILogger {
    log(message: unknown): void;
}
export declare class NullLogger implements ILogger {
    log(): void;
}

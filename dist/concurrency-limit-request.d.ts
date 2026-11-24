import { IRequest, IResponse, RequestOptions } from './request';
/**
 * A pool of request slots. Tasks run through `run` start immediately while a
 * slot is free and otherwise wait in a FIFO queue. A slot is released as soon
 * as its task settles, whether it succeeds or fails.
 *
 * Share one instance between several ConcurrencyLimitRequests to make them
 * compete for the same slots.
 */
export declare class ConcurrencyLimit {
    private limit;
    constructor(concurrency: number);
    run<T>(task: () => Promise<T>): Promise<T>;
}
/**
 * An IRequest wrapper that limits how many requests to the inner request are
 * in flight at once.
 *
 * GETs and POSTs share the same slots. Calls over the limit wait in a queue
 * and start in FIFO order as slots free up. A slot is released as soon as the
 * inner call settles, whether it succeeds or fails. Meant to sit inside
 * DedupeRequest, so shared reads do not take a slot.
 *
 * Pass the same ConcurrencyLimit to several wrappers to make them share slots.
 */
export declare class ConcurrencyLimitRequest implements IRequest {
    private inner;
    private limit;
    constructor(inner: IRequest, limit: ConcurrencyLimit);
    get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>>;
    post<T>(url: string, params: string | Record<string, unknown> | null, options?: RequestOptions): Promise<IResponse<T>>;
}

import { IRequest, IResponse, RequestOptions } from './request';
/**
 * An IRequest wrapper that shares the result of identical in-flight GETs.
 *
 * Only requests that are currently in flight are shared: nothing is cached
 * after a request settles, and errors are never kept. Any POST detaches all
 * in-flight GETs, so a read started after a write never joins a read that
 * started before it.
 */
export declare class DedupeRequest implements IRequest {
    private inner;
    private inFlight;
    constructor(inner: IRequest);
    get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>>;
    post<T>(url: string, params: string | Record<string, unknown> | null, options?: RequestOptions): Promise<IResponse<T>>;
    private detachInFlightReads;
}

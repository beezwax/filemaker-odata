import { ILogger } from './logger';
import { IRequest, IResponse, RequestOptions } from './request';
/**
 * Whether a failed POST is safe to retry. POSTs run scripts and batches that
 * may write, so a POST is retried only when it almost certainly did not run
 * in FileMaker:
 *   - a 500 or 503 proxy error page (HTML or no content type), or
 *   - a connection that could not be made at all (refused, DNS failure, host
 *     or network unreachable).
 *
 * A JSON, XML, multipart or plain text error may come from FileMaker, which
 * received the request and may have run it. A 502 or 504 means the proxy may
 * have forwarded the request, then lost the connection to FileMaker or
 * stopped waiting for its answer. Timeouts and interrupted connections can
 * happen after the body was sent, while FileMaker keeps working. None of
 * these are retried, which avoids retrying when FileMaker may have run the
 * request. Some risk remains: a proxy can return an HTML 500 after it
 * forwarded the request.
 */
export declare const isRetryablePostError: (error: unknown) => boolean;
/**
 * Whether a failed GET is safe to retry. Reads are idempotent, so a GET is
 * retried on any transient failure: everything a POST is retried on, plus
 *   - our own inactivity timeout (RequestTimeoutError),
 *   - an interrupted connection (reset, aborted, browser network error), even
 *     when it dropped after the response started arriving, or
 *   - a 500, 502, 503 or 504 (FileMaker or a proxy in front of it).
 */
export declare const isRetryableGetError: (error: unknown) => boolean;
export interface RetryOptions {
    retries: number;
    baseDelay?: number;
    logger?: ILogger;
}
export declare function assertValidRetries(retries: unknown): asserts retries is number;
/**
 * An IRequest wrapper that retries requests failing in a transient way, such
 * as a proxy returning a generic 500 error page.
 *
 * GETs are retried on any transient failure. POSTs are retried only when
 * they most likely never reached FileMaker. See `isRetryableGetError` and
 * `isRetryablePostError` above. Other errors, and the last failure, are
 * thrown as they are.
 *
 * Meant to sit inside ConcurrencyLimitRequest and DedupeRequest: a request
 * keeps its slot while it waits to retry, and callers sharing a deduplicated
 * read share its retries.
 */
export declare class RetryRequest implements IRequest {
    private inner;
    private retries;
    private baseDelay;
    private logger?;
    constructor(inner: IRequest, { retries, baseDelay, logger }: RetryOptions);
    get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>>;
    post<T>(url: string, params: string | Record<string, unknown> | null, options?: RequestOptions): Promise<IResponse<T>>;
    private attempt;
    private delayFor;
}

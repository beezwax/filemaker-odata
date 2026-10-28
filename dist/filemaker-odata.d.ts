import { AxiosResponse } from 'axios';
import { ResponseType as ResponseType_2 } from 'axios';

declare interface BatchOperation {
    toRequestBody({ boundary, changeId, }: {
        boundary: string;
        changeId: number;
    }): string;
    parseResponse(change: string): BatchOperationResponse<unknown>;
}

declare interface BatchOperationResponse<T> {
    status: number;
    body: T;
}

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

declare type CountQueryOptions<T> = Pick<QueryOptions<T>, "$filter">;

declare type CrossJoinQueryOptions<T> = Pick<QueryOptions<T>, "$filter" | "$expand" | "$format" | "$metadata">;

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

export declare class FileMaker {
    private config;
    private logger;
    private request;
    constructor({ server, database, logger, request, }: {
        server: string;
        database: string;
        logger: ILogger;
        request: IRequest;
    });
    url(path: string): string;
    metadata<T>(options?: MetadataOptions): Promise<T>;
    subquery<T>(params: {
        table: string;
        recordId: string;
        path: string;
        options?: QueryOptions<T>;
    }): Promise<T[]>;
    getRecords<T>(table: string, options?: QueryOptions<T>): Promise<T[]>;
    getRecordsWithCount<T>(table: string, options?: QueryOptions<T>): Promise<{
        data: T[];
        count: number;
    }>;
    countRecords<T>(table: string, options?: CountQueryOptions<T>): Promise<number>;
    getRecord<T>(table: string, id: string, options?: GetRecordQueryOptions<T>): Promise<T>;
    getValue(table: string, id: string, field: string): Promise<string>;
    crossjoin<T>({ tables, options, }: {
        tables: string[];
        options: CrossJoinQueryOptions<T>;
    }): Promise<string>;
    batch(): OperationBuilder;
    script<T>(name: string, params?: Record<string, unknown>): Promise<{
        success: boolean;
        data: T | undefined;
    }>;
    private getPagedCollection;
    private resolveNextLink;
    private parameterize;
    private parameterizeCount;
    private log;
}

/**
 * You can use this class to authenticate against a FileMaker server. You can
 * use OAuth or basic credentials to get an authentication token.
 *
 * @deprecated Consider using FileMakerClient instead, which provides a simpler
 * API and better handles agent configuration. This class is kept for backwards
 * compatibility.
 *
 * @example
 * // Instead of:
 * const auth = new FileMakerAuthenticator({ server, database });
 * const { redirectUrl, requestId } = await auth.getOAuthUrl({ ... });
 *
 * // Use:
 * const client = new FileMakerClient({ server, database });
 * const { redirectUrl, requestId } = await client.getOAuthUrl({ ... });
 */
export declare class FileMakerAuthenticator {
    private server;
    private database;
    private request;
    constructor({ server, database }: {
        server: string;
        database: string;
    });
    url(path: string): string;
    getAuthType(): Promise<string>;
    getOAuthUrl({ trackingId, provider, returnUrl, }: {
        trackingId: string;
        provider: string;
        returnUrl?: string;
    }): Promise<{
        redirectUrl: string;
        requestId: string;
    }>;
    getTokenUsingOAuth({ requestId, identifier, }: {
        requestId: string;
        identifier: string;
    }): Promise<any>;
    /**
     * Uses the given credentials to return an authentication token which can be
     /* used for subsequent requests.
     */
    getTokenUsingCredentials({ username, password, }: {
        username: string;
        password: string;
    }): Promise<string | null>;
}

export declare class FileMakerBasicCredentials implements FileMakerCredentials {
    private username;
    private password;
    constructor({ username, password }: {
        username: string;
        password: string;
    });
    get authorizationHeaders(): {
        Authorization: string;
    };
}

/**
 * A facade class that simplifies the creation and configuration of FileMaker
 * instances. This class handles the composition of credentials, requests, and
 * the FileMaker client internally.
 *
 * Identical concurrent GET requests made through the same FileMaker instance
 * are shared by default. Pass `dedupe: false` to send every request.
 *
 * Pass `concurrency` to cap the number of HTTP requests in flight at once. The
 * cap is shared by every FileMaker this client builds. Leaving it out (or
 * passing undefined, 0 or Infinity) means no limit.
 *
 * Pass `timeout` (milliseconds, up to 2147483647) to drop a request that stops
 * receiving data. A request fails when no response data is received for that
 * long. The timer starts when the request is sent and restarts each time data
 * arrives, so a response that keeps sending data is not cut off. This works
 * the same in Node and browsers. Leaving it
 * out (or passing undefined, 0 or Infinity) means no timeout. A timed-out
 * request throws `RequestTimeoutError`.
 *
 * Requests failing in a transient way are retried once by default; pass
 * `retries` to change that (0 turns retries off). See "Request Retries" in
 * the README for which failures are retried.
 *
 * @example
 * // Basic authentication
 * const client = new FileMakerClient({
 *   server: "demo.server.beezwax.net",
 *   database: "test"
 * });
 * const fm = client.withBasicAuth({ username: "user", password: "pass" });
 *
 * @example
 * // OAuth authentication
 * const client = new FileMakerClient({
 *   server: "demo.server.beezwax.net",
 *   database: "test"
 * });
 * const { redirectUrl, requestId } = await client.getOAuthUrl({
 *   trackingId: "unique-id",
 *   provider: "Google"
 * });
 * // ... after OAuth redirect
 * const fm = client.withOAuth({ requestId, identifier });
 */
export declare class FileMakerClient {
    private server;
    private database;
    private agent?;
    private logger;
    private dedupe;
    private concurrencyLimit?;
    private timeout?;
    private retries;
    constructor({ server, database, agent, logger, dedupe, concurrency, timeout, retries, }: {
        server: string;
        database: string;
        agent?: unknown;
        logger?: ILogger;
        dedupe?: boolean;
        concurrency?: number;
        timeout?: number;
        retries?: number;
    });
    /**
     * Creates a FileMaker instance configured with basic authentication.
     *
     * @param username - The FileMaker username
     * @param password - The FileMaker password
     * @returns A configured FileMaker instance ready to use
     */
    withBasicAuth({ username, password, }: {
        username: string;
        password: string;
    }): FileMaker;
    /**
     * Creates a FileMaker instance configured with OAuth credentials.
     *
     * @param requestId - The request ID obtained from getOAuthUrl()
     * @param identifier - The identifier received from the OAuth redirect
     * @returns A configured FileMaker instance ready to use
     */
    withOAuth({ requestId, identifier, }: {
        requestId: string;
        identifier: string;
    }): FileMaker;
    private transport;
    private buildFileMaker;
    private decorate;
    /**
     * Initiates the OAuth authentication flow by generating the OAuth URL.
     * Redirect the user to the returned URL to begin authentication.
     *
     * @param trackingId - A unique identifier for tracking this OAuth request
     * @param provider - The OAuth provider name (e.g., "Google", "Microsoft")
     * @param returnUrl - Optional URL to return to after OAuth completes
     * @returns The OAuth redirect URL and request ID to store for later use
     */
    getOAuthUrl({ trackingId, provider, returnUrl, }: {
        trackingId: string;
        provider: string;
        returnUrl?: string;
    }): Promise<{
        redirectUrl: string;
        requestId: string;
    }>;
    /**
     * Detects the available authentication types supported by the FileMaker
     * server.
     *
     * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
     */
    getAuthTypes(): Promise<string[]>;
    /**
     * Helper method to construct a FileMaker OData URL.
     *
     * @param path - The path segment to append to the base URL
     * @returns The full OData URL
     */
    url(path: string): string;
}

export declare interface FileMakerConfig {
    server: string;
    database: string;
}

export declare interface FileMakerCredentials {
    get authorizationHeaders(): Record<string, string>;
}

export declare class FileMakerOAuthCredentials implements FileMakerCredentials {
    private requestId;
    private identifier;
    constructor({ requestId, identifier, }: {
        requestId: string;
        identifier: string;
    });
    get authorizationHeaders(): {
        "OData-Version": string;
        "OData-MaxVersion": string;
        "X-FM-Data-OAuth-Request-Id": string;
        "X-FM-Data-OAuth-Identifier": string;
    };
}

export declare class FileMakerRawCredentials implements FileMakerCredentials {
    private authorization;
    constructor(authorization: string);
    get authorizationHeaders(): {
        Authorization: string;
    };
}

declare type GetRecordQueryOptions<T> = Pick<QueryOptions<T>, "$select" | "$expand" | "$format" | "$metadata">;

export declare interface ILogger {
    log(message: unknown): void;
}

declare interface IRequest {
    get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>>;
    post<T>(url: string, params: string | Record<string, unknown> | null, options?: RequestOptions): Promise<IResponse<T>>;
}

declare interface IResponse<T> {
    data: T;
    headers: IResponseHeaders;
}

declare type IResponseHeaders = AxiosResponse["headers"];

export declare const isRequestError: (error: unknown) => error is RequestError;

export declare const isRequestTimeoutError: (error: unknown) => error is RequestTimeoutError;

export declare class Logger implements ILogger {
    log(message: unknown): void;
}

export declare interface MetadataOptions {
    $format?: "json" | "xml";
}

export declare class NullFileMakerCredentials implements FileMakerCredentials {
    get authorizationHeaders(): {};
}

export declare class NullLogger implements ILogger {
    log(): void;
}

export declare const odata: {
    string: (value: string) => string;
    number: (value: number | string) => string;
    integer: (value: number | string) => string;
    boolean: (value: boolean) => string;
    uuid: (value: string) => string;
    identifier: (value: string) => string;
};

declare class OperationBuilder {
    private operations;
    private callback;
    private config;
    constructor(config: FileMakerConfig, callback: OperationBuilderCallback);
    update<T extends RecordWithId>({ table, record, }: {
        table: string;
        record: PartialExcept<T, "ID">;
    }): this;
    create<T>({ table, record }: {
        table: string;
        record: Partial<T>;
    }): this;
    delete({ table, id }: {
        table: string;
        id: string;
    }): this;
    execute(): Promise<BatchOperationResponse<unknown>[]>;
}

declare type OperationBuilderCallback = (operations: BatchOperation[]) => Promise<BatchOperationResponse<unknown>[]>;

declare type OrderByClause<T> = [keyof T, "asc" | "desc"];

declare type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

declare interface QueryOptions<T> {
    $select?: (keyof T)[];
    $top?: number;
    $skip?: number;
    $filter?: string;
    $expand?: string;
    $orderby?: OrderByClause<T> | OrderByClause<T>[];
    $count?: boolean;
    $format?: "json" | "xml";
    $metadata?: boolean;
}

declare interface RecordWithId {
    ID: string;
}

export declare class RequestError extends Error {
    data?: unknown;
    status?: number;
    contentType?: string;
    failure: RequestFailure;
    constructor(message: string, data?: unknown, details?: RequestErrorDetails);
}

declare interface RequestErrorDetails {
    status?: number;
    contentType?: string;
    failure?: RequestFailure;
}

export declare type RequestFailure = "not-connected" | "interrupted" | "response" | "other";

declare interface RequestOptions {
    headers?: Record<string, string>;
    responseType?: ResponseType_2;
}

export declare class RequestTimeoutError extends RequestError {
    readonly timeout: number;
    constructor(timeout: number);
}

export declare interface RetryOptions {
    retries: number;
    baseDelay?: number;
    logger?: ILogger;
}

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

export { }

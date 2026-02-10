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

declare type CrossJoinQueryOptions<T> = Pick<QueryOptions<T>, "$filter" | "$expand" | "$format" | "$metadata">;

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
    metadata<T>(): Promise<T>;
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
    private parameterize;
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
    constructor({ server, database, agent, logger, }: {
        server: string;
        database: string;
        agent?: unknown;
        logger?: ILogger;
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

export declare class Logger implements ILogger {
    log(message: unknown): void;
}

export declare class NullFileMakerCredentials implements FileMakerCredentials {
    get authorizationHeaders(): {};
}

export declare class NullLogger implements ILogger {
    log(): void;
}

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

declare interface RequestOptions {
    headers?: Record<string, string>;
    responseType?: ResponseType_2;
}

export { }

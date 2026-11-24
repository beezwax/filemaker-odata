import { FileMaker } from './filemaker';
import { ILogger } from './logger';
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

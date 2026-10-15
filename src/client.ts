import { FileMaker } from "./filemaker";
import { type IRequest, Request } from "./request";
import { DedupeRequest } from "./dedupe-request";
import {
  ConcurrencyLimit,
  ConcurrencyLimitRequest,
} from "./concurrency-limit-request";
import { type ILogger, Logger } from "./logger";
import {
  FileMakerBasicCredentials,
  FileMakerOAuthCredentials,
  NullFileMakerCredentials,
} from "./credentials";

interface OAuthResponse {
  data?: {
    Provider: { Name: string }[];
  };
}

// undefined, 0 and Infinity mean "no limit". Anything else is left to
// ConcurrencyLimit, which throws a RangeError for invalid values.
const hasConcurrencyLimit = (
  concurrency: number | undefined,
): concurrency is number =>
  concurrency !== undefined && concurrency !== 0 && concurrency !== Infinity;

// undefined, 0 and Infinity mean "no timeout". Anything else must be a
// positive finite number of milliseconds.
// The largest delay JS timers support; longer delays fire almost at once.
const MAX_TIMEOUT = 2147483647;

const normalizeTimeout = (timeout: number | undefined): number | undefined => {
  if (timeout === undefined || timeout === 0 || timeout === Infinity)
    return undefined;
  if (typeof timeout === "number" && timeout > 0 && timeout <= MAX_TIMEOUT)
    return timeout;
  throw new RangeError(
    `timeout must be a positive number up to ${MAX_TIMEOUT}, 0 or Infinity`,
  );
};

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
export class FileMakerClient {
  private server: string;
  private database: string;
  private agent?: unknown;
  private logger: ILogger;
  private dedupe: boolean;
  private concurrencyLimit?: ConcurrencyLimit;
  private timeout?: number;

  constructor({
    server,
    database,
    agent,
    logger,
    dedupe = true,
    concurrency,
    timeout,
  }: {
    server: string;
    database: string;
    agent?: unknown;
    logger?: ILogger;
    dedupe?: boolean;
    concurrency?: number;
    timeout?: number;
  }) {
    this.server = server;
    this.database = database;
    this.agent = agent;
    this.logger = logger ?? new Logger();
    this.dedupe = dedupe;
    this.concurrencyLimit = hasConcurrencyLimit(concurrency)
      ? new ConcurrencyLimit(concurrency)
      : undefined;
    this.timeout = normalizeTimeout(timeout);
  }

  /**
   * Creates a FileMaker instance configured with basic authentication.
   *
   * @param username - The FileMaker username
   * @param password - The FileMaker password
   * @returns A configured FileMaker instance ready to use
   */
  withBasicAuth({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): FileMaker {
    const credentials = new FileMakerBasicCredentials({ username, password });
    return this.buildFileMaker(
      new Request(credentials, this.agent, this.timeout),
    );
  }

  /**
   * Creates a FileMaker instance configured with OAuth credentials.
   *
   * @param requestId - The request ID obtained from getOAuthUrl()
   * @param identifier - The identifier received from the OAuth redirect
   * @returns A configured FileMaker instance ready to use
   */
  withOAuth({
    requestId,
    identifier,
  }: {
    requestId: string;
    identifier: string;
  }): FileMaker {
    const credentials = new FileMakerOAuthCredentials({
      requestId,
      identifier,
    });
    return this.buildFileMaker(
      new Request(credentials, this.agent, this.timeout),
    );
  }

  private buildFileMaker(request: IRequest): FileMaker {
    return new FileMaker({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request: this.decorate(request),
    });
  }

  // Innermost first: the concurrency limit sits inside dedupe, so callers
  // sharing a deduplicated read do not take a slot.
  private decorate(request: IRequest): IRequest {
    let decorated = request;
    if (this.concurrencyLimit !== undefined)
      decorated = new ConcurrencyLimitRequest(decorated, this.concurrencyLimit);
    if (this.dedupe) decorated = new DedupeRequest(decorated);
    return decorated;
  }

  /**
   * Initiates the OAuth authentication flow by generating the OAuth URL.
   * Redirect the user to the returned URL to begin authentication.
   *
   * @param trackingId - A unique identifier for tracking this OAuth request
   * @param provider - The OAuth provider name (e.g., "Google", "Microsoft")
   * @param returnUrl - Optional URL to return to after OAuth completes
   * @returns The OAuth redirect URL and request ID to store for later use
   */
  async getOAuthUrl({
    trackingId,
    provider,
    returnUrl,
  }: {
    trackingId: string;
    provider: string;
    returnUrl?: string;
  }): Promise<{ redirectUrl: string; requestId: string }> {
    const request = new Request(
      new NullFileMakerCredentials(),
      this.agent,
      this.timeout,
    );

    const url = `https://${this.server}/oauth/getoauthurl?trackingID=${trackingId}&provider=${provider}&address=${this.server}&X-FMS-OAuth-AuthType=2`;
    const response = await request.get(url, {
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": returnUrl ?? `https://${this.server}/oauth-handler`,
      },
    });

    const redirectUrl = response.data as string;
    const requestId =
      (response.headers["x-fms-request-id"] as unknown as string | undefined) ??
      "";

    if (requestId === undefined || requestId === "")
      throw new Error(
        'Did not get back an "X-FMS-Request-ID" header from FileMaker',
      );

    return { redirectUrl, requestId };
  }

  /**
   * Detects the available authentication types supported by the FileMaker
   * server.
   *
   * @returns The authentication types (e.g., "Google", "Microsoft", "basic")
   */
  async getAuthTypes(): Promise<string[]> {
    const request = new Request(
      new NullFileMakerCredentials(),
      this.agent,
      this.timeout,
    );

    const response = await request.get<OAuthResponse>(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const json = response.data.data;
    if (json !== undefined)
      return json.Provider.map((provider) => provider.Name);

    return ["basic"];
  }

  /**
   * Helper method to construct a FileMaker OData URL.
   *
   * @param path - The path segment to append to the base URL
   * @returns The full OData URL
   */
  url(path: string): string {
    return `https://${this.server}/fmi/odata/v4/${this.database}/${path}`;
  }
}

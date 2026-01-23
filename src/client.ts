import { FileMaker } from "./file-maker";
import { Request } from "./request";
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
export class FileMakerClient {
  private server: string;
  private database: string;
  private agent?: unknown;
  private logger: ILogger;

  constructor({
    server,
    database,
    agent,
    logger,
  }: {
    server: string;
    database: string;
    agent?: unknown;
    logger?: ILogger;
  }) {
    this.server = server;
    this.database = database;
    this.agent = agent;
    this.logger = logger ?? new Logger();
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
    const request = new Request(credentials, this.agent);
    return new FileMaker({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request,
    });
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
    const request = new Request(credentials, this.agent);
    return new FileMaker({
      server: this.server,
      database: this.database,
      logger: this.logger,
      request,
    });
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
    const request = new Request(new NullFileMakerCredentials(), this.agent);

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
    const request = new Request(new NullFileMakerCredentials(), this.agent);

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

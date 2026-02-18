import { Request, type IRequest } from "./request";
import { NullFileMakerCredentials } from "./credentials";

interface OAuthResponse {
  data?: {
    Provider: { Name: string }[];
  };
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
export class FileMakerAuthenticator {
  private server: string;
  private database: string;
  private request: IRequest;

  constructor({ server, database }: { server: string; database: string }) {
    this.server = server;
    this.database = database;
    // TODO: We could re-organize the dependencies here somehow, for example,
    // we might need to set the agent, and this doesn't allow for it.
    this.request = new Request(new NullFileMakerCredentials());
  }

  url(path: string) {
    return `https://${this.server}/fmi/data/vLatest/databases/${this.database}/${path}`;
  }

  async getAuthType(): Promise<string> {
    const response = await this.request.get<OAuthResponse>(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const json = response.data.data;
    if (json !== undefined) return json.Provider[0].Name;

    return "basic";
  }

  async getOAuthUrl({
    trackingId,
    provider,
    returnUrl,
  }: {
    trackingId: string;
    provider: string;
    returnUrl?: string;
  }) {
    const url = `https://${this.server}/oauth/getoauthurl?trackingID=${trackingId}&provider=${provider}&address=${this.server}&X-FMS-OAuth-AuthType=2`;

    console.log(url);
    console.log({
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": returnUrl ?? `https://${this.server}/oauth-handler`,
      },
    });

    const response = await this.request.get(url, {
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

  // Uses a requestId and an identifier (OAuth) to return an authentication
  // token which can be used for subsequent requests.
  async getTokenUsingOAuth({
    requestId,
    identifier,
  }: {
    requestId: string;
    identifier: string;
  }) {
    const response = await this.request.post(this.url("sessions"), {
      headers: {
        "Content-Type": "application/json",
        "X-FM-Data-OAuth-Request-Id": requestId,
        "X-FM-Data-OAuth-Identifier": identifier,
      },
    });

    return response.headers["X-FM-Data-Access-Token"];
  }

  /**
   * Uses the given credentials to return an authentication token which can be
  /* used for subsequent requests.
   */
  async getTokenUsingCredentials({
    username,
    password,
  }: {
    username: string;
    password: string;
  }): Promise<string | null> {
    const response = await this.request.post<{ response: { token: string } }>(
      this.url("sessions"),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      },
    );

    return response.data.response.token ?? null;
  }
}

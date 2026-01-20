import { Agent } from "https";
import axios from "axios";
import { ensure } from "@/lib/utils";

// We use a custom self-signed certificate for our FileMaker server, so we need
// to disable certificate validation.
const agent = new Agent({ rejectUnauthorized: false });

interface OAuthResponse {
  data?: {
    Provider: { Name: string }[];
  };
}

export class FileMakerAuthenticator {
  server: string;
  database: string;

  constructor({ server, database }: { server: string; database: string }) {
    this.server = server;
    this.database = database;
  }

  url(path: string) {
    return `https://${this.server}/fmi/data/vLatest/databases/${this.database}/${path}`;
  }

  async getAuthType(): Promise<string> {
    const response = await axios.get<OAuthResponse>(
      `https://${this.server}/fmws/oauthproviderinfo`,
      {
        httpsAgent: agent,
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
  }: {
    trackingId: string;
    provider: string;
  }) {
    const url = `https://${this.server}/oauth/getoauthurl?trackingID=${trackingId}&provider=${provider}&address=${this.server}&X-FMS-OAuth-AuthType=2`;
    const response = await axios.get(url, {
      httpsAgent: agent,
      headers: {
        "X-FMS-Application-Type": "9",
        "X-FMS-Application-Version": "15",
        "X-FMS-Return-URL": `https://${this.server}/oauth-handler`,
      },
    });

    const redirectUrl = response.data as string;
    const requestId =
      (response.headers["x-fms-request-id"] as unknown as string | undefined) ??
      "";
    ensure(
      requestId,
      'Did not get back an "X-FMS-Request-ID" header from FileMaker',
    );

    return { redirectUrl, requestId };
  }

  // Uses a requestId and an identifier (OAuth) to return an authentication
  // token which can be used for subsequent requests.
  // async getTokenUsingOAuth({
  //   requestId,
  //   identifier,
  // }: {
  //   requestId: string;
  //   identifier: string;
  // }) {
  //   const response = await fetch(this.url("sessions"), {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "X-FM-Data-OAuth-Request-Id": requestId,
  //       "X-FM-Data-OAuth-Identifier": identifier,
  //     },
  //     body: "{}",
  //     httpsAgent: agent,
  //   });

  //   return response.headers.get("X-FM-Data-Access-Token");
  // }

  // Uses the given credentials to return an authentication token which can be
  // used for subsequent requests.
  // async getTokenUsingCredentials({
  //   username,
  //   password,
  // }: {
  //   username: string;
  //   password: string;
  // }): Promise<string | null> {
  //   const credentials = Buffer.from(`${username}:${password}`).toString(
  //     "base64",
  //   );

  //   const response = await fetch(this.url("sessions"), {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Basic ${credentials}`,
  //     },
  //     httpsAgent: agent,
  //   });

  //   const json = await response.json();
  //   return json?.response?.token ?? null;
  // }
}

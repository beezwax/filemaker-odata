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

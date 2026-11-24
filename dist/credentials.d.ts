export interface FileMakerCredentials {
    get authorizationHeaders(): Record<string, string>;
}
export declare class NullFileMakerCredentials implements FileMakerCredentials {
    get authorizationHeaders(): {};
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
export declare class FileMakerRawCredentials implements FileMakerCredentials {
    private authorization;
    constructor(authorization: string);
    get authorizationHeaders(): {
        Authorization: string;
    };
}

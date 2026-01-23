export interface FileMakerCredentials {
  get authorizationHeaders(): Record<string, string>;
}

export class NullFileMakerCredentials implements FileMakerCredentials {
  get authorizationHeaders() {
    return {};
  }
}

export class FileMakerOAuthCredentials implements FileMakerCredentials {
  private requestId: string;
  private identifier: string;

  constructor({
    requestId,
    identifier,
  }: {
    requestId: string;
    identifier: string;
  }) {
    this.requestId = requestId;
    this.identifier = identifier;
  }

  get authorizationHeaders() {
    return {
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      "X-FM-Data-OAuth-Request-Id": this.requestId,
      "X-FM-Data-OAuth-Identifier": this.identifier,
    };
  }
}

export class FileMakerBasicCredentials implements FileMakerCredentials {
  private username: string;
  private password: string;

  constructor({ username, password }: { username: string; password: string }) {
    this.username = username;
    this.password = password;
  }

  get authorizationHeaders() {
    return {
      Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`,
    };
  }
}

// An authorization strategy using the raw string which will be passed to
// `Authorization` header. Eg:
//
//   new FileMakerRawCredentials('Basic <access-token>');
//
export class FileMakerRawCredentials implements FileMakerCredentials {
  private authorization: string;

  constructor(authorization: string) {
    this.authorization = authorization;
  }

  get authorizationHeaders() {
    return {
      Authorization: this.authorization,
    };
  }
}

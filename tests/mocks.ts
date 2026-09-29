import type {
  IRequest,
  IResponse,
  IResponseHeaders,
  RequestOptions,
} from "../src/request";

// The test tsconfig has no Node types; tests run in Node, where Buffer exists.
export const NodeBuffer = (
  globalThis as unknown as {
    Buffer: {
      from(text: string): Uint8Array;
      isBuffer(value: unknown): boolean;
    };
  }
).Buffer;

export class MockRequest implements IRequest {
  private requests: Record<"GET" | "POST", Record<string, IResponse<unknown>>>;

  private getErrors: Record<string, Error> = {};

  private getGate: Promise<void> | undefined;

  private responses: {
    response: IResponse<unknown>;
    request: {
      type: "GET" | "POST";
      url: string;
      options?: RequestOptions;
      params?: unknown;
      headers?: IResponseHeaders;
    };
  }[];

  constructor() {
    this.requests = {
      GET: {},
      POST: {},
    };
    this.responses = [];
  }

  mock<T>({
    type,
    url,
    data,
    headers,
  }: {
    type: "GET" | "POST";
    url: string;
    data: T;
    headers?: IResponseHeaders;
  }) {
    this.requests[type][url] = { data, headers: headers ?? {} };
  }

  mockGetError(url: string, error: Error) {
    this.getErrors[url] = error;
  }

  // Keeps every GET pending until the returned function is called. Requests
  // are still recorded the moment they are made.
  holdGets() {
    let release = () => {};
    this.getGate = new Promise<void>((resolve) => {
      release = () => {
        this.getGate = undefined;
        resolve();
      };
    });
    return release;
  }

  async get<T>(url: string, options?: RequestOptions) {
    const response = this.requests.GET[url] as IResponse<T>;
    const error = this.getErrors[url];

    if (response === undefined && error === undefined)
      throw new Error(`Could not find mock GET request: "${url}"`);

    // Store response for latest inspection if needed by tests
    this.responses.push({
      response,
      request: { type: "GET", url, options },
    });

    if (this.getGate !== undefined) await this.getGate;

    if (error !== undefined) throw error;

    return response as IResponse<T>;
  }

  latestRequest() {
    return this.responses.at(-1)?.request;
  }

  requestCount(url: string) {
    return this.responses.filter(({ request }) => request.url === url).length;
  }

  async post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<T> {
    const request = this.requests.POST[url];

    if (request === undefined)
      throw new Error(`Could not find mock POST request: "${url}"`);

    // Store response for latest inspection if needed by tests
    this.responses.push({
      response: request,
      request: { type: "POST", url, params, options },
    });

    return request as T;
  }
}

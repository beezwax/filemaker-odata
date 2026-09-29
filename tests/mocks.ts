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

type GetMock =
  | { kind: "response"; response: IResponse<unknown> }
  | { kind: "error"; error: Error };

export class MockRequest implements IRequest {
  private getMocks: Record<string, GetMock> = {};

  private postMocks: Record<string, IResponse<unknown>> = {};

  private getGate: Promise<void> | undefined;

  // Every request made, in order, with the response it was answered with
  // (none when the mock was an error).
  private calls: {
    response?: IResponse<unknown>;
    request: {
      type: "GET" | "POST";
      url: string;
      options?: RequestOptions;
      params?: unknown;
      headers?: IResponseHeaders;
    };
  }[] = [];

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
    const response = { data, headers: headers ?? {} };

    if (type === "GET") this.getMocks[url] = { kind: "response", response };
    else this.postMocks[url] = response;
  }

  mockGetError(url: string, error: Error) {
    this.getMocks[url] = { kind: "error", error };
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
    const mock = this.getMocks[url];

    if (mock === undefined)
      throw new Error(`Could not find mock GET request: "${url}"`);

    // Store response for latest inspection if needed by tests
    this.calls.push({
      response: mock.kind === "response" ? mock.response : undefined,
      request: { type: "GET", url, options },
    });

    if (this.getGate !== undefined) await this.getGate;

    if (mock.kind === "error") throw mock.error;

    return mock.response as IResponse<T>;
  }

  latestRequest() {
    return this.calls.at(-1)?.request;
  }

  requestCount(url: string) {
    return this.calls.filter(({ request }) => request.url === url).length;
  }

  async post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<T> {
    const response = this.postMocks[url];

    if (response === undefined)
      throw new Error(`Could not find mock POST request: "${url}"`);

    // Store response for latest inspection if needed by tests
    this.calls.push({
      response,
      request: { type: "POST", url, params, options },
    });

    return response as T;
  }
}

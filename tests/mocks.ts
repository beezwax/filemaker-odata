import type {
  IRequest,
  IResponse,
  IResponseHeaders,
  RequestOptions,
} from "../src/request";

export class MockRequest implements IRequest {
  private requests: Record<"GET" | "POST", Record<string, IResponse<unknown>>>;

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

  async get<T>(url: string, options?: RequestOptions) {
    const response = this.requests.GET[url] as IResponse<T>;

    if (response === undefined)
      throw new Error(`Could not find mock GET request: "${url}"`);

    // Store response for latest inspection if needed by tests
    this.responses.push({
      response,
      request: { type: "GET", url, options },
    });

    return response as IResponse<T>;
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
      request: { type: "GET", url, params, options },
    });

    return request as T;
  }
}

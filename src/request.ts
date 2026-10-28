import axios, {
  AxiosError,
  AxiosHeaders,
  isAxiosError,
  type AxiosRequestConfig,
  type ResponseType,
  type AxiosResponse,
  type RawAxiosHeaders,
} from "axios";
import type { FileMakerCredentials } from "./credentials";

// This `IRequest` implementation uses types from axios. If we ever need
// another implementation (unlikely, but for example, using fetch instead) we
// would need to re-define some types (eg: `ResponseType` and
// `IResponseHeaders`) and make them compatible.
//
// For now we keep it simple by simply aliasing the types.

export interface RequestOptions {
  headers?: Record<string, string>;
  responseType?: ResponseType;
}

// Why a request failed, as far as we can tell:
//   - "not-connected": the connection could not be made, so the request never
//     reached the server.
//   - "interrupted": the connection failed after the request may have been
//     sent, including while the response was still arriving.
//   - "response": the server, or a proxy in front of it, answered with an
//     error status.
//   - "other": anything else, such as a cancelled request.
export type RequestFailure =
  | "not-connected"
  | "interrupted"
  | "response"
  | "other";

export interface RequestErrorDetails {
  // HTTP status, when the server (or a proxy in front of it) responded.
  status?: number;
  // Lowercased Content-Type of the error response, when it had one. Only this
  // header is kept: the others may hold secrets, such as Set-Cookie, and
  // errors are often logged or serialized.
  contentType?: string;
  // Defaults to "other".
  failure?: RequestFailure;
}

export class RequestError extends Error {
  data?: unknown;
  status?: number;
  contentType?: string;
  failure: RequestFailure;

  constructor(message: string, data?: unknown, details?: RequestErrorDetails) {
    super(message);
    this.name = "RequestError";
    this.data = data;
    this.status = details?.status;
    this.contentType = details?.contentType;
    this.failure = details?.failure ?? "other";
  }
}

export class RequestTimeoutError extends RequestError {
  readonly timeout: number;

  constructor(timeout: number) {
    super(`Request timed out after ${timeout} ms`, undefined, {
      failure: "interrupted",
    });
    this.name = "RequestTimeoutError";
    this.timeout = timeout;
  }
}

export const isRequestError = (error: unknown): error is RequestError =>
  error instanceof RequestError;

export const isRequestTimeoutError = (
  error: unknown,
): error is RequestTimeoutError => error instanceof RequestTimeoutError;

export type IResponseHeaders = AxiosResponse["headers"];

export interface IResponse<T> {
  data: T;
  headers: IResponseHeaders;
}

export interface IRequest {
  get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>>;
  post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<IResponse<T>>;
}

type PlainObject = Record<string, unknown>;

const isPlainObject = (val: unknown): val is PlainObject =>
  typeof val === "object" &&
  val !== null &&
  !Array.isArray(val) &&
  Object.getPrototypeOf(val) === Object.prototype;

// Recursively merges plain-object properties, mirroring lodash.merge behaviour:
// source wins on scalar/array conflicts; undefined source values are skipped.
export const mergeDeep = (target: PlainObject, source: PlainObject): PlainObject => {
  const result: PlainObject = { ...target };
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    if (srcVal === undefined) continue;
    const tgtVal = result[key];
    result[key] =
      isPlainObject(tgtVal) && isPlainObject(srcVal)
        ? mergeDeep(tgtVal, srcVal)
        : srcVal;
  }
  return result;
};

type ExtraConfig = Pick<AxiosRequestConfig, "signal" | "onDownloadProgress">;

// Reads the Content-Type, in any case, from either an AxiosHeaders instance or
// a plain headers object.
const contentTypeOf = (headers: IResponseHeaders): string | undefined => {
  const value = AxiosHeaders.from(headers as RawAxiosHeaders).get(
    "content-type",
  );
  return value ? String(value).toLowerCase() : undefined;
};

// Errors raised before a connection was made.
const NOT_CONNECTED_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

// Connections that failed once the request may have been sent. In browsers
// every network failure is "ERR_NETWORK".
const INTERRUPTED_CODES = new Set([
  "ECONNRESET",
  "ECONNABORTED",
  "ETIMEDOUT",
  "EPIPE",
  "ERR_NETWORK",
]);

const failureOf = (error: AxiosError): RequestFailure => {
  const { code, response } = error;
  if (!response && code !== undefined && NOT_CONNECTED_CODES.has(code))
    return "not-connected";
  if (code !== undefined && INTERRUPTED_CODES.has(code)) return "interrupted";
  // Axios reports a body that stopped arriving ("stream has been aborted") as
  // ERR_BAD_RESPONSE with the 2xx response it was reading. Error statuses get
  // that code too, and so do rejected 3xx responses, hence the 2xx check. A
  // body over maxContentLength comes with no response, so it is "other".
  if (
    code === AxiosError.ERR_BAD_RESPONSE &&
    response &&
    response.status >= 200 &&
    response.status < 300
  )
    return "interrupted";
  return response ? "response" : "other";
};

const toRequestError = (error: unknown): RequestError => {
  const message = error instanceof Error ? error.message : String(error);
  if (!isAxiosError(error)) return new RequestError(message);

  const { response } = error;
  return new RequestError(message, response?.data, {
    status: response?.status,
    contentType: response ? contentTypeOf(response.headers) : undefined,
    failure: failureOf(error),
  });
};

// Fails a request with RequestTimeoutError when no response data is received
// for `ms` ms. We use our own timer instead of axios's `timeout`: in Node
// axios's timer stops once response headers arrive, and in browsers it is a
// total limit. The timer counts from the start of the request (upload time
// included) and restarts each time response data arrives, so it is an
// inactivity limit everywhere. We do not use `onUploadProgress`: it makes the
// axios fetch adapter stream request bodies (which needs HTTP/2 in Chrome) and
// forces CORS preflights with XHR. FileMaker request bodies are small. Axios
// throttles progress events to about 3 per second, so the limit is
// approximate by up to ~1/3 s.
const watchInactivity = (ms: number) => {
  const controller = new AbortController();
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const restart = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, ms);
  };
  restart();

  return {
    config: {
      signal: controller.signal,
      onDownloadProgress: restart,
    } satisfies ExtraConfig,
    error: (cause: unknown): RequestError =>
      timedOut ? new RequestTimeoutError(ms) : toRequestError(cause),
    stop: () => clearTimeout(timer),
  };
};

/**
 * An IRequest implementation using Axios
 */
export class Request implements IRequest {
  private credentials: FileMakerCredentials;
  private agent?: unknown;
  private timeout?: number;

  constructor(
    credentials: FileMakerCredentials,
    agent?: unknown,
    timeout?: number,
  ) {
    this.credentials = credentials;
    this.agent = agent;
    this.timeout = timeout;
  }

  private config(
    options: RequestOptions | undefined,
    extra: ExtraConfig,
  ): PlainObject {
    return mergeDeep({ ...options } as PlainObject, {
      httpsAgent: this.agent,
      headers: this.credentials.authorizationHeaders,
      ...extra,
    });
  }

  private async send<T>(
    options: RequestOptions | undefined,
    call: (config: PlainObject) => Promise<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T>> {
    const watch =
      this.timeout === undefined ? undefined : watchInactivity(this.timeout);
    try {
      return await call(this.config(options, watch?.config ?? {}));
    } catch (error) {
      throw watch ? watch.error(error) : toRequestError(error);
    } finally {
      watch?.stop();
    }
  }

  async get<T>(url: string, options?: RequestOptions) {
    return this.send(options, (config) => axios.get<T>(url, config));
  }

  async post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ) {
    return this.send(options, (config) =>
      axios.post<T>(url, params, config),
    );
  }
}

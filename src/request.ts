import axios, {
  isAxiosError,
  type AxiosRequestConfig,
  type ResponseType,
  type AxiosResponse,
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

export class RequestError extends Error {
  data?: unknown;

  constructor(message: string, data?: unknown) {
    super(message);
    this.name = "RequestError";
    this.data = data;
  }
}

export class RequestTimeoutError extends RequestError {
  readonly timeout: number;

  constructor(timeout: number) {
    super(`Request timed out after ${timeout} ms`);
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

const toRequestError = (error: unknown): RequestError =>
  new RequestError(
    error instanceof Error ? error.message : String(error),
    isAxiosError(error) && error.response ? error.response.data : undefined,
  );

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

import axios, {
  isAxiosError,
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

  private transportConfig(): PlainObject {
    return {
      httpsAgent: this.agent,
      headers: this.credentials.authorizationHeaders,
    };
  }

  private config(options: RequestOptions | undefined, extra: PlainObject) {
    return mergeDeep(
      mergeDeep({ ...options } as PlainObject, this.transportConfig()),
      extra,
    );
  }

  // Runs one axios call, failing it with RequestTimeoutError when no data is
  // sent or received for `timeout` ms. We use our own timer instead of axios's
  // `timeout`: in Node axios's timer stops once response headers arrive, and in
  // browsers it is a total limit. Restarting on progress events gives an
  // inactivity limit everywhere. Axios throttles progress events to about 3
  // per second, so the limit is approximate by up to ~1/3 s.
  private async send<T>(
    call: (extra: PlainObject) => Promise<AxiosResponse<T>>,
  ): Promise<AxiosResponse<T>> {
    const timeout = this.timeout;
    if (timeout === undefined) {
      try {
        return await call({});
      } catch (error) {
        throw toRequestError(error);
      }
    }

    const controller = new AbortController();
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeout);
    };

    try {
      restart();
      return await call({
        signal: controller.signal,
        onDownloadProgress: restart,
        onUploadProgress: restart,
      });
    } catch (error) {
      if (timedOut) throw new RequestTimeoutError(timeout);
      throw toRequestError(error);
    } finally {
      clearTimeout(timer);
    }
  }

  async get<T>(url: string, options?: RequestOptions) {
    return this.send((extra) =>
      axios.get<T>(url, this.config(options, extra)),
    );
  }

  async post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ) {
    return this.send((extra) =>
      axios.post<T>(url, params, this.config(options, extra)),
    );
  }
}

const toRequestError = (error: unknown): RequestError =>
  new RequestError(
    error instanceof Error ? error.message : String(error),
    isAxiosError(error) && error.response ? error.response.data : undefined,
  );

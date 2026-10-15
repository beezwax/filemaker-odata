import axios, {
  AxiosError,
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
      timeout: this.timeout,
      // Makes axios reject timeouts with ETIMEDOUT instead of ECONNABORTED.
      transitional:
        this.timeout === undefined ? undefined : { clarifyTimeoutError: true },
    };
  }

  private toRequestError(error: unknown): RequestError {
    if (
      this.timeout !== undefined &&
      isAxiosError(error) &&
      error.code === AxiosError.ETIMEDOUT
    ) {
      return new RequestTimeoutError(this.timeout);
    }

    return new RequestError(
      error instanceof Error ? error.message : String(error),
      isAxiosError(error) && error.response ? error.response.data : undefined,
    );
  }

  async get<T>(url: string, options?: RequestOptions) {
    try {
      const response = await axios.get<T>(
        url,
        mergeDeep({ ...options } as PlainObject, this.transportConfig()),
      );

      return response;
    } catch (error) {
      throw this.toRequestError(error);
    }
  }

  async post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ) {
    try {
      const response = await axios.post<T>(
        url,
        params,
        mergeDeep({ ...options } as PlainObject, this.transportConfig()),
      );

      return response;
    } catch (error) {
      throw this.toRequestError(error);
    }
  }
}

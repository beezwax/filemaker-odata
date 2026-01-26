import { merge } from "lodash";
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

class RequestError extends Error {
  data?: unknown;

  constructor(message: string, data?: unknown) {
    super(message);
    this.name = "RequestError";
    this.data = data;
  }
}

export const isRequestError = (error: unknown): error is RequestError =>
  error instanceof RequestError;

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

/**
 * An IRequest implementation using Axios
 */
export class Request implements IRequest {
  private credentials: FileMakerCredentials;
  private agent?: unknown;

  constructor(credentials: FileMakerCredentials, agent?: unknown) {
    this.credentials = credentials;
    this.agent = agent;
  }

  async get<T>(url: string, options?: RequestOptions) {
    try {
      const response = await axios.get<T>(
        url,
        merge(
          { ...options },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders,
          },
        ),
      );

      return response;
    } catch (error) {
      // TODO: Refactor
      console.error(error);
      throw new RequestError(
        error instanceof Error ? error.message : String(error),
        isAxiosError(error) && error.response ? error.response.data : undefined,
      );
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
        merge(
          { ...options },
          {
            httpsAgent: this.agent,
            headers: this.credentials.authorizationHeaders,
          },
        ),
      );

      return response;
    } catch (error) {
      // TODO: Refactor
      console.error(error);
      throw new RequestError(
        error instanceof Error ? error.message : String(error),
        isAxiosError(error) && error.response ? error.response.data : undefined,
      );
    }
  }
}

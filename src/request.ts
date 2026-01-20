import { merge } from "lodash";
import axios, { isAxiosError, type ResponseType } from "axios";
import type { FileMakerCredentials } from "./file-maker";

export interface RequestOptions {
  headers?: Record<string, string>;
  responseType?: ResponseType;
}

export class RequestError extends Error {
  data?: unknown;

  constructor(data?: unknown) {
    super();
    this.data = data;
  }
}

export const isRequestError = (error: unknown): error is RequestError =>
  error instanceof RequestError;

export interface IRequest {
  get<T>(url: string, options?: RequestOptions): Promise<T>;
  post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<T>;
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

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
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

      return response.data;
    } catch (error) {
      throw new RequestError(
        isAxiosError(error) && error.response ? error.response.data : undefined,
      );
    }
  }

  async post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<T> {
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

      return response.data;
    } catch (error) {
      throw new RequestError(
        isAxiosError(error) && error.response ? error.response.data : undefined,
      );
    }
  }
}

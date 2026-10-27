import type { ILogger } from "./logger";
import {
  isRequestError,
  isRequestTimeoutError,
  type IRequest,
  type IResponse,
  type RequestError,
  type RequestOptions,
} from "./request";

// 5xx statuses a gateway or FileMaker returns for transient trouble.
const RETRYABLE_GET_STATUSES = new Set([500, 502, 503, 504]);

// Transport errors with no response. Axios keeps Node's error code; in
// browsers every network failure is "ERR_NETWORK".
const RETRYABLE_GET_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ECONNABORTED",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ERR_NETWORK",
]);

// Errors raised before a connection was made, so the request never reached
// the server.
const NOT_SENT_CODES = new Set(["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"]);

const contentTypeOf = (error: RequestError): string => {
  const headers = (error.headers ?? {}) as Record<string, unknown>;
  const key = Object.keys(headers).find(
    (name) => name.toLowerCase() === "content-type",
  );
  return key === undefined ? "" : String(headers[key]).toLowerCase();
};

/**
 * Whether a failed GET is safe to retry. Reads are idempotent, so a GET is
 * retried on any transient failure:
 *   - a 500, 502, 503 or 504 (FileMaker or a proxy in front of it), or
 *   - a transport error with no response (connection reset or refused, DNS
 *     failure, socket hang up, browser network error), or
 *   - our own inactivity timeout (RequestTimeoutError).
 */
export const isRetryableGetError = (error: unknown): boolean => {
  if (!isRequestError(error)) return false;
  if (isRequestTimeoutError(error)) return true;
  if (error.status !== undefined)
    return RETRYABLE_GET_STATUSES.has(error.status);
  return (
    (error.code !== undefined && RETRYABLE_GET_CODES.has(error.code)) ||
    error.message.includes("socket hang up")
  );
};

/**
 * Whether a failed POST is safe to retry. POSTs run scripts and batches that
 * may write, so a POST is retried only when it most likely did not run in
 * FileMaker:
 *   - a 5xx whose body is not JSON, i.e. a proxy error page (such as the
 *     generic "500 Internal Server Error" from a gateway), or
 *   - a connection that could not be made at all (ECONNREFUSED, DNS failure).
 *
 * A JSON error means FileMaker received the request and may have applied it.
 * Timeouts, connection resets and socket hang ups can happen after the body
 * was sent, while FileMaker keeps working. None of these are retried, so a
 * write is never applied twice.
 */
export const isRetryablePostError = (error: unknown): boolean => {
  if (!isRequestError(error) || isRequestTimeoutError(error)) return false;
  if (error.status !== undefined)
    return (
      error.status >= 500 && !contentTypeOf(error).includes("application/json")
    );
  return error.code !== undefined && NOT_SENT_CODES.has(error.code);
};

export interface RetryOptions {
  // How many times to retry a failed request. 0 disables retries.
  retries: number;
  // Delay before the first retry, in ms. Each later retry doubles it. A
  // random jitter of up to the same amount is added.
  baseDelay?: number;
  logger?: ILogger;
}

const DEFAULT_BASE_DELAY = 250;

const isValidRetries = (retries: unknown): retries is number =>
  typeof retries === "number" && Number.isInteger(retries) && retries >= 0;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * An IRequest wrapper that retries requests failing in a transient way, such
 * as a proxy returning a generic 500 error page.
 *
 * GETs are retried on any transient failure (see `isRetryableGetError`).
 * POSTs are retried only when they most likely never reached FileMaker (see
 * `isRetryablePostError`). Other errors, and the last failure, are thrown as
 * they are.
 *
 * Meant to sit inside ConcurrencyLimitRequest and DedupeRequest: a request
 * keeps its slot while it waits to retry, and callers sharing a deduplicated
 * read share its retries.
 */
export class RetryRequest implements IRequest {
  private inner: IRequest;
  private retries: number;
  private baseDelay: number;
  private logger?: ILogger;

  constructor(inner: IRequest, { retries, baseDelay, logger }: RetryOptions) {
    if (!isValidRetries(retries))
      throw new RangeError("retries must be a non-negative integer");

    this.inner = inner;
    this.retries = retries;
    this.baseDelay = baseDelay ?? DEFAULT_BASE_DELAY;
    this.logger = logger;
  }

  get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>> {
    return this.attempt("GET", url, isRetryableGetError, () =>
      this.inner.get<T>(url, options),
    );
  }

  post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<IResponse<T>> {
    return this.attempt("POST", url, isRetryablePostError, () =>
      this.inner.post<T>(url, params, options),
    );
  }

  private async attempt<T>(
    method: string,
    url: string,
    isRetryable: (error: unknown) => boolean,
    send: () => Promise<T>,
  ): Promise<T> {
    for (let retry = 1; ; retry++) {
      try {
        return await send();
      } catch (error) {
        if (retry > this.retries || !isRetryable(error)) throw error;

        const delay = this.delayFor(retry);
        this.logger?.log(
          `[FileMaker] Retrying ${method} ${url} in ${delay} ms (retry ${retry} of ${this.retries}): ${(error as Error).message}`,
        );
        await sleep(delay);
      }
    }
  }

  private delayFor(retry: number) {
    const base = this.baseDelay * 2 ** (retry - 1);
    return Math.round(base + Math.random() * base);
  }
}

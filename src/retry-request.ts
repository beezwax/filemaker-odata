import type { ILogger } from "./logger";
import {
  isRequestError,
  isRequestTimeoutError,
  type IRequest,
  type IResponse,
  type RequestOptions,
} from "./request";

// 5xx statuses a gateway or FileMaker returns for transient trouble.
const RETRYABLE_GET_STATUSES = new Set([500, 502, 503, 504]);

// Transport errors. Axios keeps Node's error code; in browsers every network
// failure is "ERR_NETWORK". A connection dropped while the body was arriving
// may also carry the response (status 200) it was reading.
const RETRYABLE_GET_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ECONNABORTED",
  "ETIMEDOUT",
  "EPIPE",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ERR_NETWORK",
]);

// Messages of connections dropped mid-request. Axios reports a body that
// stopped arriving as "stream has been aborted", with code ERR_BAD_RESPONSE.
// That code alone is not retried: axios also gives it to every 5xx response,
// including ones such as 501 that are not transient.
const DROPPED_CONNECTION_MESSAGES = [
  "socket hang up",
  "stream has been aborted",
];

// Errors raised before a connection was made, so the request never reached
// the server.
const NOT_SENT_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
]);

// Statuses a proxy answers with when it could not hand the request to
// FileMaker at all.
const NOT_SENT_STATUSES = new Set([500, 503]);

/**
 * Whether a failed GET is safe to retry. Reads are idempotent, so a GET is
 * retried on any transient failure:
 *   - a transport error (connection reset, refused or unreachable, DNS
 *     failure, socket hang up, browser network error), even when the
 *     connection dropped after the response started arriving, or
 *   - a 500, 502, 503 or 504 (FileMaker or a proxy in front of it), or
 *   - our own inactivity timeout (RequestTimeoutError).
 */
export const isRetryableGetError = (error: unknown): boolean => {
  if (!isRequestError(error)) return false;
  if (isRequestTimeoutError(error)) return true;
  if (
    (error.code !== undefined && RETRYABLE_GET_CODES.has(error.code)) ||
    DROPPED_CONNECTION_MESSAGES.some((text) => error.message.includes(text))
  )
    return true;
  return error.status !== undefined && RETRYABLE_GET_STATUSES.has(error.status);
};

/**
 * Whether a failed POST is safe to retry. POSTs run scripts and batches that
 * may write, so a POST is retried only when it almost certainly did not run
 * in FileMaker:
 *   - a 500 or 503 that is an HTML page or has no content type, i.e. a proxy
 *     error page (such as the generic "500 Internal Server Error" from a
 *     gateway), or
 *   - a connection that could not be made at all (refused, DNS failure, host
 *     or network unreachable).
 *
 * A JSON, XML, multipart or plain text error may come from FileMaker, which
 * received the request and may have applied it. A 502 or 504 means the proxy
 * may have forwarded the request, then lost the connection to FileMaker or
 * stopped waiting for its answer. Timeouts, connection resets and socket hang ups can happen after
 * the body was sent, while FileMaker keeps working. None of these are
 * retried, so a write is never applied twice.
 */
export const isRetryablePostError = (error: unknown): boolean => {
  if (!isRequestError(error) || isRequestTimeoutError(error)) return false;
  if (error.status !== undefined)
    return (
      NOT_SENT_STATUSES.has(error.status) &&
      (!error.contentType || error.contentType.includes("text/html"))
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

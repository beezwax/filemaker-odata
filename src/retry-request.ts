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
const TRANSIENT_STATUSES = new Set([500, 502, 503, 504]);

// Statuses a proxy answers with when it could not hand the request to
// FileMaker at all.
const PROXY_PAGE_STATUSES = new Set([500, 503]);

// A proxy error page, such as the generic "500 Internal Server Error" from a
// gateway: an HTML page, or one with no content type.
const isProxyErrorPage = ({ status, contentType }: RequestError) =>
  status !== undefined &&
  PROXY_PAGE_STATUSES.has(status) &&
  (!contentType || contentType.includes("text/html"));

/**
 * Whether a failed POST is safe to retry. POSTs run scripts and batches that
 * may write, so a POST is retried only when it almost certainly did not run
 * in FileMaker:
 *   - a 500 or 503 proxy error page (HTML or no content type), or
 *   - a connection that could not be made at all (refused, DNS failure, host
 *     or network unreachable).
 *
 * A JSON, XML, multipart or plain text error may come from FileMaker, which
 * received the request and may have run it. A 502 or 504 means the proxy may
 * have forwarded the request, then lost the connection to FileMaker or
 * stopped waiting for its answer. Timeouts and interrupted connections can
 * happen after the body was sent, while FileMaker keeps working. None of
 * these are retried, which avoids retrying when FileMaker may have run the
 * request. Some risk remains: a proxy can return an HTML 500 after it
 * forwarded the request.
 */
export const isRetryablePostError = (error: unknown): boolean =>
  isRequestError(error) &&
  !isRequestTimeoutError(error) &&
  (error.failure === "not-connected" ||
    (error.failure === "response" && isProxyErrorPage(error)));

/**
 * Whether a failed GET is safe to retry. Reads are idempotent, so a GET is
 * retried on any transient failure: everything a POST is retried on, plus
 *   - our own inactivity timeout (RequestTimeoutError),
 *   - an interrupted connection (reset, aborted, browser network error), even
 *     when it dropped after the response started arriving, or
 *   - a 500, 502, 503 or 504 (FileMaker or a proxy in front of it).
 */
export const isRetryableGetError = (error: unknown): boolean =>
  isRequestTimeoutError(error) ||
  isRetryablePostError(error) ||
  (isRequestError(error) &&
    (error.failure === "interrupted" ||
      (error.failure === "response" &&
        error.status !== undefined &&
        TRANSIENT_STATUSES.has(error.status))));

export interface RetryOptions {
  // How many times to retry a failed request. 0 disables retries.
  retries: number;
  // Delay before the first retry, in ms. Each later retry doubles it, up to
  // 30 s. A random jitter of up to the same amount is added.
  baseDelay?: number;
  logger?: ILogger;
}

const DEFAULT_BASE_DELAY = 250;

// The longest wait before a retry, jitter included, in ms. It also keeps a
// large `retries` from overflowing setTimeout.
const MAX_DELAY = 30_000;

export function assertValidRetries(
  retries: unknown,
): asserts retries is number {
  if (typeof retries !== "number" || !Number.isInteger(retries) || retries < 0)
    throw new RangeError("retries must be a non-negative integer");
}

const isValidBaseDelay = (baseDelay: unknown): baseDelay is number =>
  typeof baseDelay === "number" && Number.isFinite(baseDelay) && baseDelay >= 0;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * An IRequest wrapper that retries requests failing in a transient way, such
 * as a proxy returning a generic 500 error page.
 *
 * GETs are retried on any transient failure. POSTs are retried only when
 * they most likely never reached FileMaker. See `isRetryableGetError` and
 * `isRetryablePostError` above. Other errors, and the last failure, are
 * thrown as they are.
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

  constructor(
    inner: IRequest,
    { retries, baseDelay = DEFAULT_BASE_DELAY, logger }: RetryOptions,
  ) {
    assertValidRetries(retries);
    if (!isValidBaseDelay(baseDelay))
      throw new RangeError("baseDelay must be a non-negative number");

    this.inner = inner;
    this.retries = retries;
    this.baseDelay = baseDelay;
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
    method: "GET" | "POST",
    url: string,
    isRetryable: (error: unknown) => boolean,
    send: () => Promise<T>,
  ): Promise<T> {
    for (let retried = 0; ; retried++) {
      try {
        return await send();
      } catch (error) {
        if (retried >= this.retries || !isRetryable(error)) throw error;

        const delay = this.delayFor(retried);
        this.logger?.log(
          `[FileMaker] Retrying ${method} ${url} in ${delay} ms (retry ${retried + 1} of ${this.retries}): ${error instanceof Error ? error.message : String(error)}`,
        );
        await sleep(delay);
      }
    }
  }

  // The wait before the retry that follows `retried` earlier retries.
  private delayFor(retried: number) {
    const base = this.baseDelay * 2 ** retried;
    return Math.min(MAX_DELAY, Math.round(base + Math.random() * base));
  }
}

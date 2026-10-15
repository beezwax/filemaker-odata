import pLimit from "p-limit";
import type { IRequest, IResponse, RequestOptions } from "./request";

const isValidConcurrency = (concurrency: unknown): boolean =>
  concurrency === Infinity ||
  (typeof concurrency === "number" &&
    Number.isInteger(concurrency) &&
    concurrency > 0);

/**
 * An IRequest wrapper that limits how many requests to the inner request are
 * in flight at once.
 *
 * GETs and POSTs share the same slots. Calls over the limit wait in a queue
 * and start in FIFO order as slots free up. A slot is released as soon as the
 * inner call settles, whether it succeeds or fails. Meant to sit inside
 * DedupeRequest, so shared reads do not take a slot.
 */
export class ConcurrencyLimitRequest implements IRequest {
  private inner: IRequest;
  private limit: ReturnType<typeof pLimit>;

  constructor(inner: IRequest, concurrency: number) {
    if (!isValidConcurrency(concurrency)) {
      throw new RangeError(
        "concurrency must be a positive integer or Infinity",
      );
    }

    this.inner = inner;
    this.limit = pLimit(concurrency);
  }

  get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>> {
    return this.limit(() => this.inner.get<T>(url, options));
  }

  post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<IResponse<T>> {
    return this.limit(() => this.inner.post<T>(url, params, options));
  }
}

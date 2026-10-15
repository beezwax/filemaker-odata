import pLimit from "p-limit";
import type { IRequest, IResponse, RequestOptions } from "./request";

const isValidConcurrency = (concurrency: unknown): boolean =>
  concurrency === Infinity ||
  (typeof concurrency === "number" &&
    Number.isInteger(concurrency) &&
    concurrency > 0);

/**
 * A pool of request slots. Tasks run through `run` start immediately while a
 * slot is free and otherwise wait in a FIFO queue. A slot is released as soon
 * as its task settles, whether it succeeds or fails.
 *
 * Share one instance between several ConcurrencyLimitRequests to make them
 * compete for the same slots.
 */
export class ConcurrencyLimit {
  private limit: ReturnType<typeof pLimit>;

  constructor(concurrency: number) {
    if (!isValidConcurrency(concurrency)) {
      throw new RangeError(
        "concurrency must be a positive integer or Infinity",
      );
    }

    this.limit = pLimit(concurrency);
  }

  run<T>(task: () => Promise<T>): Promise<T> {
    return this.limit(task);
  }
}

/**
 * An IRequest wrapper that limits how many requests to the inner request are
 * in flight at once.
 *
 * GETs and POSTs share the same slots. Calls over the limit wait in a queue
 * and start in FIFO order as slots free up. A slot is released as soon as the
 * inner call settles, whether it succeeds or fails. Meant to sit inside
 * DedupeRequest, so shared reads do not take a slot.
 *
 * Pass a number to give this wrapper its own slots, or a shared
 * ConcurrencyLimit to share slots with other wrappers.
 */
export class ConcurrencyLimitRequest implements IRequest {
  private inner: IRequest;
  private limit: ConcurrencyLimit;

  constructor(inner: IRequest, concurrency: number | ConcurrencyLimit) {
    this.inner = inner;
    this.limit =
      concurrency instanceof ConcurrencyLimit
        ? concurrency
        : new ConcurrencyLimit(concurrency);
  }

  get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>> {
    return this.limit.run(() => this.inner.get<T>(url, options));
  }

  post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<IResponse<T>> {
    return this.limit.run(() => this.inner.post<T>(url, params, options));
  }
}

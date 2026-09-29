import type {
  IRequest,
  IResponse,
  RequestOptions,
} from "./request";

const requestKey = (url: string, options?: RequestOptions) => {
  const sortedHeaders = Object.entries(options?.headers ?? {}).sort(
    ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
  );
  return JSON.stringify([url, options?.responseType ?? null, sortedHeaders]);
};

/**
 * An IRequest wrapper that shares the result of identical in-flight GETs.
 *
 * Only requests that are currently in flight are shared: nothing is cached
 * after a request settles, and errors are never kept. Any POST detaches all
 * in-flight GETs, so a read started after a write never joins a read that
 * started before it.
 */
export class DedupeRequest implements IRequest {
  private inner: IRequest;
  private inFlight = new Map<string, Promise<IResponse<unknown>>>();

  constructor(inner: IRequest) {
    this.inner = inner;
  }

  get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>> {
    const key = requestKey(url, options);
    const existing = this.inFlight.get(key);

    if (existing !== undefined) {
      return existing.then((response) => ({
        ...response,
        data: structuredClone(response.data),
      })) as Promise<IResponse<T>>;
    }

    const promise = this.inner.get<unknown>(url, options);
    this.inFlight.set(key, promise);

    const release = () => {
      if (this.inFlight.get(key) === promise) this.inFlight.delete(key);
    };
    promise.then(release, release);

    return promise as Promise<IResponse<T>>;
  }

  post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<IResponse<T>> {
    this.inFlight.clear();
    return this.inner.post<T>(url, params, options);
  }
}

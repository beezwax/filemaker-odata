import type {
  IRequest,
  IResponse,
  RequestOptions,
} from "./request";

const requestKey = (url: string, options?: RequestOptions) => {
  // Header names are case-insensitive, so `Accept` and `accept` share a key.
  const sortedHeaders = Object.entries(options?.headers ?? {})
    .map(([name, value]) => [name.toLowerCase(), value])
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify([url, options?.responseType ?? null, sortedHeaders]);
};

// structuredClone turns binary views into plain Uint8Arrays (a Node Buffer
// loses its type) and copies the whole backing buffer, so views are copied
// explicitly. `slice` copies, and honours the species of the source, so a
// Buffer stays a Buffer and a Uint16Array stays a Uint16Array.
const cloneData = (data: unknown): unknown => {
  if (!ArrayBuffer.isView(data)) return structuredClone(data);

  if (data instanceof DataView)
    return new DataView(
      data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    );

  return Uint8Array.prototype.slice.call(data);
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
        headers: { ...response.headers },
        data: cloneData(response.data),
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
    this.detachInFlightReads();
    return this.inner.post<T>(url, params, options);
  }

  // Any POST (batch, script) may write, so later reads must not join reads that started before it.
  private detachInFlightReads() {
    this.inFlight.clear();
  }
}

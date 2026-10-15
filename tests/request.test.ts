import axios, { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NullFileMakerCredentials } from "../src/credentials";
import {
  isRequestError,
  isRequestTimeoutError,
  RequestError,
  RequestTimeoutError,
} from "../src/index";
import { Request } from "../src/request";
import { pendingAxios } from "./mocks";

const okResponse = { data: {}, headers: {} };

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const buildRequest = (timeout?: number) =>
  new Request(new NullFileMakerCredentials(), undefined, timeout);

type Config = Record<string, unknown> & {
  onDownloadProgress?: (event: unknown) => void;
  onUploadProgress?: (event: unknown) => void;
};

const configOf = (spy: { mock: { calls: unknown[][] } }, index: number) =>
  spy.mock.calls[0]![index] as Config;

const timeoutKeys = [
  "signal",
  "onDownloadProgress",
  "onUploadProgress",
  "timeout",
  "transitional",
];

describe("Request timeout config", () => {
  test("get without a timeout sends no timer-related keys", async () => {
    const get = vi.spyOn(axios, "get").mockResolvedValue(okResponse);
    await buildRequest().get("http://x");
    const config = configOf(get, 1);
    for (const key of timeoutKeys) expect(key in config).toBe(false);
  });

  test("post without a timeout sends no timer-related keys", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue(okResponse);
    await buildRequest().post("http://x", null);
    const config = configOf(post, 2);
    for (const key of timeoutKeys) expect(key in config).toBe(false);
  });

  test.each([
    ["get", 1],
    ["post", 2],
  ] as const)(
    "%s with a timeout sends a signal and progress callbacks",
    async (method, index) => {
      const spy = vi.spyOn(axios, method).mockResolvedValue(okResponse);
      const request = buildRequest(5000);
      await (method === "get"
        ? request.get("http://x")
        : request.post("http://x", null));
      const config = configOf(spy, index);
      expect(config.signal).toBeInstanceOf(AbortSignal);
      expect(typeof config.onDownloadProgress).toBe("function");
      expect(typeof config.onUploadProgress).toBe("function");
      expect("timeout" in config).toBe(false);
      expect("transitional" in config).toBe(false);
    },
  );
});

describe("Request inactivity timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const send = (method: "get" | "post", timeout: number) => {
    const request = buildRequest(timeout);
    return method === "get"
      ? request.get("http://x")
      : request.post("http://x", null);
  };

  // Tracks whether the promise has settled, and how.
  const track = (promise: Promise<unknown>) => {
    const state: { settled: boolean; error?: unknown; value?: unknown } = {
      settled: false,
    };
    promise.then(
      (value) => Object.assign(state, { settled: true, value }),
      (error: unknown) => Object.assign(state, { settled: true, error }),
    );
    return state;
  };

  test.each(["get", "post"] as const)(
    "%s rejects with a RequestTimeoutError after timeout ms with no progress",
    async (method) => {
      pendingAxios();
      const state = track(send(method, 1000));

      await vi.advanceTimersByTimeAsync(999);
      expect(state.settled).toBe(false);

      await vi.advanceTimersByTimeAsync(1);
      expect(state.settled).toBe(true);
      const error = state.error as RequestTimeoutError;
      expect(isRequestTimeoutError(error)).toBe(true);
      expect(isRequestError(error)).toBe(true);
      expect(error).toBeInstanceOf(RequestTimeoutError);
      expect(error.message).toBe("Request timed out after 1000 ms");
      expect(error.timeout).toBe(1000);
      expect(error.name).toBe("RequestTimeoutError");
      expect(error.data).toBeUndefined();
    },
  );

  test.each([
    ["get", "onDownloadProgress", 1],
    ["post", "onDownloadProgress", 2],
    ["post", "onUploadProgress", 2],
  ] as const)(
    "%s: %s restarts the deadline",
    async (method, callback, index) => {
      const { get, post } = pendingAxios();
      const state = track(send(method, 1000));
      const config = configOf(method === "get" ? get : post, index);

      await vi.advanceTimersByTimeAsync(900);
      config[callback]!({});

      await vi.advanceTimersByTimeAsync(900);
      expect(state.settled).toBe(false);

      await vi.advanceTimersByTimeAsync(100);
      expect(isRequestTimeoutError(state.error)).toBe(true);
    },
  );

  test.each(["get", "post"] as const)(
    "%s returns a response that arrives before the deadline and clears its timer",
    async (method) => {
      const { getResolvers, postResolvers } = pendingAxios();
      const state = track(send(method, 1000));

      await vi.advanceTimersByTimeAsync(500);
      (method === "get" ? getResolvers : postResolvers)[0]!(okResponse);
      await vi.advanceTimersByTimeAsync(0);

      expect(state.value).toBe(okResponse);
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  test.each(["get", "post"] as const)(
    "%s: an ETIMEDOUT not caused by our timer is a plain RequestError",
    async (method) => {
      const { getRejecters, postRejecters } = pendingAxios();
      const state = track(send(method, 1000));

      (method === "get" ? getRejecters : postRejecters)[0]!(
        new AxiosError("connect ETIMEDOUT", AxiosError.ETIMEDOUT),
      );
      await vi.advanceTimersByTimeAsync(0);

      expect(state.error).toBeInstanceOf(RequestError);
      expect(isRequestTimeoutError(state.error)).toBe(false);
      expect((state.error as RequestError).message).toBe("connect ETIMEDOUT");
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  test("other axios errors stay a plain RequestError with a timeout set", async () => {
    const { getRejecters } = pendingAxios();
    const state = track(send("get", 1000));

    getRejecters[0]!(new AxiosError("boom", AxiosError.ERR_BAD_RESPONSE));
    await vi.advanceTimersByTimeAsync(0);

    expect(state.error).toBeInstanceOf(RequestError);
    expect(isRequestTimeoutError(state.error)).toBe(false);
    expect((state.error as RequestError).message).toBe("boom");
  });

  test("ETIMEDOUT without a configured timeout stays a RequestError", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(
      new AxiosError("connect ETIMEDOUT", AxiosError.ETIMEDOUT),
    );
    const error = await buildRequest()
      .post("http://x", null)
      .catch((e: unknown) => e);
    expect(isRequestError(error)).toBe(true);
    expect(isRequestTimeoutError(error)).toBe(false);
  });
});

import { afterEach, describe, expect, test, vi } from "vitest";
import {
  FileMakerClient,
  NullLogger,
  RequestTimeoutError,
  isRequestTimeoutError,
} from "../src/index";
import { configOf, flush, pendingAxios } from "./mocks";

const emptyPage = { data: { value: [] }, headers: {} };

const buildClient = (
  options: { timeout?: number; concurrency?: number; dedupe?: boolean } = {},
) =>
  new FileMakerClient({
    server: "demo.server.beezwax.net",
    database: "test",
    logger: new NullLogger(),
    ...options,
  });

const basicAuth = { username: "user", password: "pass" };

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("FileMakerClient timeout", () => {
  describe("with a timeout", () => {
    test("sends it on a basic auth getRecords", async () => {
      const { get, getResolvers } = pendingAxios();
      const fm = buildClient({ timeout: 300000 }).withBasicAuth(basicAuth);

      const records = fm.getRecords("a");
      await flush();
      getResolvers[0]!(emptyPage);
      await records;

      expect(get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    test("sends it on an OAuth getRecords", async () => {
      const { get, getResolvers } = pendingAxios();
      const fm = buildClient({ timeout: 300000 }).withOAuth({
        requestId: "r",
        identifier: "i",
      });

      const records = fm.getRecords("a");
      await flush();
      getResolvers[0]!(emptyPage);
      await records;

      expect(get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    test("sends it on a script POST", async () => {
      const { post, postResolvers } = pendingAxios();
      const fm = buildClient({ timeout: 300000 }).withBasicAuth(basicAuth);

      const result = fm.script("MyScript");
      await flush();
      postResolvers[0]!({ data: {}, headers: {} });
      await result.catch(() => undefined);

      expect(post).toHaveBeenCalledWith(
        expect.any(String),
        null,
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    test("sends it on getOAuthUrl", async () => {
      const { get, getResolvers } = pendingAxios();
      const result = buildClient({ timeout: 300000 }).getOAuthUrl({
        trackingId: "t",
        provider: "Google",
      });
      await flush();
      getResolvers[0]!({
        data: "https://example.com",
        headers: { "x-fms-request-id": "abc" },
      });
      await result;

      expect(get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    test("sends it on getAuthTypes", async () => {
      const { get, getResolvers } = pendingAxios();
      const result = buildClient({ timeout: 300000 }).getAuthTypes();
      await flush();
      getResolvers[0]!({ data: {}, headers: {} });
      await result;

      expect(get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });
  });

  describe.each([
    ["omitted", undefined],
    ["0", 0],
    ["Infinity", Infinity],
  ])("when timeout is %s", (_label, timeout) => {
    test("sends no timeout on a request", async () => {
      const { get, getResolvers } = pendingAxios();
      const fm = buildClient({ timeout }).withBasicAuth(basicAuth);

      const records = fm.getRecords("a");
      await flush();
      getResolvers[0]!(emptyPage);
      await records;

      expect(configOf(get, 1).signal).toBeUndefined();
      expect(configOf(get, 1).timeout).toBeUndefined();
      expect(configOf(get, 1).transitional).toBeUndefined();
    });

    test("sends no timeout on getAuthTypes", async () => {
      const { get, getResolvers } = pendingAxios();
      const result = buildClient({ timeout }).getAuthTypes();
      await flush();
      getResolvers[0]!({ data: {}, headers: {} });
      await result;

      expect(configOf(get, 1).signal).toBeUndefined();
      expect(configOf(get, 1).timeout).toBeUndefined();
    });
  });

  test.each([-1, NaN, -Infinity, 2147483648, "5000" as unknown as number])(
    "throws a RangeError for timeout %j",
    (timeout) => {
      expect(() => buildClient({ timeout })).toThrow(
        new RangeError(
          "timeout must be a positive number up to 2147483647, 0 or Infinity",
        ),
      );
    },
  );

  test("accepts the largest timer delay, 2147483647", () => {
    expect(() => buildClient({ timeout: 2147483647 })).not.toThrow();
  });

  test("a timed-out request frees its concurrency slot for the next one", async () => {
    vi.useFakeTimers();
    const { get } = pendingAxios();
    const fm = buildClient({ timeout: 1000, concurrency: 1 }).withBasicAuth(
      basicAuth,
    );

    const failure = fm.getRecords("a").catch((error: unknown) => error);
    void fm.getRecords("b").catch(() => undefined);
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    const error = await failure;
    await vi.advanceTimersByTimeAsync(0);

    expect(isRequestTimeoutError(error)).toBe(true);
    expect(get).toHaveBeenCalledTimes(2);
  });

  test("shares a timeout failure with deduplicated callers, then sends a fresh request", async () => {
    vi.useFakeTimers();
    const { get } = pendingAxios();
    const fm = buildClient({ timeout: 1000 }).withBasicAuth(basicAuth);

    const first = fm.getRecords("a").catch((error: unknown) => error);
    const second = fm.getRecords("a").catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1000);
    const errors = await Promise.all([first, second]);

    expect(errors[0]).toBeInstanceOf(RequestTimeoutError);
    expect(errors[1]).toBeInstanceOf(RequestTimeoutError);

    void fm.getRecords("a").catch(() => undefined);
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledTimes(2);
  });
});

import { AxiosError } from "axios";
import { afterEach, describe, expect, test, vi } from "vitest";
import {
  FileMakerClient,
  NullLogger,
  RequestTimeoutError,
  isRequestTimeoutError,
} from "../src/index";
import { flush, pendingAxios } from "./mocks";

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

const timeoutError = () =>
  new AxiosError("timeout of 300000ms exceeded", AxiosError.ETIMEDOUT);

// The config object axios received on its first call.
const configOf = (spy: { mock: { calls: unknown[][] } }, index: number) =>
  spy.mock.calls[0]![index] as Record<string, unknown>;

afterEach(() => {
  vi.restoreAllMocks();
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
        expect.objectContaining({ timeout: 300000 }),
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
        expect.objectContaining({ timeout: 300000 }),
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
        expect.objectContaining({ timeout: 300000 }),
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
        expect.objectContaining({ timeout: 300000 }),
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
        expect.objectContaining({ timeout: 300000 }),
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

      expect(configOf(get, 1).timeout).toBeUndefined();
      expect(configOf(get, 1).transitional).toBeUndefined();
    });

    test("sends no timeout on getAuthTypes", async () => {
      const { get, getResolvers } = pendingAxios();
      const result = buildClient({ timeout }).getAuthTypes();
      await flush();
      getResolvers[0]!({ data: {}, headers: {} });
      await result;

      expect(configOf(get, 1).timeout).toBeUndefined();
    });
  });

  test.each([-1, NaN, -Infinity, "5000" as unknown as number])(
    "throws a RangeError for timeout %j",
    (timeout) => {
      expect(() => buildClient({ timeout })).toThrow(RangeError);
    },
  );

  test("a timed-out request frees its concurrency slot for the next one", async () => {
    const { get, getRejecters } = pendingAxios();
    const fm = buildClient({ timeout: 300000, concurrency: 1 }).withBasicAuth(
      basicAuth,
    );

    const first = fm.getRecords("a");
    const failure = first.catch((error: unknown) => error);
    void fm.getRecords("b");
    await flush();
    expect(get).toHaveBeenCalledTimes(1);

    getRejecters[0]!(timeoutError());
    const error = await failure;
    await flush();

    expect(isRequestTimeoutError(error)).toBe(true);
    expect(get).toHaveBeenCalledTimes(2);
  });

  test("shares a timeout failure with deduplicated callers, then sends a fresh request", async () => {
    const { get, getRejecters } = pendingAxios();
    const fm = buildClient({ timeout: 300000 }).withBasicAuth(basicAuth);

    const first = fm.getRecords("a").catch((error: unknown) => error);
    const second = fm.getRecords("a").catch((error: unknown) => error);
    await flush();
    expect(get).toHaveBeenCalledTimes(1);

    getRejecters[0]!(timeoutError());
    const errors = await Promise.all([first, second]);

    expect(errors[0]).toBeInstanceOf(RequestTimeoutError);
    expect(errors[1]).toBeInstanceOf(RequestTimeoutError);

    void fm.getRecords("a");
    await flush();
    expect(get).toHaveBeenCalledTimes(2);
  });
});

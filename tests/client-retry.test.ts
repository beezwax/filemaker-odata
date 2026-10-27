import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import {
  FileMakerClient,
  NullLogger,
  isRequestError,
  isRequestTimeoutError,
} from "../src/index";
import { pendingAxios } from "./mocks";

const emptyPage = { data: { value: [] }, headers: {} };
const page = { data: { value: [{ id: 1 }] }, headers: {} };

const buildClient = (
  options: { retries?: number; concurrency?: number; timeout?: number } = {},
) =>
  new FileMakerClient({
    server: "demo.server.beezwax.net",
    database: "test",
    logger: new NullLogger(),
    ...options,
  });

const basicAuth = { username: "user", password: "pass" };

const errorResponse = (status: number, contentType: string, data: unknown) =>
  new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_RESPONSE,
    undefined,
    undefined,
    { status, headers: { "content-type": contentType }, data } as never,
  );

// The generic error page a proxy in front of FileMaker returns.
const proxy500 = () => errorResponse(500, "text/html", "<html>500</html>");
// A structured error from FileMaker itself.
const fileMaker500 = () =>
  errorResponse(500, "application/json; charset=utf-8", { error: {} });

// Runs every pending retry delay (at most 500 ms for the first retry).
const pastRetryDelay = () => vi.advanceTimersByTimeAsync(1000);

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("FileMakerClient retries", () => {
  test("retries a GET once by default after a proxy 500", async () => {
    const { get, getRejecters, getResolvers } = pendingAxios();
    const fm = buildClient().withBasicAuth(basicAuth);

    const records = fm.getRecords("a");
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await pastRetryDelay();
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1]![0]).toBe(get.mock.calls[0]![0]);

    getResolvers[1]!(page);
    await expect(records).resolves.toEqual([{ id: 1 }]);
  });

  test("throws the second failure of a GET by default", async () => {
    const { get, getRejecters } = pendingAxios();
    const fm = buildClient().withBasicAuth(basicAuth);

    const failure = fm.getRecords("a").catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await pastRetryDelay();
    getRejecters[1]!(fileMaker500());
    const error = await failure;

    expect(get).toHaveBeenCalledTimes(2);
    expect(isRequestError(error)).toBe(true);
    expect(error).toMatchObject({ status: 500, data: { error: {} } });
  });

  test("retries a script POST after a proxy 500", async () => {
    const { post, postRejecters, postResolvers } = pendingAxios();
    const fm = buildClient().withBasicAuth(basicAuth);

    const result = fm.script("MyScript", { a: 1 });
    await vi.advanceTimersByTimeAsync(0);
    postRejecters[0]!(proxy500());
    await pastRetryDelay();
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1]).toEqual(post.mock.calls[0]);

    postResolvers[1]!({
      data: { scriptResult: { code: 0, resultParameter: "ok" } },
      headers: {},
    });
    await expect(result).resolves.toEqual({ success: true, data: "ok" });
  });

  test("does not retry a POST that FileMaker answered with a JSON error", async () => {
    const { post, postRejecters } = pendingAxios();
    const fm = buildClient().withBasicAuth(basicAuth);

    const failure = fm.script("MyScript").catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    postRejecters[0]!(fileMaker500());
    await pastRetryDelay();

    expect(isRequestError(await failure)).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
  });

  const batchCreate = (fm: ReturnType<typeof buildClient>) =>
    fm
      .withBasicAuth(basicAuth)
      .batch()
      .create({ table: "T", record: { a: 1 } })
      .execute()
      .catch((error: unknown) => error);

  test("retries a batch POST after a proxy 500, with the same body", async () => {
    const { post, postRejecters, postResolvers } = pendingAxios();

    const result = batchCreate(buildClient());
    await vi.advanceTimersByTimeAsync(0);
    postRejecters[0]!(proxy500());
    await pastRetryDelay();
    expect(post).toHaveBeenCalledTimes(2);
    expect(post.mock.calls[1]).toEqual(post.mock.calls[0]);

    // An empty body fails to parse, which shows the second response was used.
    postResolvers[1]!({ data: "", headers: {} });
    expect(await result).toEqual(new Error("Could not find changeset"));
  });

  test("does not retry a POST that timed out", async () => {
    const { post } = pendingAxios();
    const fm = buildClient({ timeout: 1000 }).withBasicAuth(basicAuth);

    const failure = fm.script("MyScript").catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(1000);
    await pastRetryDelay();

    expect(isRequestTimeoutError(await failure)).toBe(true);
    expect(post).toHaveBeenCalledTimes(1);
  });

  test("retries a GET that timed out, with a fresh timeout", async () => {
    const { get, getResolvers } = pendingAxios();
    const fm = buildClient({ timeout: 1000 }).withBasicAuth(basicAuth);

    const records = fm.getRecords("a");
    await vi.advanceTimersByTimeAsync(1000);
    await pastRetryDelay();
    expect(get).toHaveBeenCalledTimes(2);

    getResolvers[1]!(emptyPage);
    await expect(records).resolves.toEqual([]);
  });

  test("retries getAuthTypes", async () => {
    const { get, getRejecters, getResolvers } = pendingAxios();

    const result = buildClient().getAuthTypes();
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await pastRetryDelay();
    getResolvers[1]!({ data: {}, headers: {} });

    await expect(result).resolves.toEqual(["basic"]);
    expect(get).toHaveBeenCalledTimes(2);
  });

  test("retries getOAuthUrl", async () => {
    const { get, getRejecters, getResolvers } = pendingAxios();

    const result = buildClient().getOAuthUrl({
      trackingId: "t",
      provider: "Google",
    });
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await pastRetryDelay();
    getResolvers[1]!({
      data: "https://oauth/redirect",
      headers: { "x-fms-request-id": "abc" },
    });

    await expect(result).resolves.toEqual({
      redirectUrl: "https://oauth/redirect",
      requestId: "abc",
    });
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1]).toEqual(get.mock.calls[0]);
  });

  test("retries: 0 turns retries off", async () => {
    const { get, getRejecters } = pendingAxios();
    const fm = buildClient({ retries: 0 }).withBasicAuth(basicAuth);

    const failure = fm.getRecords("a").catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await pastRetryDelay();

    expect(isRequestError(await failure)).toBe(true);
    expect(get).toHaveBeenCalledTimes(1);
  });

  test("retries a GET as many times as `retries`", async () => {
    const { get, getRejecters } = pendingAxios();
    const fm = buildClient({ retries: 2 }).withBasicAuth(basicAuth);

    const failure = fm.getRecords("a").catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await pastRetryDelay();
    getRejecters[1]!(proxy500());
    await pastRetryDelay();
    getRejecters[2]!(proxy500());

    expect(isRequestError(await failure)).toBe(true);
    expect(get).toHaveBeenCalledTimes(3);
  });

  test("a request keeps its concurrency slot while it waits to retry", async () => {
    const { get, getRejecters } = pendingAxios();
    const fm = buildClient({ concurrency: 1 }).withBasicAuth(basicAuth);

    void fm.getRecords("a").catch(() => undefined);
    void fm.getRecords("b").catch(() => undefined);
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await vi.advanceTimersByTimeAsync(0);
    expect(get).toHaveBeenCalledTimes(1);

    await pastRetryDelay();
    expect(get).toHaveBeenCalledTimes(2);
    expect(get.mock.calls[1]![0]).toContain("/a?");
  });

  test("deduplicated callers share one retry", async () => {
    const { get, getRejecters, getResolvers } = pendingAxios();
    const fm = buildClient().withBasicAuth(basicAuth);

    const first = fm.getRecords("a");
    const second = fm.getRecords("a");
    await vi.advanceTimersByTimeAsync(0);
    getRejecters[0]!(proxy500());
    await pastRetryDelay();
    getResolvers[1]!(page);

    await expect(first).resolves.toEqual([{ id: 1 }]);
    await expect(second).resolves.toEqual([{ id: 1 }]);
    expect(get).toHaveBeenCalledTimes(2);
  });

  test.each([-1, 1.5, NaN, Infinity, "1" as unknown as number])(
    "throws a RangeError for retries %j",
    (retries) => {
      expect(() => buildClient({ retries })).toThrow(
        new RangeError("retries must be a non-negative integer"),
      );
    },
  );
});

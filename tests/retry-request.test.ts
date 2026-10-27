import { afterEach, describe, expect, test, vi } from "vitest";
import {
  isRetryableGetError,
  isRetryablePostError,
  RequestError,
  RequestTimeoutError,
  RetryRequest,
} from "../src/index";
import type { IRequest } from "../src/request";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const html500 = () =>
  new RequestError("Request failed with status code 500", "<html>", {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
    code: "ERR_BAD_RESPONSE",
  });

const json500 = () =>
  new RequestError(
    "Request failed with status code 500",
    { error: {} },
    {
      status: 500,
      headers: { "Content-Type": "application/json;charset=utf-8" },
      code: "ERR_BAD_RESPONSE",
    },
  );

const status = (code: number, contentType = "text/html") =>
  new RequestError(`status ${code}`, undefined, {
    status: code,
    headers: { "content-type": contentType },
  });

const network = (code: string, message = code) =>
  new RequestError(message, undefined, { code });

describe("isRetryableGetError", () => {
  test.each([
    ["an HTML 500", html500()],
    ["a JSON 500", json500()],
    ["a 502", status(502)],
    ["a 503", status(503)],
    ["a 504", status(504)],
    ["ECONNRESET", network("ECONNRESET")],
    ["ECONNREFUSED", network("ECONNREFUSED")],
    ["ETIMEDOUT", network("ETIMEDOUT")],
    ["ENOTFOUND", network("ENOTFOUND")],
    ["a browser network error", network("ERR_NETWORK", "Network Error")],
    ["a socket hang up", new RequestError("socket hang up")],
    ["our inactivity timeout", new RequestTimeoutError(1000)],
  ])("retries %s", (_label, error) => {
    expect(isRetryableGetError(error)).toBe(true);
  });

  test.each([
    ["a 400", status(400)],
    ["a 401", status(401)],
    ["a 404", status(404)],
    ["a 501", status(501)],
    ["a cancelled request", network("ERR_CANCELED", "canceled")],
    ["an error with no code", new RequestError("boom")],
    ["a non-request error", new Error("socket hang up")],
  ])("does not retry %s", (_label, error) => {
    expect(isRetryableGetError(error)).toBe(false);
  });
});

describe("isRetryablePostError", () => {
  test.each([
    ["an HTML 500 (proxy error page)", html500()],
    ["a 502 with no content type", new RequestError("x", "", { status: 502 })],
    ["a plain text 503", status(503, "text/plain")],
    ["ECONNREFUSED", network("ECONNREFUSED")],
    ["ENOTFOUND", network("ENOTFOUND")],
    ["EAI_AGAIN", network("EAI_AGAIN")],
  ])("retries %s", (_label, error) => {
    expect(isRetryablePostError(error)).toBe(true);
  });

  test.each([
    ["a JSON 500 from FileMaker", json500()],
    ["a JSON 503", status(503, "application/json")],
    ["a 400", status(400)],
    ["our inactivity timeout", new RequestTimeoutError(1000)],
    ["ECONNRESET", network("ECONNRESET")],
    ["ETIMEDOUT", network("ETIMEDOUT")],
    ["a socket hang up", network("ECONNRESET", "socket hang up")],
    ["a browser network error", network("ERR_NETWORK", "Network Error")],
    ["an error with no code", new RequestError("boom")],
    ["a non-request error", new Error("boom")],
  ])("does not retry %s", (_label, error) => {
    expect(isRetryablePostError(error)).toBe(false);
  });
});

const okResponse = { data: "ok", headers: {} };

// An inner request whose GET and POST fail with the given errors in order,
// then succeed.
const failing = (...errors: Error[]) => {
  const queue = (list: Error[]) => {
    const pending = [...list];
    return vi.fn(() => {
      const error = pending.shift();
      return error ? Promise.reject(error) : Promise.resolve(okResponse);
    });
  };
  const inner = { get: queue(errors), post: queue(errors) };
  return inner as typeof inner & IRequest;
};

describe("RetryRequest", () => {
  test.each(["get", "post"] as const)(
    "%s retries a retryable failure and returns the response",
    async (method) => {
      const inner = failing(html500());
      const request = new RetryRequest(inner, { retries: 1, baseDelay: 0 });

      const response = await (method === "get"
        ? request.get("http://x")
        : request.post("http://x", "body"));

      expect(response).toBe(okResponse);
      expect(inner[method]).toHaveBeenCalledTimes(2);
    },
  );

  test("sends the same arguments on every attempt", async () => {
    const inner = failing(html500());
    const request = new RetryRequest(inner, { retries: 1, baseDelay: 0 });
    const options = { headers: { "Content-Type": "text/plain" } };

    await request.post("http://x", "body", options);

    expect(inner.post).toHaveBeenNthCalledWith(1, "http://x", "body", options);
    expect(inner.post).toHaveBeenNthCalledWith(2, "http://x", "body", options);
  });

  test("throws the last error once retries run out", async () => {
    const last = html500();
    const inner = failing(html500(), html500(), last);
    const request = new RetryRequest(inner, { retries: 2, baseDelay: 0 });

    await expect(request.get("http://x")).rejects.toBe(last);
    expect(inner.get).toHaveBeenCalledTimes(3);
  });

  test("does not retry an error that is not retryable", async () => {
    const error = json500();
    const inner = failing(error);
    const request = new RetryRequest(inner, { retries: 3, baseDelay: 0 });

    await expect(request.post("http://x", null)).rejects.toBe(error);
    expect(inner.post).toHaveBeenCalledTimes(1);
  });

  test("stops retrying at the first non-retryable error", async () => {
    const error = status(404);
    const inner = failing(html500(), error);
    const request = new RetryRequest(inner, { retries: 3, baseDelay: 0 });

    await expect(request.get("http://x")).rejects.toBe(error);
    expect(inner.get).toHaveBeenCalledTimes(2);
  });

  test("retries: 0 sends each request once", async () => {
    const error = html500();
    const inner = failing(error);
    const request = new RetryRequest(inner, { retries: 0 });

    await expect(request.get("http://x")).rejects.toBe(error);
    expect(inner.get).toHaveBeenCalledTimes(1);
  });

  test("waits an exponential delay with jitter between attempts", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const inner = failing(html500(), html500());
    const request = new RetryRequest(inner, { retries: 2, baseDelay: 100 });

    const result = request.get("http://x");
    await vi.advanceTimersByTimeAsync(0);
    expect(inner.get).toHaveBeenCalledTimes(1);

    // First retry: 100 ms + 50 ms jitter.
    await vi.advanceTimersByTimeAsync(149);
    expect(inner.get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(inner.get).toHaveBeenCalledTimes(2);

    // Second retry: 200 ms + 100 ms jitter.
    await vi.advanceTimersByTimeAsync(299);
    expect(inner.get).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(inner.get).toHaveBeenCalledTimes(3);

    await expect(result).resolves.toBe(okResponse);
  });

  test("defaults to a 250 ms base delay", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const inner = failing(html500());
    const request = new RetryRequest(inner, { retries: 1 });

    void request.get("http://x");
    await vi.advanceTimersByTimeAsync(249);
    expect(inner.get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(inner.get).toHaveBeenCalledTimes(2);
  });

  test("logs each retry", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const logger = { log: vi.fn() };
    const inner = failing(html500());
    const request = new RetryRequest(inner, {
      retries: 1,
      baseDelay: 0,
      logger,
    });

    await request.get("http://x");

    expect(logger.log).toHaveBeenCalledWith(
      "[FileMaker] Retrying GET http://x in 0 ms (retry 1 of 1): Request failed with status code 500",
    );
  });

  test.each([-1, 1.5, NaN, Infinity, "1" as unknown as number])(
    "throws a RangeError for retries %j",
    (retries) => {
      expect(() => new RetryRequest(failing(), { retries })).toThrow(
        new RangeError("retries must be a non-negative integer"),
      );
    },
  );
});

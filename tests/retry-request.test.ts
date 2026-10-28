import { afterEach, describe, expect, test, vi } from "vitest";
import {
  RequestError,
  RequestTimeoutError,
  type IRequest,
  type RequestFailure,
} from "../src/request";
import {
  isRetryableGetError,
  isRetryablePostError,
  RetryRequest,
} from "../src/retry-request";

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const html500 = () =>
  new RequestError("Request failed with status code 500", "<html>", {
    status: 500,
    contentType: "text/html; charset=utf-8",
    failure: "response",
  });

const json500 = () =>
  new RequestError(
    "Request failed with status code 500",
    { error: {} },
    {
      status: 500,
      contentType: "application/json;charset=utf-8",
      failure: "response",
    },
  );

const status = (code: number, contentType: string | undefined = "text/html") =>
  new RequestError(`status ${code}`, undefined, {
    status: code,
    contentType,
    failure: "response",
  });

const failed = (failure: RequestFailure) =>
  new RequestError(failure, undefined, { failure });

// A connection dropped while the response body was arriving: the error keeps
// the response that was being read.
const midBody = () =>
  new RequestError("stream has been aborted", undefined, {
    status: 200,
    failure: "interrupted",
  });

describe("isRetryableGetError", () => {
  test.each([
    ["an HTML 500", html500()],
    ["a JSON 500", json500()],
    ["a 502", status(502)],
    ["a 503", status(503)],
    ["a 504", status(504)],
    ["a connection that could not be made", failed("not-connected")],
    ["an interrupted connection", failed("interrupted")],
    ["a connection dropped mid-response", midBody()],
    ["our inactivity timeout", new RequestTimeoutError(1000)],
  ])("retries %s", (_label, error) => {
    expect(isRetryableGetError(error)).toBe(true);
  });

  test.each([
    ["a 400", status(400)],
    ["a 401", status(401)],
    ["a 404", status(404)],
    ["a 501", status(501)],
    ["an other failure", failed("other")],
    [
      "an other failure with a 500 status",
      new RequestError("x", undefined, { status: 500 }),
    ],
    ["an error with no details", new RequestError("boom")],
    ["a non-request error", new Error("socket hang up")],
  ])("does not retry %s", (_label, error) => {
    expect(isRetryableGetError(error)).toBe(false);
  });
});

describe("isRetryablePostError", () => {
  test.each([
    ["an HTML 500 (proxy error page)", html500()],
    ["an HTML 503", status(503)],
    ["a 500 with no content type", status(500, undefined)],
    ["a connection that could not be made", failed("not-connected")],
  ])("retries %s", (_label, error) => {
    expect(isRetryablePostError(error)).toBe(true);
  });

  test.each([
    ["a JSON 500 from FileMaker", json500()],
    ["an HTML 502", status(502)],
    ["an HTML 504", status(504)],
    ["a plain text 503", status(503, "text/plain")],
    ["an XML 500", status(500, "application/xml")],
    ["a multipart 500", status(500, "multipart/mixed; boundary=b")],
    ["a 400", status(400)],
    ["our inactivity timeout", new RequestTimeoutError(1000)],
    ["an interrupted connection", failed("interrupted")],
    ["a connection dropped mid-response", midBody()],
    [
      "an interrupted connection with an HTML 500",
      new RequestError("x", undefined, {
        status: 500,
        contentType: "text/html",
        failure: "interrupted",
      }),
    ],
    ["an other failure", failed("other")],
    ["an error with no details", new RequestError("boom")],
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

  test("caps each delay at 30 s", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const inner = failing(...Array.from({ length: 9 }, html500));
    const request = new RetryRequest(inner, { retries: 20, baseDelay: 250 });

    const result = request.get("http://x");
    // Retries 1 to 7 wait 250 ms doubled each time: 31750 ms in all.
    await vi.advanceTimersByTimeAsync(31750);
    expect(inner.get).toHaveBeenCalledTimes(8);

    // Retry 8 would wait 32000 ms uncapped, retry 9 64000 ms.
    for (const calls of [9, 10]) {
      await vi.advanceTimersByTimeAsync(29999);
      expect(inner.get).toHaveBeenCalledTimes(calls - 1);
      await vi.advanceTimersByTimeAsync(1);
      expect(inner.get).toHaveBeenCalledTimes(calls);
    }

    await expect(result).resolves.toBe(okResponse);
  });

  test.each([-1, 1.5, NaN, Infinity, "1" as unknown as number])(
    "throws a RangeError for retries %j",
    (retries) => {
      expect(() => new RetryRequest(failing(), { retries })).toThrow(
        new RangeError("retries must be a non-negative integer"),
      );
    },
  );

  test.each([-1, NaN, Infinity, "1" as unknown as number])(
    "throws a RangeError for baseDelay %j",
    (baseDelay) => {
      expect(
        () => new RetryRequest(failing(), { retries: 1, baseDelay }),
      ).toThrow(new RangeError("baseDelay must be a non-negative number"));
    },
  );
});

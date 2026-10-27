import axios, { AxiosError, AxiosHeaders, CanceledError } from "axios";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { NullFileMakerCredentials } from "../src/credentials";
import {
  isRequestError,
  isRequestTimeoutError,
  RequestError,
  RequestTimeoutError,
} from "../src/index";
import { Request } from "../src/request";
import { configOf, pendingAxios } from "./mocks";

const okResponse = { data: {}, headers: {} };

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

const buildRequest = (timeout?: number) =>
  new Request(new NullFileMakerCredentials(), undefined, timeout);

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
    "%s with a timeout sends a signal and a download progress callback only",
    async (method, index) => {
      const spy = vi.spyOn(axios, method).mockResolvedValue(okResponse);
      const request = buildRequest(5000);
      await (method === "get"
        ? request.get("http://x")
        : request.post("http://x", null));
      const config = configOf(spy, index);
      expect(config.signal).toBeInstanceOf(AbortSignal);
      expect(typeof config.onDownloadProgress).toBe("function");
      expect("onUploadProgress" in config).toBe(false);
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
    ["get", 1],
    ["post", 2],
  ] as const)(
    "%s: onDownloadProgress restarts the deadline",
    async (method, index) => {
      const { get, post } = pendingAxios();
      const state = track(send(method, 1000));
      const config = configOf(method === "get" ? get : post, index);

      await vi.advanceTimersByTimeAsync(900);
      config.onDownloadProgress!({});

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

describe("Request error details", () => {
  const failWith = (headers: unknown) =>
    vi
      .spyOn(axios, "get")
      .mockRejectedValue(
        new AxiosError(
          "Request failed with status code 500",
          AxiosError.ERR_BAD_RESPONSE,
          undefined,
          undefined,
          { status: 500, headers, data: "<html>" } as never,
        ),
      );

  const getError = () =>
    buildRequest()
      .get("http://x")
      .catch((e: unknown) => e) as Promise<RequestError>;

  test("keeps the status, content type, failure and body of an error response", async () => {
    failWith({ "Content-Type": "Text/HTML", "Set-Cookie": "session=secret" });

    const error = await getError();

    expect(error).toBeInstanceOf(RequestError);
    expect(error.status).toBe(500);
    expect(error.contentType).toBe("text/html");
    expect(error.failure).toBe("response");
    expect(error.data).toBe("<html>");
    expect(JSON.stringify(error)).not.toContain("secret");
  });

  test("reads the content type from AxiosHeaders", async () => {
    failWith(new AxiosHeaders({ "Content-Type": "text/HTML; charset=utf-8" }));

    const error = await getError();

    expect(error.contentType).toBe("text/html; charset=utf-8");
  });

  test("leaves the content type undefined when the response has none", async () => {
    failWith({});

    const error = await getError();

    expect(error.status).toBe(500);
    expect(error.contentType).toBeUndefined();
  });

  test("classifies a transport error with no response", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(
      new AxiosError("connect ECONNREFUSED", "ECONNREFUSED"),
    );

    const error = (await buildRequest()
      .post("http://x", null)
      .catch((e: unknown) => e)) as RequestError;

    expect(error.failure).toBe("not-connected");
    expect(error.status).toBeUndefined();
    expect(error.contentType).toBeUndefined();
    expect(error.data).toBeUndefined();
  });

  test("leaves the details empty for a non-axios error", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(new Error("boom"));

    const error = (await buildRequest()
      .get("http://x")
      .catch((e: unknown) => e)) as RequestError;

    expect(error.message).toBe("boom");
    expect(error.status).toBeUndefined();
    expect(error.failure).toBe("other");
  });
});

describe("Request failure kind", () => {
  const response = (status: number) =>
    ({ status, headers: {}, data: "" }) as never;

  test.each([
    [
      "a refused connection",
      new AxiosError("connect ECONNREFUSED", "ECONNREFUSED"),
      "not-connected",
    ],
    [
      "a DNS failure",
      new AxiosError("getaddrinfo ENOTFOUND", "ENOTFOUND"),
      "not-connected",
    ],
    [
      "a connection reset",
      new AxiosError("socket hang up", "ECONNRESET"),
      "interrupted",
    ],
    [
      "a connection reset mid-response",
      new AxiosError(
        "aborted",
        "ECONNRESET",
        undefined,
        undefined,
        response(200),
      ),
      "interrupted",
    ],
    [
      "a body stream aborted mid-response",
      new AxiosError(
        "stream has been aborted",
        AxiosError.ERR_BAD_RESPONSE,
        undefined,
        undefined,
        response(200),
      ),
      "interrupted",
    ],
    [
      "a 500 response",
      new AxiosError(
        "Request failed with status code 500",
        AxiosError.ERR_BAD_RESPONSE,
        undefined,
        undefined,
        response(500),
      ),
      "response",
    ],
    [
      "a rejected 304 response",
      new AxiosError(
        "Request failed with status code 304",
        AxiosError.ERR_BAD_RESPONSE,
        undefined,
        undefined,
        response(304),
      ),
      "response",
    ],
    [
      "a 404 response",
      new AxiosError(
        "Request failed with status code 404",
        AxiosError.ERR_BAD_REQUEST,
        undefined,
        undefined,
        response(404),
      ),
      "response",
    ],
    [
      "a body over maxContentLength",
      new AxiosError(
        "maxContentLength size of 10 exceeded",
        AxiosError.ERR_BAD_RESPONSE,
      ),
      "other",
    ],
    [
      "a browser network error",
      new AxiosError("Network Error", AxiosError.ERR_NETWORK),
      "interrupted",
    ],
    ["a cancelled request", new CanceledError(), "other"],
    ["a non-axios error", new Error("boom"), "other"],
  ])("classifies %s", async (_label, cause, failure) => {
    vi.spyOn(axios, "get").mockRejectedValue(cause);

    const error = (await buildRequest()
      .get("http://x")
      .catch((e: unknown) => e)) as RequestError;

    expect(error).toBeInstanceOf(RequestError);
    expect(error.failure).toBe(failure);
  });

  test("classifies our inactivity timeout as interrupted", async () => {
    vi.useFakeTimers();
    pendingAxios();

    const failure = buildRequest(1000)
      .get("http://x")
      .catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(1000);
    const error = await failure;

    expect(isRequestTimeoutError(error)).toBe(true);
    expect((error as RequestError).failure).toBe("interrupted");
  });
});

// Just enough of node:http for a local server. The test tsconfig has no Node
// types; tests run in Node.
interface NodeHttp {
  createServer(
    handler: (
      req: unknown,
      res: {
        writeHead(status: number, headers: Record<string, string>): void;
        write(chunk: string, callback: () => void): void;
        destroy(): void;
      },
    ) => void,
  ): {
    listen(port: number, host: string, callback: () => void): void;
    once(event: "error", listener: (error: unknown) => void): void;
    address(): { port: number };
    close(): void;
  };
}

describe("Request failure kind with the real axios adapter", () => {
  test("classifies a connection dropped mid-body as interrupted", async () => {
    const moduleName = "node:http";
    const http = (await import(/* @vite-ignore */ moduleName)) as NodeHttp;
    // Sends the headers and part of the body, then drops the connection.
    const server = http.createServer((_req, res) => {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": "100",
      });
      res.write("{", () => res.destroy());
    });
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address();
      const error = (await buildRequest()
        .get(`http://127.0.0.1:${port}/`)
        .catch((e: unknown) => e)) as RequestError;

      expect(error).toBeInstanceOf(RequestError);
      expect(error.failure).toBe("interrupted");
    } finally {
      server.close();
    }
  });
});

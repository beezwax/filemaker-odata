import axios, { AxiosError } from "axios";
import { afterEach, describe, expect, test, vi } from "vitest";
import { NullFileMakerCredentials } from "../src/credentials";
import {
  isRequestError,
  isRequestTimeoutError,
  RequestError,
  RequestTimeoutError,
} from "../src/index";
import { Request } from "../src/request";

const okResponse = { data: {}, headers: {} };

afterEach(() => {
  vi.restoreAllMocks();
});

const buildRequest = (timeout?: number) =>
  new Request(new NullFileMakerCredentials(), undefined, timeout);

const configOf = (spy: { mock: { calls: unknown[][] } }, index: number) =>
  spy.mock.calls[0]![index] as Record<string, unknown>;

describe("Request timeout config", () => {
  test("get passes timeout and clarifyTimeoutError to axios", async () => {
    const get = vi.spyOn(axios, "get").mockResolvedValue(okResponse);
    await buildRequest(5000).get("http://x");
    expect(get).toHaveBeenCalledWith(
      "http://x",
      expect.objectContaining({
        timeout: 5000,
        transitional: { clarifyTimeoutError: true },
      }),
    );
  });

  test("post passes timeout and clarifyTimeoutError to axios", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue(okResponse);
    await buildRequest(5000).post("http://x", null);
    expect(post).toHaveBeenCalledWith(
      "http://x",
      null,
      expect.objectContaining({
        timeout: 5000,
        transitional: { clarifyTimeoutError: true },
      }),
    );
  });

  test("get without a timeout sends no timeout or transitional key", async () => {
    const get = vi.spyOn(axios, "get").mockResolvedValue(okResponse);
    await buildRequest().get("http://x");
    const config = configOf(get, 1);
    expect("timeout" in config).toBe(false);
    expect("transitional" in config).toBe(false);
  });

  test("post without a timeout sends no timeout or transitional key", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue(okResponse);
    await buildRequest().post("http://x", null);
    const config = configOf(post, 2);
    expect("timeout" in config).toBe(false);
    expect("transitional" in config).toBe(false);
  });
});

describe("Request timeout errors", () => {
  const timeoutError = () =>
    new AxiosError("timeout of 5000ms exceeded", AxiosError.ETIMEDOUT);

  test("get rejects with a RequestTimeoutError on ETIMEDOUT", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(timeoutError());
    const error = await buildRequest(5000)
      .get("http://x")
      .catch((e: unknown) => e);
    expect(isRequestTimeoutError(error)).toBe(true);
    expect(isRequestError(error)).toBe(true);
    expect(error).toBeInstanceOf(RequestTimeoutError);
    const timeoutErr = error as RequestTimeoutError;
    expect(timeoutErr.message).toBe("Request timed out after 5000 ms");
    expect(timeoutErr.timeout).toBe(5000);
    expect(timeoutErr.name).toBe("RequestTimeoutError");
    expect(timeoutErr.data).toBeUndefined();
  });

  test("post rejects with a RequestTimeoutError on ETIMEDOUT", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(timeoutError());
    const error = await buildRequest(5000)
      .post("http://x", null)
      .catch((e: unknown) => e);
    expect(isRequestTimeoutError(error)).toBe(true);
    expect(isRequestError(error)).toBe(true);
    const timeoutErr = error as RequestTimeoutError;
    expect(timeoutErr.message).toBe("Request timed out after 5000 ms");
    expect(timeoutErr.timeout).toBe(5000);
  });

  test("other axios errors stay a plain RequestError with a timeout set", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(
      new AxiosError("boom", AxiosError.ERR_BAD_RESPONSE),
    );
    const error = await buildRequest(5000)
      .get("http://x")
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RequestError);
    expect(isRequestTimeoutError(error)).toBe(false);
    expect((error as RequestError).message).toBe("boom");
  });

  test("ETIMEDOUT without a configured timeout stays a RequestError", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(timeoutError());
    const error = await buildRequest()
      .post("http://x", null)
      .catch((e: unknown) => e);
    expect(isRequestError(error)).toBe(true);
    expect(isRequestTimeoutError(error)).toBe(false);
  });
});

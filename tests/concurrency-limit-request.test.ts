import { describe, expect, it } from "vitest";
import {
  ConcurrencyLimit,
  ConcurrencyLimitRequest,
} from "../src/concurrency-limit-request";
import type { IRequest, IResponse, RequestOptions } from "../src/request";

interface RecordedCall {
  type: "GET" | "POST";
  url: string;
  params?: unknown;
  options?: RequestOptions;
  resolve: (response: IResponse<unknown>) => void;
  reject: (error: Error) => void;
}

class FakeRequest implements IRequest {
  calls: RecordedCall[] = [];
  throwOnNextCall?: Error;

  get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>> {
    return this.record<T>({ type: "GET", url, options });
  }

  post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<IResponse<T>> {
    return this.record<T>({ type: "POST", url, params, options });
  }

  private record<T>(
    call: Pick<RecordedCall, "type" | "url" | "params" | "options">,
  ): Promise<IResponse<T>> {
    if (this.throwOnNextCall !== undefined) {
      const error = this.throwOnNextCall;
      this.throwOnNextCall = undefined;
      throw error;
    }

    return new Promise((resolve, reject) => {
      this.calls.push({
        ...call,
        resolve: resolve as RecordedCall["resolve"],
        reject,
      });
    });
  }
}

const respond = (data: unknown): IResponse<unknown> => ({ data, headers: {} });

// p-limit starts queued work asynchronously, so let it run before asserting.
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const setup = (concurrency: number) => {
  const inner = new FakeRequest();
  const request = new ConcurrencyLimitRequest(inner, concurrency);
  return { inner, request };
};

describe("ConcurrencyLimitRequest", () => {
  describe("constructor", () => {
    it.each([0, -1, 1.5, NaN, -Infinity, "2" as unknown as number])(
      "rejects %j with a RangeError",
      (concurrency) => {
        expect(
          () => new ConcurrencyLimitRequest(new FakeRequest(), concurrency),
        ).toThrow(RangeError);
      },
    );

    it.each([1, 3, Infinity])("accepts %j", (concurrency) => {
      expect(
        () => new ConcurrencyLimitRequest(new FakeRequest(), concurrency),
      ).not.toThrow();
    });
  });

  describe("limiting", () => {
    it("starts at most `concurrency` inner calls and starts the next when one settles", async () => {
      const { inner, request } = setup(2);

      void request.get("/a");
      void request.get("/b");
      void request.get("/c");
      await flush();
      expect(inner.calls.map((call) => call.url)).toEqual(["/a", "/b"]);

      inner.calls[0]!.resolve(respond(1));
      await flush();
      expect(inner.calls.map((call) => call.url)).toEqual(["/a", "/b", "/c"]);
    });

    it("shares the limit between GET and POST", async () => {
      const { inner, request } = setup(1);

      void request.get("/a");
      void request.post("/b", { x: 1 });
      await flush();
      expect(inner.calls.map((call) => call.type)).toEqual(["GET"]);

      inner.calls[0]!.resolve(respond(1));
      await flush();
      expect(inner.calls.map((call) => call.type)).toEqual(["GET", "POST"]);
    });

    it("starts queued calls in the order they were made", async () => {
      const { inner, request } = setup(1);

      void request.get("/1");
      void request.post("/2", null);
      void request.get("/3");
      void request.get("/4");
      await flush();

      for (let settled = 0; settled < 4; settled++) {
        inner.calls[settled]!.resolve(respond(settled));
        await flush();
      }

      expect(inner.calls.map((call) => call.url)).toEqual([
        "/1",
        "/2",
        "/3",
        "/4",
      ]);
    });

    it("starts every call at once with Infinity", async () => {
      const { inner, request } = setup(Infinity);

      for (let i = 0; i < 50; i++) void request.get(`/${i}`);
      await flush();

      expect(inner.calls).toHaveLength(50);
    });
  });

  describe("failures", () => {
    it("rejects with the original error and frees the slot", async () => {
      const { inner, request } = setup(1);
      const error = new Error("boom");

      const failing = request.get("/a");
      void request.get("/b");
      await flush();

      inner.calls[0]!.reject(error);
      await expect(failing).rejects.toBe(error);
      await flush();

      expect(inner.calls.map((call) => call.url)).toEqual(["/a", "/b"]);
    });

    it("rejects when the inner call throws synchronously and frees the slot", async () => {
      const { inner, request } = setup(1);
      const error = new Error("sync boom");
      inner.throwOnNextCall = error;

      const failing = request.get("/a");
      void request.get("/b");

      await expect(failing).rejects.toBe(error);
      await flush();

      expect(inner.calls.map((call) => call.url)).toEqual(["/b"]);
    });
  });

  describe("forwarding", () => {
    it("forwards GET arguments and returns the response unchanged", async () => {
      const { inner, request } = setup(2);
      const options: RequestOptions = {
        headers: { Accept: "x" },
        responseType: "text",
      };
      const response = respond({ value: 1 });

      const promise = request.get("/a", options);
      await flush();

      expect(inner.calls[0]).toMatchObject({ type: "GET", url: "/a" });
      expect(inner.calls[0]!.options).toBe(options);

      inner.calls[0]!.resolve(response);
      expect(await promise).toBe(response);
    });

    it("forwards POST arguments and returns the response unchanged", async () => {
      const { inner, request } = setup(2);
      const params = { a: 1 };
      const options: RequestOptions = { headers: { "X-Test": "y" } };
      const response = respond("ok");

      const promise = request.post("/a", params, options);
      await flush();

      expect(inner.calls[0]).toMatchObject({ type: "POST", url: "/a" });
      expect(inner.calls[0]!.params).toBe(params);
      expect(inner.calls[0]!.options).toBe(options);

      inner.calls[0]!.resolve(response);
      expect(await promise).toBe(response);
    });
  });
});

describe("ConcurrencyLimit", () => {
  describe("constructor", () => {
    it.each([0, -1, 1.5, NaN, -Infinity, "2" as unknown as number])(
      "rejects %j with a RangeError",
      (concurrency) => {
        expect(() => new ConcurrencyLimit(concurrency)).toThrow(RangeError);
      },
    );

    it.each([1, 3, Infinity])("accepts %j", (concurrency) => {
      expect(() => new ConcurrencyLimit(concurrency)).not.toThrow();
    });
  });

  describe("sharing between requests", () => {
    it("blocks a call on one request while another request holds the only slot", async () => {
      const limit = new ConcurrencyLimit(1);
      const firstInner = new FakeRequest();
      const secondInner = new FakeRequest();
      const first = new ConcurrencyLimitRequest(firstInner, limit);
      const second = new ConcurrencyLimitRequest(secondInner, limit);

      void first.get("/a");
      void second.get("/b");
      await flush();
      expect(firstInner.calls).toHaveLength(1);
      expect(secondInner.calls).toHaveLength(0);

      firstInner.calls[0]!.resolve(respond(1));
      await flush();
      expect(secondInner.calls).toHaveLength(1);
    });
  });
});

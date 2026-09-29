import { describe, expect, it } from "vitest";
import { DedupeRequest } from "../src/dedupe-request";
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

const setup = () => {
  const inner = new FakeRequest();
  const request = new DedupeRequest(inner);
  return { inner, request };
};

describe("DedupeRequest", () => {
  describe("get", () => {
    it("shares one inner call between concurrent identical GETs", async () => {
      const { inner, request } = setup();

      const first = request.get<{ value: number }>("/a");
      const second = request.get<{ value: number }>("/a");
      expect(inner.calls).toHaveLength(1);

      inner.calls[0]!.resolve(respond({ value: 1 }));

      expect((await first).data).toEqual({ value: 1 });
      expect((await second).data).toEqual({ value: 1 });
    });

    it("passes url and options through to the inner request", () => {
      const { inner, request } = setup();
      const options: RequestOptions = {
        headers: { Accept: "x" },
        responseType: "text",
      };

      void request.get("/a", options);

      expect(inner.calls[0]).toMatchObject({ type: "GET", url: "/a", options });
    });

    it("does not share GETs with different urls", () => {
      const { inner, request } = setup();

      void request.get("/a");
      void request.get("/b");

      expect(inner.calls).toHaveLength(2);
    });

    it("does not share GETs with different response types", () => {
      const { inner, request } = setup();

      void request.get("/a", { responseType: "json" });
      void request.get("/a", { responseType: "text" });

      expect(inner.calls).toHaveLength(2);
    });

    it("does not share GETs with different headers", () => {
      const { inner, request } = setup();

      void request.get("/a", { headers: { Prefer: "one" } });
      void request.get("/a", { headers: { Prefer: "two" } });
      void request.get("/a");

      expect(inner.calls).toHaveLength(3);
    });

    it("shares GETs whose headers differ only in key order", () => {
      const { inner, request } = setup();

      void request.get("/a", { headers: { A: "1", B: "2" } });
      void request.get("/a", { headers: { B: "2", A: "1" } });

      expect(inner.calls).toHaveLength(1);
    });

    it("sends a new request once the previous one has settled", async () => {
      const { inner, request } = setup();

      const first = request.get("/a");
      inner.calls[0]!.resolve(respond(1));
      await first;

      const second = request.get("/a");
      expect(inner.calls).toHaveLength(2);

      inner.calls[1]!.resolve(respond(2));
      expect((await second).data).toBe(2);
    });

    it("rejects every waiter on failure and never keeps the error", async () => {
      const { inner, request } = setup();

      const first = request.get("/a");
      const second = request.get("/a");
      const firstResult = expect(first).rejects.toThrow("boom");
      const secondResult = expect(second).rejects.toThrow("boom");

      inner.calls[0]!.reject(new Error("boom"));
      await firstResult;
      await secondResult;

      const third = request.get("/a");
      expect(inner.calls).toHaveLength(2);

      inner.calls[1]!.resolve(respond("ok"));
      expect((await third).data).toBe("ok");
    });

    it("gives joiners their own copy of the data", async () => {
      const { inner, request } = setup();

      const originator = request.get<{ items: number[] }>("/a");
      const joinerOne = request.get<{ items: number[] }>("/a");
      const joinerTwo = request.get<{ items: number[] }>("/a");

      inner.calls[0]!.resolve(respond({ items: [1] }));

      (await joinerOne).data.items.push(2);

      expect((await originator).data.items).toEqual([1]);
      expect((await joinerTwo).data.items).toEqual([1]);
    });

    it("returns the original response unchanged to the originator", async () => {
      const { inner, request } = setup();
      const response = respond({ value: 1 });

      const originator = request.get("/a");
      inner.calls[0]!.resolve(response);

      expect(await originator).toBe(response);
    });
  });

  describe("post", () => {
    it("delegates to the inner request with the same arguments", async () => {
      const { inner, request } = setup();
      const params = { name: "x" };
      const options: RequestOptions = { headers: { A: "1" } };

      const result = request.post("/a", params, options);
      expect(inner.calls).toHaveLength(1);
      expect(inner.calls[0]).toMatchObject({
        type: "POST",
        url: "/a",
        params,
        options,
      });

      const response = respond("done");
      inner.calls[0]!.resolve(response);
      expect(await result).toBe(response);
    });

    it("does not share identical POSTs", () => {
      const { inner, request } = setup();

      void request.post("/a", null);
      void request.post("/a", null);

      expect(inner.calls).toHaveLength(2);
    });

    it("detaches in-flight GETs so later GETs send a new request", async () => {
      const { inner, request } = setup();

      const before = request.get("/a");
      const waiter = request.get("/a");
      void request.post("/write", null);
      const after = request.get("/a");

      expect(inner.calls.map((call) => call.type)).toEqual([
        "GET",
        "POST",
        "GET",
      ]);

      inner.calls[0]!.resolve(respond("old"));
      inner.calls[2]!.resolve(respond("new"));

      expect((await before).data).toBe("old");
      expect((await waiter).data).toBe("old");
      expect((await after).data).toBe("new");
    });

    it("keeps the newer in-flight GET when a detached one settles", async () => {
      const { inner, request } = setup();

      const old = request.get("/a");
      void request.post("/write", null);
      const fresh = request.get("/a");

      inner.calls[0]!.resolve(respond("old"));
      await old;

      const joiner = request.get("/a");
      expect(inner.calls).toHaveLength(3);

      inner.calls[2]!.resolve(respond("new"));
      expect((await fresh).data).toBe("new");
      expect((await joiner).data).toBe("new");
    });
  });
});

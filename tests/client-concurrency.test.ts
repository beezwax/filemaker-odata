import axios from "axios";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FileMakerClient, NullLogger } from "../src/index";

type Resolve = (response: unknown) => void;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const emptyPage = { data: { value: [] }, headers: {} };

const buildClient = (concurrency?: number, dedupe?: boolean) =>
  new FileMakerClient({
    server: "demo.server.beezwax.net",
    database: "test",
    logger: new NullLogger(),
    concurrency,
    dedupe,
  });

const basicAuth = { username: "user", password: "pass" };

// Replaces axios.get/post with calls that stay pending until the test
// resolves them, recording the URL of each call in order.
const pendingAxios = () => {
  const getUrls: string[] = [];
  const getResolvers: Resolve[] = [];
  const postResolvers: Resolve[] = [];

  const get = vi.spyOn(axios, "get").mockImplementation((url: string) => {
    getUrls.push(url);
    return new Promise((resolve) => getResolvers.push(resolve));
  });
  const post = vi
    .spyOn(axios, "post")
    .mockImplementation(
      () => new Promise((resolve) => postResolvers.push(resolve)),
    );

  return { get, post, getUrls, getResolvers, postResolvers };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("FileMakerClient concurrency", () => {
  test("limits concurrent requests and starts the next when one settles", async () => {
    const { get, getResolvers } = pendingAxios();
    const fm = buildClient(2).withBasicAuth(basicAuth);

    void fm.getRecords("a");
    void fm.getRecords("b");
    void fm.getRecords("c");
    await flush();
    expect(get).toHaveBeenCalledTimes(2);

    getResolvers[0]!(emptyPage);
    await flush();
    expect(get).toHaveBeenCalledTimes(3);
  });

  test("shares the limit between every FileMaker the client builds", async () => {
    const { get, getResolvers } = pendingAxios();
    const client = buildClient(1);
    const first = client.withBasicAuth(basicAuth);
    const second = client.withBasicAuth({ username: "u2", password: "p2" });
    const third = client.withOAuth({ requestId: "r", identifier: "i" });

    void first.getRecords("a");
    void second.getRecords("b");
    void third.getRecords("c");
    await flush();
    expect(get).toHaveBeenCalledTimes(1);

    getResolvers[0]!(emptyPage);
    await flush();
    expect(get).toHaveBeenCalledTimes(2);

    getResolvers[1]!(emptyPage);
    await flush();
    expect(get).toHaveBeenCalledTimes(3);
  });

  test("a pending GET blocks a script POST", async () => {
    const { get, post, getResolvers } = pendingAxios();
    const fm = buildClient(1).withBasicAuth(basicAuth);

    void fm.getRecords("people");
    void fm.script("MyScript");
    await flush();
    expect(get).toHaveBeenCalledTimes(1);
    expect(post).not.toHaveBeenCalled();

    getResolvers[0]!(emptyPage);
    await flush();
    expect(post).toHaveBeenCalledTimes(1);
  });

  test("a pending GET blocks a batch POST", async () => {
    const { post, getResolvers } = pendingAxios();
    const fm = buildClient(1).withBasicAuth(basicAuth);

    void fm.getRecords("people");
    void fm
      .batch()
      .create({ table: "people", record: { NAME: "Fede" } })
      .execute()
      .catch(() => undefined);
    await flush();
    expect(post).not.toHaveBeenCalled();

    getResolvers[0]!(emptyPage);
    await flush();
    expect(post).toHaveBeenCalledTimes(1);
  });

  test("callers joining a deduplicated read take no slot", async () => {
    const { get, getResolvers } = pendingAxios();
    const fm = buildClient(1).withBasicAuth(basicAuth);

    const first = fm.getRecords("people");
    const second = fm.getRecords("people");
    await flush();
    getResolvers[0]!(emptyPage);

    await expect(Promise.all([first, second])).resolves.toEqual([[], []]);
    expect(get).toHaveBeenCalledTimes(1);
  });

  test("limits requests when dedupe is false", async () => {
    const { get, getResolvers } = pendingAxios();
    const fm = buildClient(1, false).withBasicAuth(basicAuth);

    void fm.getRecords("people");
    void fm.getRecords("people");
    await flush();
    expect(get).toHaveBeenCalledTimes(1);

    getResolvers[0]!(emptyPage);
    await flush();
    expect(get).toHaveBeenCalledTimes(2);
  });

  test("each page of a paged read takes its own slot", async () => {
    const { getUrls, getResolvers } = pendingAxios();
    const client = buildClient(1);
    const fm = client.withBasicAuth(basicAuth);

    void fm.getRecords("people");
    void fm.getRecords("cars");
    await flush();
    expect(getUrls).toHaveLength(1);
    expect(getUrls[0]).toContain("/people");

    getResolvers[0]!({
      data: {
        value: [],
        "@odata.nextLink": client.url("people?$skiptoken=2"),
      },
      headers: {},
    });
    await flush();
    expect(getUrls).toHaveLength(2);
    expect(getUrls[1]).toContain("/cars");

    getResolvers[1]!(emptyPage);
    await flush();
    expect(getUrls).toHaveLength(3);
    expect(getUrls[2]).toContain("skiptoken=2");
  });

  test.each([undefined, 0, Infinity])(
    "does not limit requests when concurrency is %j",
    async (concurrency) => {
      const { get } = pendingAxios();
      const fm = buildClient(concurrency).withBasicAuth(basicAuth);

      for (const table of ["a", "b", "c", "d", "e"]) void fm.getRecords(table);
      await flush();

      expect(get).toHaveBeenCalledTimes(5);
    },
  );

  test.each([-1, 1.5, NaN, -Infinity, "2" as unknown as number])(
    "throws a RangeError for concurrency %j",
    (concurrency) => {
      expect(() => buildClient(concurrency)).toThrow(RangeError);
    },
  );

  test("does not limit getAuthTypes", async () => {
    const { get, getResolvers } = pendingAxios();
    const client = buildClient(1);
    const fm = client.withBasicAuth(basicAuth);

    void fm.getRecords("people");
    await flush();
    expect(getResolvers).toHaveLength(1);

    const authTypes = client.getAuthTypes();
    await flush();
    expect(get).toHaveBeenCalledTimes(2);

    getResolvers[1]!({ data: {}, headers: {} });
    await expect(authTypes).resolves.toEqual(["basic"]);
  });
});

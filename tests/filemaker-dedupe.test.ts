import axios from "axios";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FileMaker, FileMakerClient, NullLogger } from "../src/index";
import { MockRequest, NodeBuffer } from "./mocks";

interface MockPersonRecord {
  ID: string;
  NAME: string;
}

const fixtures = ({ dedupe }: { dedupe?: boolean } = {}) => {
  const request = new MockRequest();
  const fm = new FileMaker({
    server: "demo.server.beezwax.net",
    database: "test",
    logger: new NullLogger(),
    request,
    dedupe,
  });

  return { fm, request };
};

const peopleUrl = "people?$format=application/json";

const mockPeople = (request: MockRequest, fm: FileMaker) =>
  request.mock({
    type: "GET",
    url: fm.url(peopleUrl),
    data: { value: [{ ID: "1", NAME: "Fede" }] },
  });

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dedupe", () => {
  test("does not share requests when dedupe is false", async () => {
    const { fm, request } = fixtures({ dedupe: false });
    mockPeople(request, fm);

    await Promise.all([
      fm.getRecords<MockPersonRecord>("people"),
      fm.getRecords<MockPersonRecord>("people"),
    ]);

    expect(request.requestCount(fm.url(peopleUrl))).toEqual(2);
  });

  test("never shares requests between FileMaker instances", async () => {
    const request = new MockRequest();
    const build = () =>
      new FileMaker({
        server: "demo.server.beezwax.net",
        database: "test",
        logger: new NullLogger(),
        request,
      });
    const [first, second] = [build(), build()];
    mockPeople(request, first);

    await Promise.all([
      first.getRecords<MockPersonRecord>("people"),
      second.getRecords<MockPersonRecord>("people"),
    ]);

    expect(request.requestCount(first.url(peopleUrl))).toEqual(2);
  });

  test("a caller mutating its result does not affect a concurrent caller", async () => {
    const { fm, request } = fixtures();
    mockPeople(request, fm);

    const [first, second] = await Promise.all([
      fm.getRecords<MockPersonRecord>("people").then((records) => {
        records[0].NAME = "Mutated";
        return records;
      }),
      fm.getRecords<MockPersonRecord>("people"),
    ]);

    expect(first[0].NAME).toEqual("Mutated");
    expect(second[0].NAME).toEqual("Fede");
  });

  // Nothing passes `dedupe`, so every row also proves dedup is on by default.
  describe("concurrent identical reads are shared by default", () => {
    const subqueryParams = { table: "people", recordId: "1", path: "orders" };
    const crossjoinParams = { tables: ["people", "orders"], options: {} };

    test.each([
      {
        name: "getRecords",
        path: peopleUrl,
        data: { value: [{ ID: "1", NAME: "Fede" }] },
        read: (fm: FileMaker) => fm.getRecords<MockPersonRecord>("people"),
        expected: [{ ID: "1", NAME: "Fede" }],
      },
      {
        name: "getRecord",
        path: "people('1')?$format=application/json",
        data: { ID: "1", NAME: "Fede" },
        read: (fm: FileMaker) => fm.getRecord<MockPersonRecord>("people", "1"),
        expected: { ID: "1", NAME: "Fede" },
      },
      {
        name: "getRecordsWithCount",
        path: "people?$count=true&$format=application/json",
        data: { "@odata.count": 7, value: [{ ID: "1" }] },
        read: (fm: FileMaker) => fm.getRecordsWithCount<MockPersonRecord>("people"),
        expected: { data: [{ ID: "1" }], count: 7 },
      },
      {
        name: "countRecords",
        path: "people/$count",
        data: "3",
        read: (fm: FileMaker) => fm.countRecords("people"),
        expected: 3,
      },
      {
        name: "subquery",
        path: "people('1')/orders?$format=application/json",
        data: { value: [{ ID: "o1" }] },
        read: (fm: FileMaker) => fm.subquery(subqueryParams),
        expected: [{ ID: "o1" }],
      },
      {
        name: "crossjoin",
        path: "$crossjoin(people,orders)?$format=application/json",
        data: "joined",
        read: (fm: FileMaker) => fm.crossjoin(crossjoinParams),
        expected: "joined",
      },
      {
        name: "metadata with a $format",
        path: "$metadata?$format=json",
        data: { edm: true },
        read: (fm: FileMaker) => fm.metadata({ $format: "json" }),
        expected: { edm: true },
      },
    ])("$name", async ({ path, data, read, expected }) => {
      const { fm, request } = fixtures();
      const url = fm.url(path);
      request.mock({ type: "GET", url, data });

      const results = await Promise.all([read(fm), read(fm)]);

      expect(request.requestCount(url)).toEqual(1);
      expect(results).toEqual([expected, expected]);
    });

    test("getValue keeps binary data a Buffer for every caller", async () => {
      const { fm, request } = fixtures();
      const url = fm.url("people('1')/PHOTO/$value");
      request.mock({ type: "GET", url, data: NodeBuffer.from("hi") });

      const results = await Promise.all([
        fm.getValue("people", "1", "PHOTO"),
        fm.getValue("people", "1", "PHOTO"),
      ]);

      expect(request.requestCount(url)).toEqual(1);
      for (const result of results) {
        expect(NodeBuffer.isBuffer(result)).toBe(true);
        expect(String(result)).toEqual("hi");
      }
    });
  });

  describe("writes detach in-flight reads", () => {
    test("a script started after a GET prevents later GETs from joining it", async () => {
      const { fm, request } = fixtures();
      mockPeople(request, fm);
      request.mock({
        type: "POST",
        url: fm.url("Script.Sync"),
        data: { scriptResult: { code: 0, resultParameter: "ok" } },
      });
      const release = request.holdGets();

      const before = fm.getRecords<MockPersonRecord>("people");
      const script = fm.script("Sync");
      const after = fm.getRecords<MockPersonRecord>("people");

      expect(request.requestCount(fm.url(peopleUrl))).toEqual(2);

      release();
      await Promise.all([before, script, after]);
    });

    test("a batch started after a GET prevents later GETs from joining it", async () => {
      const { fm, request } = fixtures();
      mockPeople(request, fm);
      request.mock({ type: "POST", url: fm.url("$batch"), data: "" });
      const release = request.holdGets();

      const before = fm.getRecords<MockPersonRecord>("people");
      const batch = fm
        .batch()
        .create({ table: "people", record: { NAME: "Fede" } })
        .execute()
        .catch(() => undefined);
      const after = fm.getRecords<MockPersonRecord>("people");

      expect(request.requestCount(fm.url("$batch"))).toEqual(1);
      expect(request.requestCount(fm.url(peopleUrl))).toEqual(2);

      release();
      await Promise.all([before, batch, after]);
    });
  });

  test("a failed shared read rejects every concurrent caller and is not kept", async () => {
    const { fm, request } = fixtures();
    const url = fm.url(peopleUrl);
    request.mockGetError(url, new Error("boom"));
    const release = request.holdGets();

    const first = fm.getRecords<MockPersonRecord>("people");
    const second = fm.getRecords<MockPersonRecord>("people");
    const results = Promise.all([
      expect(first).rejects.toThrow("boom"),
      expect(second).rejects.toThrow("boom"),
    ]);
    expect(request.requestCount(url)).toEqual(1);

    release();
    await results;

    const third = fm.getRecords<MockPersonRecord>("people");
    expect(request.requestCount(url)).toEqual(2);
    await expect(third).rejects.toThrow("boom");
  });

  describe("FileMakerClient", () => {
    const build = (dedupe?: boolean) =>
      new FileMakerClient({
        server: "demo.server.beezwax.net",
        database: "test",
        logger: new NullLogger(),
        dedupe,
      }).withBasicAuth({ username: "user", password: "pass" });

    const concurrentGetRecords = async (fm: FileMaker) => {
      const get = vi
        .spyOn(axios, "get")
        .mockResolvedValue({ data: { value: [] }, headers: {} });

      await Promise.all([fm.getRecords("people"), fm.getRecords("people")]);

      return get;
    };

    test("dedupes by default", async () => {
      const get = await concurrentGetRecords(build());
      expect(get).toHaveBeenCalledTimes(1);
    });

    test("does not dedupe when dedupe is false", async () => {
      const get = await concurrentGetRecords(build(false));
      expect(get).toHaveBeenCalledTimes(2);
    });
  });
});

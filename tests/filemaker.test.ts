import { expect, test, describe } from "vitest";
import { FileMaker, NullLogger } from "../src/index";
import { MockRequest } from "./mocks";

interface MockPersonRecord {
  ID: string;
  NAME: string;
  COMPANY: string;
}

const fixtures = () => {
  const request = new MockRequest();
  const logger = new NullLogger();
  const fm = new FileMaker({
    server: "demo.server.beezwax.net",
    database: "test",
    logger,
    request,
  });

  return { fm, request };
};

describe("FileMaker", () => {
  test("has proper URL", () => {
    const { fm } = fixtures();

    expect(fm.url("foo")).toEqual(
      "https://demo.server.beezwax.net/fmi/odata/v4/test/foo",
    );
  });

  test("metadata", async () => {
    const { fm, request } = fixtures();

    request.mock({
      type: "GET",
      url: fm.url("$metadata"),
      data: "someJSON",
    });

    const response = await fm.metadata<string>();
    expect(response).toEqual("someJSON");
  });
});

describe("getRecords", () => {
  test("no options", async () => {
    const { fm, request } = fixtures();

    request.mock<{ value: MockPersonRecord[] }>({
      type: "GET",
      url: fm.url("people?"),
      data: { value: [{ ID: "1234", NAME: "Fede", COMPANY: "Beezwax" }] },
    });

    const response = await fm.getRecords<MockPersonRecord>("people");
    expect(response.length).toEqual(1);
    expect(response[0].NAME).toEqual("Fede");
    expect(response[0].COMPANY).toEqual("Beezwax");
  });

  describe("$select", () => {
    test("Adds name to the URL", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Partial<MockPersonRecord>[] }>({
        type: "GET",
        url: fm.url('people?$select="NAME"'),
        data: { value: [{ NAME: "Fede" }] },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $select: ["NAME"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].NAME).toEqual("Fede");
    });

    test("escapes the ID", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Pick<MockPersonRecord, "ID">[] }>({
        type: "GET",
        url: fm.url('people?$select="ID"'),
        data: { value: [{ ID: "1234" }] },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $select: ["ID"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].ID).toEqual("1234");
    });

    test("handles multiple fields", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Partial<MockPersonRecord>[] }>({
        type: "GET",
        url: fm.url('people?$select="ID","NAME","COMPANY"'),
        data: {
          value: [{ ID: "1234", NAME: "Fede", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $select: ["ID", "NAME", "COMPANY"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].ID).toEqual("1234");
      expect(response[0].NAME).toEqual("Fede");
      expect(response[0].COMPANY).toEqual("Beezwax");
    });
  });

  describe("$top", () => {
    test("limits the number of results", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$top=5"),
        data: {
          value: [
            { ID: "1", NAME: "Person 1", COMPANY: "Company 1" },
            { ID: "2", NAME: "Person 2", COMPANY: "Company 2" },
          ],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $top: 5,
      });
      expect(response.length).toEqual(2);
    });
  });

  describe("$skip", () => {
    test("skips the specified number of records", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$skip=10"),
        data: {
          value: [{ ID: "11", NAME: "Person 11", COMPANY: "Company 11" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $skip: 10,
      });
      expect(response.length).toEqual(1);
      expect(response[0].ID).toEqual("11");
    });
  });

  describe("$filter", () => {
    test("filters records based on criteria", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$filter=name eq 'Fede'"),
        data: {
          value: [{ ID: "1234", NAME: "Fede", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $filter: "name eq 'Fede'",
      });
      expect(response.length).toEqual(1);
      expect(response[0].NAME).toEqual("Fede");
    });
  });

  describe("$expand", () => {
    test("expands related entities", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$expand=orders"),
        data: {
          value: [{ ID: "1234", NAME: "Fede", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $expand: "orders",
      });
      expect(response.length).toEqual(1);
    });
  });

  describe("$orderby", () => {
    test("orders results in ascending order", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$orderby=NAME%20asc"),
        data: {
          value: [
            { ID: "1", NAME: "Alice", COMPANY: "Company A" },
            { ID: "2", NAME: "Bob", COMPANY: "Company B" },
          ],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $orderby: ["NAME", "asc"],
      });
      expect(response.length).toEqual(2);
      expect(response[0].NAME).toEqual("Alice");
      expect(response[1].NAME).toEqual("Bob");
    });

    test("orders results in descending order", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$orderby=NAME%20desc"),
        data: {
          value: [
            { ID: "2", NAME: "Bob", COMPANY: "Company B" },
            { ID: "1", NAME: "Alice", COMPANY: "Company A" },
          ],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $orderby: ["NAME", "desc"],
      });
      expect(response.length).toEqual(2);
      expect(response[0].NAME).toEqual("Bob");
      expect(response[1].NAME).toEqual("Alice");
    });
  });

  describe("$count", () => {
    test("includes count parameter when true", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$count=true"),
        data: {
          value: [{ ID: "1234", NAME: "Fede", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $count: true,
      });
      expect(response.length).toEqual(1);
    });

    test("includes count parameter when false", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$count=false"),
        data: {
          value: [{ ID: "1234", NAME: "Fede", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $count: false,
      });
      expect(response.length).toEqual(1);
    });
  });

  describe("combined options", () => {
    test("handles multiple options together", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Partial<MockPersonRecord>[] }>({
        type: "GET",
        url: fm.url(
          `people?$select="NAME","COMPANY"&$top=10&$skip=5&$filter=company eq 'Beezwax'&$orderby=NAME%20asc`,
        ),
        data: {
          value: [{ NAME: "Fede", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $select: ["NAME", "COMPANY"],
        $top: 10,
        $skip: 5,
        $filter: "company eq 'Beezwax'",
        $orderby: ["NAME", "asc"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].NAME).toEqual("Fede");
      expect(response[0].COMPANY).toEqual("Beezwax");
    });
  });
});

describe("getRecord", () => {
  test("fetches a single record by ID", async () => {
    const { fm, request } = fixtures();

    request.mock<MockPersonRecord>({
      type: "GET",
      url: fm.url("people('1234')?"),
      data: { ID: "1234", NAME: "Fede", COMPANY: "Beezwax" },
    });

    const response = await fm.getRecord<MockPersonRecord>("people", "1234");
    expect(response.ID).toEqual("1234");
    expect(response.NAME).toEqual("Fede");
    expect(response.COMPANY).toEqual("Beezwax");
  });

  test("properly encodes special characters in ID", async () => {
    const { fm, request } = fixtures();

    request.mock<MockPersonRecord>({
      type: "GET",
      url: fm.url("people('test%40example.com')?"),
      data: {
        ID: "test@example.com",
        NAME: "Test User",
        COMPANY: "Test Corp",
      },
    });

    const response = await fm.getRecord<MockPersonRecord>(
      "people",
      "test@example.com",
    );
    expect(response.ID).toEqual("test@example.com");
    expect(response.NAME).toEqual("Test User");
    expect(response.COMPANY).toEqual("Test Corp");
  });
});

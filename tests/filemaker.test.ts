import { expect, test, describe } from "vitest";
import { FileMaker, NullLogger, odata } from "../src/index";
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

const expectODataError = (callback: () => unknown, message: string) => {
  try {
    callback();
  } catch (error) {
    expect(error).toBeInstanceOf(TypeError);
    expect((error as Error).message).toEqual(message);
    return;
  }

  throw new Error("Expected OData helper to throw");
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
      url: fm.url("people?$format=application/json"),
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
        url: fm.url('people?$select="NAME"&$format=application/json'),
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
        url: fm.url('people?$select="ID"&$format=application/json'),
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
        url: fm.url(
          'people?$select="ID","NAME","COMPANY"&$format=application/json',
        ),
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
        url: fm.url("people?$top=5&$format=application/json"),
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
        url: fm.url("people?$skip=10&$format=application/json"),
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
        url: fm.url("people?$filter=name eq 'Fede'&$format=application/json"),
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

    test("keeps raw filter URL serialization for backward compatibility", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url(
          "people?$filter=name eq 'O''Brien'&$format=application/json",
        ),
        data: {
          value: [{ ID: "1234", NAME: "O'Brien", COMPANY: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $filter: `name eq ${odata.string("O'Brien")}`,
      });

      expect(response.length).toEqual(1);
      expect(response[0].NAME).toEqual("O'Brien");
    });
  });

  describe("$expand", () => {
    test("expands related entities", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$expand=orders&$format=application/json"),
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
        url: fm.url('people?$orderby="NAME" asc&$format=application/json'),
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
        url: fm.url('people?$orderby="NAME" desc&$format=application/json'),
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

    test("orders results by multiple columns", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url(
          'people?$orderby="COMPANY" asc,"NAME" desc&$format=application/json',
        ),
        data: {
          value: [
            { ID: "1", NAME: "Zara", COMPANY: "Acme Corp" },
            { ID: "2", NAME: "Alice", COMPANY: "Acme Corp" },
            { ID: "3", NAME: "Bob", COMPANY: "Beezwax" },
          ],
        },
      });

      const response = await fm.getRecords<MockPersonRecord>("people", {
        $orderby: [
          ["COMPANY", "asc"],
          ["NAME", "desc"],
        ],
      });
      expect(response.length).toEqual(3);
      expect(response[0].COMPANY).toEqual("Acme Corp");
      expect(response[0].NAME).toEqual("Zara");
      expect(response[1].COMPANY).toEqual("Acme Corp");
      expect(response[1].NAME).toEqual("Alice");
      expect(response[2].COMPANY).toEqual("Beezwax");
    });
  });

  describe("$count", () => {
    test("includes count parameter when true", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPersonRecord[] }>({
        type: "GET",
        url: fm.url("people?$count=true&$format=application/json"),
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
        url: fm.url("people?$count=false&$format=application/json"),
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
          `people?$select="NAME","COMPANY"&$top=10&$skip=5&$filter=company eq 'Beezwax'&$orderby="NAME" asc&$format=application/json`,
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
      url: fm.url("people('1234')?$format=application/json"),
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
      url: fm.url("people('test%40example.com')?$format=application/json"),
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

describe("odata helpers", () => {
  describe("string", () => {
    test("wraps values in single quotes", () => {
      expect(odata.string("Beezwax")).toEqual("'Beezwax'");
    });

    test("escapes single quotes by doubling them", () => {
      expect(odata.string("O'Brien")).toEqual("'O''Brien'");
    });

    test("does not URL encode the literal", () => {
      expect(odata.string("A B&C")).toEqual("'A B&C'");
    });

    test("rejects non-string values", () => {
      // @ts-expect-error runtime guard rejects non-string input
      expectODataError(() => odata.string(true), "Invalid OData string");
    });
  });

  describe("number", () => {
    test("accepts finite numbers", () => {
      expect(odata.number(42)).toEqual("42");
      expect(odata.number(-12.5)).toEqual("-12.5");
    });

    test("accepts numeric strings", () => {
      expect(odata.number("42")).toEqual("42");
      expect(odata.number("  -12.5  ")).toEqual("-12.5");
    });

    test("canonicalizes non-standard string forms", () => {
      expect(odata.number("+42")).toEqual("42");
      expect(odata.number("01")).toEqual("1");
      expect(odata.number(".5")).toEqual("0.5");
    });

    test("rejects invalid numbers", () => {
      expectODataError(
        () => odata.number(Number.NaN),
        "Invalid OData number",
      );
      expectODataError(
        () => odata.number(Number.POSITIVE_INFINITY),
        "Invalid OData number",
      );
      expectODataError(() => odata.number(""), "Invalid OData number");
      expectODataError(() => odata.number("12abc"), "Invalid OData number");
    });

    test("rejects non-string and non-number values", () => {
      // @ts-expect-error runtime guard rejects non-string and non-number input
      expectODataError(() => odata.number(true), "Invalid OData number");
      // @ts-expect-error runtime guard rejects non-string and non-number input
      expectODataError(() => odata.number(null), "Invalid OData number");
      // @ts-expect-error runtime guard rejects non-string and non-number input
      expectODataError(() => odata.number({}), "Invalid OData number");
    });
  });

  describe("integer", () => {
    test("accepts integers", () => {
      expect(odata.integer(42)).toEqual("42");
      expect(odata.integer(" -12 ")).toEqual("-12");
    });

    test("rejects decimal values", () => {
      expectODataError(() => odata.integer(12.5), "Invalid OData integer");
      expectODataError(() => odata.integer("12.5"), "Invalid OData integer");
    });

    test("rejects non-string and non-number values", () => {
      // @ts-expect-error runtime guard rejects non-string and non-number input
      expectODataError(() => odata.integer(true), "Invalid OData integer");
      // @ts-expect-error runtime guard rejects non-string and non-number input
      expectODataError(() => odata.integer(null), "Invalid OData integer");
      // @ts-expect-error runtime guard rejects non-string and non-number input
      expectODataError(() => odata.integer({}), "Invalid OData integer");
    });
  });

  describe("boolean", () => {
    test("accepts booleans", () => {
      expect(odata.boolean(true)).toEqual("true");
      expect(odata.boolean(false)).toEqual("false");
    });

    test("rejects non-boolean values", () => {
      // @ts-expect-error runtime guard rejects non-boolean input
      expectODataError(() => odata.boolean("true"), "Invalid OData boolean");
    });
  });

  describe("uuid", () => {
    test("accepts valid UUIDs as string literals", () => {
      expect(odata.uuid("280dc895-23f6-4368-be3b-3ea81d360f62")).toEqual(
        "'280dc895-23f6-4368-be3b-3ea81d360f62'",
      );
    });

    test("accepts UUIDv7 string literals", () => {
      expect(odata.uuid("0196f682-e18d-7000-8000-000000000000")).toEqual(
        "'0196f682-e18d-7000-8000-000000000000'",
      );
    });

    test("rejects malformed UUIDs", () => {
      expectODataError(() => odata.uuid("not-a-uuid"), "Invalid OData UUID");
    });

    test("rejects UUIDs with wrong RFC variant", () => {
      expectODataError(
        () => odata.uuid("0196f682-e18d-7000-7000-000000000000"),
        "Invalid OData UUID",
      );
    });

    test("rejects non-string UUIDs", () => {
      // @ts-expect-error runtime guard rejects non-string input
      expectODataError(() => odata.uuid(true), "Invalid OData UUID");
      const uuidLike = {
        toString: () => "280dc895-23f6-4368-be3b-3ea81d360f62",
      };
      // @ts-expect-error runtime guard rejects non-string input
      expectODataError(() => odata.uuid(uuidLike), "Invalid OData UUID");
    });
  });

  describe("identifier", () => {
    test("quotes safe FileMaker identifiers", () => {
      expect(odata.identifier("NAME")).toEqual('"NAME"');
      expect(odata.identifier("Customer Name")).toEqual('"Customer Name"');
      expect(odata.identifier("customer_id")).toEqual('"customer_id"');
      expect(odata.identifier("Order-Number")).toEqual('"Order-Number"');
    });

    test("rejects identifiers with OData structural characters", () => {
      expectODataError(
        () => odata.identifier('NA"ME'),
        "Invalid OData identifier",
      );
      expectODataError(
        () => odata.identifier("Orders/ID"),
        "Invalid OData identifier",
      );
      expectODataError(
        () => odata.identifier("NAME)&$top=1"),
        "Invalid OData identifier",
      );
      expectODataError(
        () => odata.identifier(""),
        "Invalid OData identifier",
      );
    });

    test("rejects non-string identifiers", () => {
      expectODataError(
        // @ts-expect-error runtime guard rejects non-string input
        () => odata.identifier(true),
        "Invalid OData identifier",
      );
      expectODataError(
        // @ts-expect-error runtime guard rejects non-string input
        () => odata.identifier(123),
        "Invalid OData identifier",
      );
    });
  });
});

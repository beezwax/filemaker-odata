import { expect, test, describe } from "vitest";
import {
  FileMaker,
  type FileMakerConfig,
  FileMakerBasicCredentials,
  Logger,
} from "../src/file-maker";
import type { IRequest, RequestOptions } from "../src/request";

class MockRequest implements IRequest {
  private requests: Record<"GET" | "POST", Record<string, unknown>>;
  private responses: {
    response: unknown;
    request: {
      type: "GET" | "POST";
      url: string;
      options?: RequestOptions;
      params?: unknown;
    };
  }[];

  constructor() {
    this.requests = {
      GET: {},
      POST: {},
    };
    this.responses = [];
  }

  mock<R>({
    type,
    url,
    response,
  }: {
    type: "GET" | "POST";
    url: string;
    response: R;
  }) {
    this.requests[type][url] = response;
  }

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const request = this.requests.GET[url];

    if (request === undefined)
      throw new Error(`Could not find mock GET request: "${url}"`);

    // Store response for latest inspection if needed by tests
    this.responses.push({
      response: request,
      request: { type: "GET", url, options },
    });

    return request as T;
  }

  async post<T>(
    url: string,
    params: string | Record<string, unknown> | null,
    options?: RequestOptions,
  ): Promise<T> {
    const request = this.requests.POST[url];

    if (request === undefined)
      throw new Error(`Could not find mock POST request: "${url}"`);

    // Store response for latest inspection if needed by tests
    this.responses.push({
      response: request,
      request: { type: "GET", url, params, options },
    });

    return request as T;
  }
}

interface MockPerson {
  ID: string;
  name: string;
  company: string;
}

const fixtures = () => {
  const credentials = new FileMakerBasicCredentials({
    username: "test",
    password: "demo",
  });
  const config: FileMakerConfig = {
    server: "demo.server.beezwax.net",
    database: "test",
    credentials,
  };
  const logger = new Logger();
  const request = new MockRequest();

  const fm = new FileMaker({ config, logger, request });

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
      response: "someJSON",
    });

    const response = await fm.metadata<string>();
    expect(response).toEqual("someJSON");
  });
});

describe("getRecords", () => {
  test("no options", async () => {
    const { fm, request } = fixtures();

    request.mock<{ value: MockPerson[] }>({
      type: "GET",
      url: fm.url("people?"),
      response: { value: [{ ID: "1234", name: "Fede", company: "Beezwax" }] },
    });

    const response = await fm.getRecords<MockPerson>("people");
    expect(response.length).toEqual(1);
    expect(response[0].name).toEqual("Fede");
    expect(response[0].company).toEqual("Beezwax");
  });

  describe("$select", () => {
    test("Adds name to the URL", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Partial<MockPerson>[] }>({
        type: "GET",
        url: fm.url("people?$select=name"),
        response: { value: [{ name: "Fede" }] },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $select: ["name"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].name).toEqual("Fede");
    });

    test("escapes the ID", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Pick<MockPerson, "ID">[] }>({
        type: "GET",
        url: fm.url('people?$select="ID"'),
        response: { value: [{ ID: "1234" }] },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $select: ["ID"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].ID).toEqual("1234");
    });

    test("handles multiple fields", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Partial<MockPerson>[] }>({
        type: "GET",
        url: fm.url('people?$select="ID",name,company'),
        response: {
          value: [{ ID: "1234", name: "Fede", company: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $select: ["ID", "name", "company"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].ID).toEqual("1234");
      expect(response[0].name).toEqual("Fede");
      expect(response[0].company).toEqual("Beezwax");
    });
  });

  describe("$top", () => {
    test("limits the number of results", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$top=5"),
        response: {
          value: [
            { ID: "1", name: "Person 1", company: "Company 1" },
            { ID: "2", name: "Person 2", company: "Company 2" },
          ],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $top: 5,
      });
      expect(response.length).toEqual(2);
    });
  });

  describe("$skip", () => {
    test("skips the specified number of records", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$skip=10"),
        response: {
          value: [{ ID: "11", name: "Person 11", company: "Company 11" }],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $skip: 10,
      });
      expect(response.length).toEqual(1);
      expect(response[0].ID).toEqual("11");
    });
  });

  describe("$filter", () => {
    test("filters records based on criteria", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$filter=name eq 'Fede'"),
        response: {
          value: [{ ID: "1234", name: "Fede", company: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $filter: "name eq 'Fede'",
      });
      expect(response.length).toEqual(1);
      expect(response[0].name).toEqual("Fede");
    });
  });

  describe("$expand", () => {
    test("expands related entities", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$expand=orders"),
        response: {
          value: [{ ID: "1234", name: "Fede", company: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $expand: "orders",
      });
      expect(response.length).toEqual(1);
    });
  });

  describe("$orderby", () => {
    test("orders results in ascending order", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$orderby=name%20asc"),
        response: {
          value: [
            { ID: "1", name: "Alice", company: "Company A" },
            { ID: "2", name: "Bob", company: "Company B" },
          ],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $orderby: ["name", "asc"],
      });
      expect(response.length).toEqual(2);
      expect(response[0].name).toEqual("Alice");
      expect(response[1].name).toEqual("Bob");
    });

    test("orders results in descending order", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$orderby=name%20desc"),
        response: {
          value: [
            { ID: "2", name: "Bob", company: "Company B" },
            { ID: "1", name: "Alice", company: "Company A" },
          ],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $orderby: ["name", "desc"],
      });
      expect(response.length).toEqual(2);
      expect(response[0].name).toEqual("Bob");
      expect(response[1].name).toEqual("Alice");
    });
  });

  describe("$count", () => {
    test("includes count parameter when true", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$count=true"),
        response: {
          value: [{ ID: "1234", name: "Fede", company: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $count: true,
      });
      expect(response.length).toEqual(1);
    });

    test("includes count parameter when false", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: MockPerson[] }>({
        type: "GET",
        url: fm.url("people?$count=false"),
        response: {
          value: [{ ID: "1234", name: "Fede", company: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $count: false,
      });
      expect(response.length).toEqual(1);
    });
  });

  describe("combined options", () => {
    test("handles multiple options together", async () => {
      const { fm, request } = fixtures();

      request.mock<{ value: Partial<MockPerson>[] }>({
        type: "GET",
        url: fm.url(
          "people?$select=name,company&$top=10&$skip=5&$filter=company eq 'Beezwax'&$orderby=name%20asc",
        ),
        response: {
          value: [{ name: "Fede", company: "Beezwax" }],
        },
      });

      const response = await fm.getRecords<MockPerson>("people", {
        $select: ["name", "company"],
        $top: 10,
        $skip: 5,
        $filter: "company eq 'Beezwax'",
        $orderby: ["name", "asc"],
      });
      expect(response.length).toEqual(1);
      expect(response[0].name).toEqual("Fede");
      expect(response[0].company).toEqual("Beezwax");
    });
  });
});

describe("getRecord", () => {
  test("fetches a single record by ID", async () => {
    const { fm, request } = fixtures();

    request.mock<MockPerson>({
      type: "GET",
      url: fm.url("people('1234')"),
      response: { ID: "1234", name: "Fede", company: "Beezwax" },
    });

    const response = await fm.getRecord<MockPerson>("people", "1234");
    expect(response.ID).toEqual("1234");
    expect(response.name).toEqual("Fede");
    expect(response.company).toEqual("Beezwax");
  });

  test("properly encodes special characters in ID", async () => {
    const { fm, request } = fixtures();

    request.mock<MockPerson>({
      type: "GET",
      url: fm.url("people('test%40example.com')"),
      response: {
        ID: "test@example.com",
        name: "Test User",
        company: "Test Corp",
      },
    });

    const response = await fm.getRecord<MockPerson>(
      "people",
      "test@example.com",
    );
    expect(response.ID).toEqual("test@example.com");
    expect(response.name).toEqual("Test User");
    expect(response.company).toEqual("Test Corp");
  });
});

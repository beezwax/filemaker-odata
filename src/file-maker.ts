import { isRequestError, type IRequest } from "./request";
import { OperationBuilder } from "./operations/builder";

export class Logger {
  log(message: unknown) {
    console.log(message);
  }
}

interface FileMakerScriptResponse<T> {
  scriptResult: { code: number; resultParameter?: T };
}

// Simplistic UUID generator which works for our very limited needs
const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// A wrapper around FileMaker's OData API
// =============================================================================
// const agent = new Agent({ rejectUnauthorized: false });

// For more information on FileMaker's available query options, see:
// https://help.claris.com/en/odata-guide/content/query-option-filter.html
interface QueryOptions<T> {
  $select?: (keyof T)[];
  $top?: number;
  $skip?: number;
  $filter?: string;
  $expand?: string;
  $orderby?: [keyof T, "asc" | "desc"];
  $count?: boolean;
}

interface FileMakerConfig {
  server: string;
  database: string;
}

export class FileMaker {
  private config: FileMakerConfig;
  private logger: Logger;
  private request: IRequest;

  constructor({
    server,
    database,
    logger,
    request,
  }: {
    server: string;
    database: string;
    logger: Logger;
    request: IRequest;
  }) {
    this.config = { server, database };
    this.logger = logger;
    this.request = request;
  }

  url(path: string) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${path}`;
  }

  async metadata<T>() {
    return (await this.request.get<T>(this.url("$metadata"))).data;
  }

  async subquery<T>(params: {
    table: string;
    recordId: string;
    path: string;
    options?: QueryOptions<T>;
  }) {
    this.log(`[FileMaker Service] Get records from ${params.table}`);
    this.log("Options:");
    this.log(params.options);
    this.log(
      `URL: ${this.url(`${params.table}('${params.recordId}')/${params.path}`)}?${this.parameterize(params.options)}`,
    );

    try {
      const response = await this.request.get<{ value: T[] }>(
        `${this.url(`${params.table}('${params.recordId}')/${params.path}`)}?${this.parameterize(params.options)}`,
      );

      return response.data.value;
    } catch (error) {
      if (isRequestError(error)) {
        this.log("Get records HTTP error");
        this.log(error.data);
      }
      throw error;
    }
  }

  async getRecords<T>(table: string, options?: QueryOptions<T>) {
    this.log(`[FileMaker Service] Get records from ${table}`);
    this.log("Options:");
    this.log(options);
    this.log(`URL: ${this.url(table)}?${this.parameterize(options)}`);

    try {
      const response = await this.request.get<{
        value: T[];
        "@odata.count"?: number;
      }>(`${this.url(table)}?${this.parameterize(options)}`);

      return response.data.value;
    } catch (error) {
      if (isRequestError(error)) {
        this.log("Get records HTTP error");
        this.log(error.data);
      }
      throw error;
    }
  }

  async getRecordsWithCount<T>(table: string, options?: QueryOptions<T>) {
    this.log(`[FileMaker Service] Get records with count from ${table}`);
    this.log("Options:");
    this.log(options);

    // We override the base options because we always want this method to
    // include the count
    const actualOptions: QueryOptions<T> = { ...options, $count: true };

    this.log(`URL: ${this.url(table)}?${this.parameterize(actualOptions)}`);

    try {
      const response = await this.request.get<{
        value: T[];
        "@odata.count"?: number;
      }>(`${this.url(table)}?${this.parameterize(actualOptions)}`);

      return {
        data: response.data.value,
        count: response.data["@odata.count"] ?? 0,
      };
    } catch (error) {
      if (isRequestError(error)) {
        this.log("Get records with count HTTP error");
        this.log(error.data);
      }
      throw error;
    }
  }

  async getRecord<T>(table: string, id: string) {
    this.log(`[FileMaker Service] Get records from ${table}`);
    this.log(`ID: ${id}`);

    try {
      const response = await this.request.get<T>(
        `${this.url(table)}('${encodeURIComponent(id)}')`,
      );

      return response.data;
    } catch (error) {
      if (isRequestError(error)) {
        this.log(error.data);
      }
      throw error;
    }
  }

  async getValue(table: string, id: string, field: string) {
    try {
      const response = await this.request.get<string>(
        `${this.url(table)}('${encodeURIComponent(id)}')/${encodeURIComponent(field)}/$value`,
        {
          responseType: "arraybuffer",
        },
      );

      return response.data;
    } catch (error) {
      if (isRequestError(error)) {
        this.log(error.data);
      }
      throw error;
    }
  }

  async crossjoin({
    tables,
    $filter,
    $expand,
  }: {
    tables: string[];
    $filter: string;
    $expand: string;
  }) {
    try {
      const response = await this.request.get<string>(
        `${this.url("$crossjoin")}(${tables.join(",")})?$filter=${$filter}&$expand=${$expand}`,
        {
          headers: {
            Accept: "application/atom+xml",
          },
        },
      );

      return response.data;
    } catch (error) {
      if (isRequestError(error)) {
        this.log(error.data);
      }
      throw error;
    }
  }

  // Performs a "$batch" request, executing the given operations
  // transactionally. Meaning operations either all succeed, or none of them
  // does.
  //
  // Usage:
  //
  //   const response = (await fm
  //     .batch()
  //     .update<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         ID: "FINDING-280DC895-23F6-4368-BE3B-3EA81D360F62",
  //         FINDING: "Example 1 2 3",
  //       },
  //     })
  //     .create<FindingRecord>({
  //       table: "FINDING",
  //       record: {
  //         FINDING: "Example body",
  //       },
  //     })
  //     .delete({
  //       table: "FINDING",
  //       id: "SOME-FINDING-ID",
  //     })
  //     .execute()) as [
  //       BatchOperationResponse<FindingRecord>,
  //       BatchOperationResponse<null>,
  //       BatchOperationResponse<null>
  //     ];
  //
  batch() {
    return new OperationBuilder(this.config, async (operations) => {
      const batchBoundary = `batch_${uuid()}`;
      const changesetBoundary = `changeset_${uuid()}`;

      // TODO: If we wanted to implement a `FindOperation`, we'd need to do that
      // outside of the changeset. I think for now the purpose of `batch` being
      // writing changes in a transation is good enough.
      const batchRequestBody =
        `--${batchBoundary}\r\n` +
        `Content-Type: multipart/mixed; boundary=${changesetBoundary}\r\n\r\n` +
        operations
          .map((operation, index) =>
            operation.toRequestBody({
              boundary: changesetBoundary,
              changeId: index + 1,
            }),
          )
          .join("") +
        `--${changesetBoundary}--\r\n` +
        `--${batchBoundary}--\r\n`;

      try {
        const response = await this.request.post<string>(
          this.url("$batch"),
          batchRequestBody,
          {
            headers: {
              "Content-Type": `multipart/mixed; boundary=${batchBoundary}`,
            },
          },
        );

        const match = /boundary=(.+?)\r\n/.exec(response.data);
        if (match === null) throw new Error("Could not find changeset");

        const changeset = match[0].split("=")[1].trim();
        const changes = response.data.split(`--${changeset}`).slice(1, -1);
        return changes.map((change, index) =>
          operations[index].parseResponse(change),
        );
      } catch (error) {
        if (isRequestError(error)) {
          this.log(error.data);
        }
        throw error;
      }
    });
  }

  async script<T>(name: string, params?: Record<string, unknown>) {
    this.log(`[FileMaker Service] Running script ${name} with parameters:`);
    this.log({ scriptParameterValue: params });

    const response = await this.request.post<FileMakerScriptResponse<T>>(
      this.url(`Script.${encodeURIComponent(name)}`),
      params === undefined ? null : { scriptParameterValue: params },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    this.log(`[FileMaker Service] Script ${name} finished. Response:`);
    this.log(response);

    const success = response.data.scriptResult.code === 0;
    return {
      success,
      data: success ? response.data.scriptResult.resultParameter : undefined,
    };
  }

  private parameterize<T>(options?: QueryOptions<T>) {
    if (options === undefined) return "";

    const params: Record<string, string | number> = {};

    if (options.$select !== undefined) {
      params.$select = options.$select
        .map((field) => (field === "ID" ? '"ID"' : field))
        .join(",");
    }

    if (options.$top !== undefined) {
      params.$top = options.$top;
    }

    if (options.$skip !== undefined) {
      params.$skip = options.$skip;
    }

    if (options.$filter !== undefined) {
      params.$filter = options.$filter;
    }

    if (options.$expand !== undefined) {
      params.$expand = options.$expand;
    }

    if (options.$orderby !== undefined) {
      params.$orderby = encodeURIComponent(options.$orderby.join(" "));
    }

    if (options.$count !== undefined) {
      params.$count = options.$count ? "true" : "false";
    }

    return Object.entries(params)
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
  }

  private log(value: unknown) {
    return this.logger.log(value);
  }
}

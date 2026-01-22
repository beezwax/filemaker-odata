import type { FileMakerConfig } from "../file-maker";
import type {
  BatchOperation,
  RecordWithId,
  FileMakerErrorResponse,
} from "./operation";

type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

export class UpdateOperation<T extends RecordWithId> implements BatchOperation {
  private config: FileMakerConfig;
  private table: string;
  private record: PartialExcept<T, "ID">;

  constructor({
    config,
    table,
    record,
  }: {
    config: FileMakerConfig;
    table: string;
    record: PartialExcept<T, "ID">;
  }) {
    this.config = config;
    this.table = table;
    this.record = record;
  }

  toRequestBody({
    boundary,
    changeId,
  }: {
    boundary: string;
    changeId: number;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ID, ...otherProps } = this.record;
    const json = JSON.stringify(otherProps);

    return (
      `--${boundary}\r\n` +
      `Content-Type: application/http\r\n` +
      `Content-ID: ${changeId}\r\n\r\n` +
      `PATCH ${this.url(this.table)}('${this.record.ID}') HTTP/1.1\r\n` +
      `Content-Type: application/json\r\n` +
      `Content-Length: ${this.byteLength(json)}\r\n\r\n` +
      json +
      "\r\n"
    );
  }

  parseResponse(change: string) {
    const status = /HTTP\/1.1\s+(\d+)\s/.exec(change);
    if (status === null) throw new Error("Could not find status in response");

    const statusCode = Number(status[1]);

    if (statusCode >= 300) {
      const { error } = JSON.parse(
        change.substring(change.indexOf("{")).trim(),
      ) as FileMakerErrorResponse;

      throw new Error(`[UPDATE OPERATION: ${this.table}] ${error.message}`);
    }

    const json = JSON.parse(change.substring(change.indexOf("{")).trim()) as T;

    return { status: statusCode, body: json };
  }

  private url(path: string) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${path}`;
  }

  private byteLength(value: string) {
    return new TextEncoder().encode(value).byteLength;
  }
}

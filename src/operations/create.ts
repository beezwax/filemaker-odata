import type { FileMakerConfig } from "../file-maker";
import type { BatchOperation, FileMakerErrorResponse } from "./operation";

export class CreateOperation<T> implements BatchOperation {
  private config: FileMakerConfig;
  private table: string;
  private record: Partial<T>;

  constructor({
    config,
    table,
    record,
  }: {
    config: FileMakerConfig;
    table: string;
    record: Partial<T>;
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
    const json = JSON.stringify(this.record);
    return (
      `--${boundary}\r\n` +
      `Content-Type: application/http\r\n` +
      `Content-ID: ${changeId}\r\n\r\n` +
      `POST ${this.url(this.table)} HTTP/1.1\r\n` +
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

      throw new Error(`[CREATE OPERATION: ${this.table}] ${error.message}`);
    }

    return { status: statusCode, body: null };
  }

  private url(path: string) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${path}`;
  }

  private byteLength(value: string) {
    return new TextEncoder().encode(value).byteLength;
  }
}

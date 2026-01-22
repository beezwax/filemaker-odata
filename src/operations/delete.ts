import type { FileMakerConfig } from "../file-maker";
import type { BatchOperation, FileMakerErrorResponse } from "./operation";

export class DeleteOperation implements BatchOperation {
  private config: FileMakerConfig;
  private table: string;
  private id: string;

  constructor({
    config,
    table,
    id,
  }: {
    config: FileMakerConfig;
    table: string;
    id: string;
  }) {
    this.config = config;
    this.table = table;
    this.id = id;
  }

  toRequestBody({
    boundary,
    changeId,
  }: {
    boundary: string;
    changeId: number;
  }) {
    return (
      `--${boundary}\r\n` +
      `Content-Type: application/http\r\n` +
      `Content-ID: ${changeId}\r\n\r\n` +
      `DELETE ${this.url(this.table)}('${this.id}') HTTP/1.1\r\n\r\n\r\n`
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

      throw new Error(`[DELETE OPERATION: ${this.table}] ${error.message}`);
    }

    return { status: statusCode, body: null };
  }

  private url(path: string) {
    return `https://${this.config.server}/fmi/odata/v4/${this.config.database}/${path}`;
  }
}

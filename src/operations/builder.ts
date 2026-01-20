import type { FileMakerConfig } from "../file-maker";
import type {
  BatchOperation,
  BatchOperationResponse,
  RecordWithId,
} from "./operation";
import { UpdateOperation } from "./update";
import { CreateOperation } from "./create";
import { DeleteOperation } from "./delete";

type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

type OperationBuilderCallback = (
  operations: BatchOperation[],
) => Promise<BatchOperationResponse<unknown>[]>;

export class OperationBuilder {
  private operations: BatchOperation[];
  private callback: OperationBuilderCallback;
  private config: FileMakerConfig;

  constructor(config: FileMakerConfig, callback: OperationBuilderCallback) {
    this.config = config;
    this.callback = callback;
    this.operations = [];
  }

  update<T extends RecordWithId>({
    table,
    record,
  }: {
    table: string;
    record: PartialExcept<T, "ID">;
  }) {
    this.operations.push(
      new UpdateOperation<T>({
        config: this.config,
        table,
        record,
      }),
    );
    return this;
  }

  create<T>({ table, record }: { table: string; record: Partial<T> }) {
    this.operations.push(
      new CreateOperation<T>({
        config: this.config,
        table,
        record,
      }),
    );
    return this;
  }

  delete({ table, id }: { table: string; id: string }) {
    this.operations.push(
      new DeleteOperation({
        config: this.config,
        table,
        id,
      }),
    );
    return this;
  }

  execute() {
    return this.callback(this.operations);
  }
}

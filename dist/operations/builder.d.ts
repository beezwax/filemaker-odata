import { FileMakerConfig } from '../filemaker';
import { BatchOperation, BatchOperationResponse, RecordWithId } from './operation';
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;
type OperationBuilderCallback = (operations: BatchOperation[]) => Promise<BatchOperationResponse<unknown>[]>;
export declare class OperationBuilder {
    private operations;
    private callback;
    private config;
    constructor(config: FileMakerConfig, callback: OperationBuilderCallback);
    update<T extends RecordWithId>({ table, record, }: {
        table: string;
        record: PartialExcept<T, "ID">;
    }): this;
    create<T>({ table, record }: {
        table: string;
        record: Partial<T>;
    }): this;
    delete({ table, id }: {
        table: string;
        id: string;
    }): this;
    execute(): Promise<BatchOperationResponse<unknown>[]>;
}
export {};

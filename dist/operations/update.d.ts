import { FileMakerConfig } from '../filemaker';
import { BatchOperation, RecordWithId } from './operation';
type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;
export declare class UpdateOperation<T extends RecordWithId> implements BatchOperation {
    private config;
    private table;
    private record;
    constructor({ config, table, record, }: {
        config: FileMakerConfig;
        table: string;
        record: PartialExcept<T, "ID">;
    });
    toRequestBody({ boundary, changeId, }: {
        boundary: string;
        changeId: number;
    }): string;
    parseResponse(change: string): {
        status: number;
        body: T;
    };
    private url;
    private byteLength;
}
export {};

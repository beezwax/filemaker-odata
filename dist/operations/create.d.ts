import { FileMakerConfig } from '../filemaker';
import { BatchOperation } from './operation';
export declare class CreateOperation<T> implements BatchOperation {
    private config;
    private table;
    private record;
    constructor({ config, table, record, }: {
        config: FileMakerConfig;
        table: string;
        record: Partial<T>;
    });
    toRequestBody({ boundary, changeId, }: {
        boundary: string;
        changeId: number;
    }): string;
    parseResponse(change: string): {
        status: number;
        body: null;
    };
    private url;
    private byteLength;
}

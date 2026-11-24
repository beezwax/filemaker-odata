import { FileMakerConfig } from '../filemaker';
import { BatchOperation } from './operation';
export declare class DeleteOperation implements BatchOperation {
    private config;
    private table;
    private id;
    constructor({ config, table, id, }: {
        config: FileMakerConfig;
        table: string;
        id: string;
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
}

import { IRequest } from './request';
import { OperationBuilder } from './operations/builder';
import { ILogger } from './logger';
type OrderByClause<T> = [keyof T, "asc" | "desc"];
interface QueryOptions<T> {
    $select?: (keyof T)[];
    $top?: number;
    $skip?: number;
    $filter?: string;
    $expand?: string;
    $orderby?: OrderByClause<T> | OrderByClause<T>[];
    $count?: boolean;
    $format?: "json" | "xml";
    $metadata?: boolean;
}
type GetRecordQueryOptions<T> = Pick<QueryOptions<T>, "$select" | "$expand" | "$format" | "$metadata">;
type CrossJoinQueryOptions<T> = Pick<QueryOptions<T>, "$filter" | "$expand" | "$format" | "$metadata">;
type CountQueryOptions<T> = Pick<QueryOptions<T>, "$filter">;
export interface MetadataOptions {
    $format?: "json" | "xml";
}
export interface FileMakerConfig {
    server: string;
    database: string;
}
export declare class FileMaker {
    private config;
    private logger;
    private request;
    constructor({ server, database, logger, request, }: {
        server: string;
        database: string;
        logger: ILogger;
        request: IRequest;
    });
    url(path: string): string;
    metadata<T>(options?: MetadataOptions): Promise<T>;
    subquery<T>(params: {
        table: string;
        recordId: string;
        path: string;
        options?: QueryOptions<T>;
    }): Promise<T[]>;
    getRecords<T>(table: string, options?: QueryOptions<T>): Promise<T[]>;
    getRecordsWithCount<T>(table: string, options?: QueryOptions<T>): Promise<{
        data: T[];
        count: number;
    }>;
    countRecords<T>(table: string, options?: CountQueryOptions<T>): Promise<number>;
    getRecord<T>(table: string, id: string, options?: GetRecordQueryOptions<T>): Promise<T>;
    getValue(table: string, id: string, field: string): Promise<string>;
    crossjoin<T>({ tables, options, }: {
        tables: string[];
        options: CrossJoinQueryOptions<T>;
    }): Promise<string>;
    batch(): OperationBuilder;
    script<T>(name: string, params?: Record<string, unknown>): Promise<{
        success: boolean;
        data: T | undefined;
    }>;
    private getPagedCollection;
    private resolveNextLink;
    private parameterize;
    private parameterizeCount;
    private log;
}
export {};

import { ResponseType, AxiosResponse } from 'axios';
import { FileMakerCredentials } from './credentials';
export interface RequestOptions {
    headers?: Record<string, string>;
    responseType?: ResponseType;
}
export type RequestFailure = "not-connected" | "interrupted" | "response" | "other";
export interface RequestErrorDetails {
    status?: number;
    contentType?: string;
    failure?: RequestFailure;
}
export declare class RequestError extends Error {
    data?: unknown;
    status?: number;
    contentType?: string;
    failure: RequestFailure;
    constructor(message: string, data?: unknown, details?: RequestErrorDetails);
}
export declare class RequestTimeoutError extends RequestError {
    readonly timeout: number;
    constructor(timeout: number);
}
export declare const isRequestError: (error: unknown) => error is RequestError;
export declare const isRequestTimeoutError: (error: unknown) => error is RequestTimeoutError;
export type IResponseHeaders = AxiosResponse["headers"];
export interface IResponse<T> {
    data: T;
    headers: IResponseHeaders;
}
export interface IRequest {
    get<T>(url: string, options?: RequestOptions): Promise<IResponse<T>>;
    post<T>(url: string, params: string | Record<string, unknown> | null, options?: RequestOptions): Promise<IResponse<T>>;
}
type PlainObject = Record<string, unknown>;
export declare const mergeDeep: (target: PlainObject, source: PlainObject) => PlainObject;
/**
 * An IRequest implementation using Axios
 */
export declare class Request implements IRequest {
    private credentials;
    private agent?;
    private timeout?;
    constructor(credentials: FileMakerCredentials, agent?: unknown, timeout?: number);
    private config;
    private send;
    get<T>(url: string, options?: RequestOptions): Promise<AxiosResponse<T, any, {}, any>>;
    post<T>(url: string, params: string | Record<string, unknown> | null, options?: RequestOptions): Promise<AxiosResponse<T, any, {}, any>>;
}
export {};

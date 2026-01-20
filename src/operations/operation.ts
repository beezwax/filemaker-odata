export interface RecordWithId {
  ID: string;
}

export interface BatchOperationResponse<T> {
  status: number;
  body: T;
}

export interface BatchOperation {
  toRequestBody({
    boundary,
    changeId,
  }: {
    boundary: string;
    changeId: number;
  }): string;

  parseResponse(change: string): BatchOperationResponse<unknown>;
}

export interface FileMakerErrorResponse {
  error: { code: string; message: string };
}

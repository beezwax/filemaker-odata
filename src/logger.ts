export interface ILogger {
  log(message: unknown): void;
}

export class Logger implements ILogger {
  log(message: unknown) {
    console.log(message);
  }
}

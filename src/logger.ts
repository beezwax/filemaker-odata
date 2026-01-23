export interface ILogger {
  log(message: unknown): void;
}

export class Logger implements ILogger {
  log(message: unknown) {
    console.log(message);
  }
}

export class NullLogger implements ILogger {
  log() {}
}

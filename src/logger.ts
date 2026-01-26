export interface ILogger {
  log(message: unknown): void;
}

export class Logger implements ILogger {
  log(message: unknown) {
    console.dir(message, { depth: null });
  }
}

export class NullLogger implements ILogger {
  log() {}
}

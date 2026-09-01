export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export function ok<T>(data: T) {
  return {
    success: true as const,
    data,
  };
}

export function fail(error: string) {
  return {
    success: false as const,
    error,
  };
}

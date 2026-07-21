export type SourceErrorKind =
  | "network"
  | "timeout"
  | "http"
  | "content_type"
  | "schema"
  | "empty"
  | "not_found";

export class SourceError extends Error {
  readonly kind: SourceErrorKind;
  readonly sourceId: string;
  readonly httpStatus: number | null;

  constructor(options: {
    kind: SourceErrorKind;
    sourceId: string;
    message: string;
    httpStatus?: number | null;
    cause?: unknown;
  }) {
    super(
      options.message,
      options.cause ? { cause: options.cause } : undefined,
    );
    this.name = "SourceError";
    this.kind = options.kind;
    this.sourceId = options.sourceId;
    this.httpStatus = options.httpStatus ?? null;
  }
}

export function isSourceError(error: unknown): error is SourceError {
  return error instanceof SourceError;
}

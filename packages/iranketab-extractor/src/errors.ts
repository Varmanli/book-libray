export type IranKetabExtractionErrorCode =
  | "INVALID_URL" | "UNSUPPORTED_HOST" | "FETCH_FAILED" | "INVALID_RESPONSE"
  | "PAGE_STRUCTURE_UNRECOGNIZED" | "BOOK_TITLE_MISSING" | "AUTHOR_MISSING"
  | "NO_VALID_EDITIONS" | "PARSE_FAILED";

export class IranKetabExtractionError extends Error {
  readonly code: IranKetabExtractionErrorCode;
  readonly retryable: boolean;
  readonly context?: Readonly<Record<string, string | number | boolean | null>>;

  constructor(input: { code: IranKetabExtractionErrorCode; message: string; retryable?: boolean; context?: Record<string, string | number | boolean | null>; cause?: unknown }) {
    super(input.message, { cause: input.cause });
    this.name = "IranKetabExtractionError";
    this.code = input.code;
    this.retryable = input.retryable ?? false;
    this.context = input.context;
  }
}



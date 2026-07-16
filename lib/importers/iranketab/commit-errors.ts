import {
  attachErrorCheckpoint,
  type IranKetabErrorCheckpoint,
} from "./error-diagnostics";

export type IranKetabCommitErrorCode =
  | "INVALID_DRAFT"
  | "STALE_DRAFT"
  | "SOURCE_URL_CONFLICT"
  | "SOURCE_EDITION_CONFLICT"
  | "ENTITY_AMBIGUOUS"
  | "COVER_PROMOTION_FAILED"
  | "FINAL_MEDIA_KEY_GENERATION_FAILED"
  | "DATABASE_TRANSACTION_FAILED"
  | "IMPORT_ALREADY_COMPLETED"
  | "CONCURRENT_IMPORT_CONFLICT";

export const IRANKETAB_COMMIT_ERROR_MESSAGES: Record<IranKetabCommitErrorCode, string> = {
  INVALID_DRAFT: "پیش‌نویس ورود معتبر نیست.",
  STALE_DRAFT: "پیش‌نویس تغییر کرده است؛ دوباره اعتبارسنجی کنید.",
  SOURCE_URL_CONFLICT: "لینک ایران‌کتاب متعلق به کتاب دیگری است.",
  SOURCE_EDITION_CONFLICT: "کد نسخه ایران‌کتاب متعلق به نسخه دیگری است.",
  ENTITY_AMBIGUOUS: "یکی از مراجع چند تطابق احتمالی دارد.",
  COVER_PROMOTION_FAILED: "انتقال کاور کامل نشد؛ دوباره آماده‌سازی کنید.",
  FINAL_MEDIA_KEY_GENERATION_FAILED: "کلید نهایی رسانه تولید نشد؛ دوباره آماده‌سازی کنید.",
  DATABASE_TRANSACTION_FAILED: "ثبت تراکنشی اطلاعات انجام نشد.",
  IMPORT_ALREADY_COMPLETED: "این ورود قبلاً تکمیل شده است.",
  CONCURRENT_IMPORT_CONFLICT: "ورود هم‌زمان دیگری در حال انجام است.",
};

export class IranKetabCommitError extends Error {
  constructor(
    public readonly code: IranKetabCommitErrorCode,
    message = IRANKETAB_COMMIT_ERROR_MESSAGES[code],
    cause?: unknown,
  ) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "IranKetabCommitError";
  }
}

export function mediaValidationError(
  code: IranKetabCommitErrorCode,
  message: string,
  diagnostic: Record<string, unknown>,
): IranKetabCommitError {
  const error = new IranKetabCommitError(code, message);
  Object.assign(error, { diagnostic });
  return error;
}

export function wrapIranKetabCommitError(
  code: IranKetabCommitErrorCode,
  message: string,
  cause: unknown,
  errorCheckpoint: IranKetabErrorCheckpoint,
): IranKetabCommitError {
  attachErrorCheckpoint(cause, errorCheckpoint);
  const wrapped = new IranKetabCommitError(code, message, cause);
  attachErrorCheckpoint(wrapped, errorCheckpoint);
  return wrapped;
}

export function promotionFailure(
  error: unknown,
  failedDuringStorageOperation: boolean,
  errorCheckpoint: IranKetabErrorCheckpoint,
): unknown {
  attachErrorCheckpoint(error, errorCheckpoint);
  if (error instanceof IranKetabCommitError) return error;
  if (!failedDuringStorageOperation) return error;
  return wrapIranKetabCommitError(
    "COVER_PROMOTION_FAILED",
    "انتقال امن کاور به فضای نهایی ناموفق بود.",
    error,
    errorCheckpoint,
  );
}

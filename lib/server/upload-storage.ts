import type { ImageUploadFolder } from "@/lib/upload";
import { StorageError, uploadImageToS3 } from "@/lib/server/s3";
import { uploadImageToLocal } from "@/lib/server/local-upload";

export type UploadDriver = "s3" | "local";

export interface SaveUploadResult {
  key: string;
  url: string;
  driver: UploadDriver;
  /** اگر درایورِ اصلی S3 بود ولی به‌خاطر خطا به محلی برگشتیم. */
  fellBack: boolean;
}

/** درایورِ پیکربندی‌شده (پیش‌فرض S3). */
function configuredDriver(): UploadDriver {
  // Containers must never use /public/uploads: it is ephemeral and commonly
  // unwritable by the runtime user. Local storage is intentionally dev-only.
  if (process.env.NODE_ENV === "production") return "s3";
  return process.env.UPLOAD_DRIVER === "local" ? "local" : "s3";
}

/**
 * آیا در صورت خطای S3 به ذخیره‌سازیِ محلی برگردیم؟ در توسعه به‌صورت پیش‌فرض
 * روشن است (تا آپلودها هنگام در‌دسترس‌نبودن آروان از کار نیفتند) و در production
 * همیشه خاموش است.
 */
function localFallbackEnabled(): boolean {
  // Do not make this configurable in production. A successful fallback would
  // hide a broken object-storage configuration and lose files on redeploy.
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.UPLOAD_LOCAL_FALLBACK === "true") return true;
  if (process.env.UPLOAD_LOCAL_FALLBACK === "false") return false;
  return true;
}

/**
 * یک تصویر را با درایورِ انتخاب‌شده ذخیره می‌کند. اگر درایور S3 باشد و آپلود
 * به‌خاطر اتصال شکست بخورد، در صورت فعال‌بودنِ fallback به ذخیره‌سازیِ محلی
 * برمی‌گردد تا آپلودِ ادمین/برندینگ هرگز به‌خاطر مشکل شبکه از کار نیفتد.
 */
export async function saveImageUpload(params: {
  buffer: Buffer;
  contentType: string;
  filename: string;
  folder: ImageUploadFolder;
  objectKey?: string;
}): Promise<SaveUploadResult> {
  const driver = configuredDriver();

  if (driver === "local") {
    const r = await uploadImageToLocal(params);
    return { ...r, driver: "local", fellBack: false };
  }

  try {
    const r = await uploadImageToS3(params);
    return { ...r, driver: "s3", fellBack: false };
  } catch (err) {
    const isConnIssue =
      err instanceof StorageError &&
      (err.code === "STORAGE_TIMEOUT" ||
        err.code === "STORAGE_UNREACHABLE" ||
        err.code === "STORAGE_CONFIG");

    if (isConnIssue && localFallbackEnabled()) {
      console.warn(
        "[upload] S3 unavailable — falling back to local storage",
        { code: (err as StorageError).code, folder: params.folder },
      );
      const r = await uploadImageToLocal(params);
      return { ...r, driver: "local", fellBack: true };
    }
    throw err;
  }
}

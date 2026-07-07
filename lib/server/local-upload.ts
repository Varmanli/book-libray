import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";

import type { ImageUploadFolder } from "@/lib/upload";
import { buildUploadKey } from "@/lib/server/upload-key";

// درایورِ ذخیره‌سازیِ محلی: فایل را زیر public/uploads می‌نویسد و با مسیر عمومیِ
// /uploads/... سرو می‌شود. برای محیط‌هایی که فضای S3 (آروان) از شبکه‌ی سرور
// در دسترس نیست، یا به‌عنوان fallbackِ خودکار در توسعه. دیسکِ پایدار لازم است
// (روی پلتفرم‌های serverless/فقط‌خواندنی مناسب نیست).

const UPLOAD_ROOT = resolve(process.cwd(), "public", "uploads");

export async function uploadImageToLocal(params: {
  buffer: Buffer;
  contentType: string;
  filename: string;
  folder: ImageUploadFolder;
  objectKey?: string;
}): Promise<{ key: string; url: string }> {
  const key =
    params.objectKey && params.objectKey.trim()
      ? params.objectKey.trim().replace(/^\/+/, "")
      : buildUploadKey(params.folder, params.filename);
  const target = resolve(UPLOAD_ROOT, key);

  // محافظتِ پیمایش مسیر: مقصد باید داخل UPLOAD_ROOT باشد.
  if (target !== UPLOAD_ROOT && !target.startsWith(UPLOAD_ROOT + sep)) {
    throw new Error("Invalid upload path.");
  }

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, params.buffer);

  return { key, url: `/uploads/${key}` };
}

export { UPLOAD_ROOT };

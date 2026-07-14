import { copyFile, mkdir, stat, unlink, writeFile } from "node:fs/promises";
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
  metadata?: Record<string, string>;
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

export async function deleteImageFromLocal(key: string): Promise<void> {
  const target = resolve(UPLOAD_ROOT, key);
  if (target !== UPLOAD_ROOT && !target.startsWith(UPLOAD_ROOT + sep)) {
    throw new Error("Invalid upload path.");
  }
  try {
    await unlink(target);
  } catch (error) {
    if ((error as { code?: string }).code !== "ENOENT") throw error;
  }
}
export async function headImageInLocal(key: string) { const target = resolve(UPLOAD_ROOT, key); if (target !== UPLOAD_ROOT && !target.startsWith(UPLOAD_ROOT + sep)) throw new Error("Invalid upload path."); try { const info = await stat(target); return { key, sizeBytes: info.size, contentType: key.endsWith(".webp") ? "image/webp" : null, etag: null, metadata: {} }; } catch (error) { if ((error as { code?: string }).code === "ENOENT") return null; throw error; } }
export async function copyImageInLocal(sourceKey: string, destinationKey: string) { const source = resolve(UPLOAD_ROOT, sourceKey); const destination = resolve(UPLOAD_ROOT, destinationKey); if (!source.startsWith(UPLOAD_ROOT + sep) || !destination.startsWith(UPLOAD_ROOT + sep)) throw new Error("Invalid upload path."); await mkdir(dirname(destination), { recursive: true }); await copyFile(source, destination); }

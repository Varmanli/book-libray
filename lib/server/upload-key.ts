// ساختِ کلیدِ یکتا و امنِ آبجکت برای آپلود (مشترک بین درایور S3 و محلی).
// از کاراکترهای غیرمجاز/پیمایش مسیر جلوگیری می‌کند تا اجرای دلخواهِ فایل یا
// نوشتن خارج از پوشه‌ی مقصد ممکن نباشد.

export function sanitizeFilename(filename: string): string {
  const cleaned = filename
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "image";
}

export function buildUploadKey(folder: string, filename: string): string {
  return `${folder}/${Date.now()}-${crypto.randomUUID()}-${sanitizeFilename(
    filename,
  )}`;
}

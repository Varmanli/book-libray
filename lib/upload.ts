// محدودیت‌ها و فرمت‌های مجاز آپلود تصویر (مشترک بین کلاینت و سرور).

export const DEFAULT_MAX_UPLOAD_KB = 500;
export const MAX_UPLOAD_BYTES = DEFAULT_MAX_UPLOAD_KB * 1024;
export const MAX_UPLOAD_LABEL = "۵۰۰ کیلوبایت";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

export const IMAGE_UPLOAD_FOLDERS = [
  "covers",
  "avatars",
  "banners",
  "home",
  "blog",
  "references",
  "settings",
  "quotes",
  "temp",
] as const;

export type ImageUploadFolder = (typeof IMAGE_UPLOAD_FOLDERS)[number];

export const QUOTE_MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
export const QUOTE_MAX_UPLOAD_KB = QUOTE_MAX_UPLOAD_BYTES / 1024;

export const IMAGE_UPLOAD_POLICIES: Record<
  ImageUploadFolder,
  { maxInputBytes: number }
> = Object.fromEntries(
  IMAGE_UPLOAD_FOLDERS.map((folder) => [
    folder,
    { maxInputBytes: folder === "quotes" ? QUOTE_MAX_UPLOAD_BYTES : MAX_UPLOAD_BYTES },
  ]),
) as Record<ImageUploadFolder, { maxInputBytes: number }>;

export function getImageUploadPolicy(folder: ImageUploadFolder) {
  return IMAGE_UPLOAD_POLICIES[folder];
}

// فاوآیکون: علاوه بر فرمت‌های تصویرِ معمول، ‎.ico هم مجاز است.
export const FAVICON_ACCEPTED_TYPES = [
  "image/png",
  "image/x-icon",
  "image/vnd.microsoft.icon",
] as const;
export const FAVICON_ACCEPT_ATTR = ".ico,image/png,image/x-icon,image/vnd.microsoft.icon";
export const INVALID_FAVICON_TYPE_MESSAGE = "فاوآیکون باید PNG یا ICO باشد.";

export const GENERIC_INVALID_FILE_MESSAGE = "فایل معتبر نیست.";
export const INVALID_TYPE_MESSAGE =
  "فرمت تصویر باید JPG، PNG یا WEBP باشد.";
export const UPLOAD_FAILED_MESSAGE = "آپلود تصویر ناموفق بود.";
export const UPLOAD_SUCCESS_MESSAGE = "تصویر با موفقیت آپلود شد.";

export function formatUploadSizeLabel(maxSizeKb: number): string {
  if (maxSizeKb >= 1024 && maxSizeKb % 1024 === 0) {
    return `${(maxSizeKb / 1024).toLocaleString("fa-IR")} مگابایت`;
  }
  return `${maxSizeKb.toLocaleString("fa-IR")} کیلوبایت`;
}

export function getUploadHelperText(maxSizeKb = DEFAULT_MAX_UPLOAD_KB): string {
  return `JPG، PNG یا WEBP تا ${formatUploadSizeLabel(maxSizeKb)}`;
}

/** اعتبارسنجی مشترک یک فایل تصویر؛ در صورت خطا پیام فارسی برمی‌گرداند. */
export function validateImageFile(
  file: {
    type?: string | null;
    size?: number | null;
  },
  maxSizeBytes = MAX_UPLOAD_BYTES
): string | null {
  if (!file.type || typeof file.size !== "number") {
    return GENERIC_INVALID_FILE_MESSAGE;
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return INVALID_TYPE_MESSAGE;
  }
  if (file.size > maxSizeBytes) {
    return `حجم تصویر نباید بیشتر از ${formatUploadSizeLabel(
      Math.floor(maxSizeBytes / 1024)
    )} باشد.`;
  }
  return null;
}

/** اعتبارسنجی فایل فاوآیکون (PNG/ICO)؛ در صورت خطا پیام فارسی برمی‌گرداند. */
export function validateFaviconFile(
  file: { type?: string | null; size?: number | null },
  maxSizeBytes = MAX_UPLOAD_BYTES
): string | null {
  if (!file.type || typeof file.size !== "number") {
    return GENERIC_INVALID_FILE_MESSAGE;
  }
  if (
    !FAVICON_ACCEPTED_TYPES.includes(
      file.type as (typeof FAVICON_ACCEPTED_TYPES)[number]
    )
  ) {
    return INVALID_FAVICON_TYPE_MESSAGE;
  }
  if (file.size > maxSizeBytes) {
    return `حجم فایل نباید بیشتر از ${formatUploadSizeLabel(
      Math.floor(maxSizeBytes / 1024)
    )} باشد.`;
  }
  return null;
}

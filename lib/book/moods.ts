// فهرست حس/حال‌وهوای کتاب (MVP). مشترک بین فرم‌های کلاینت و اعتبارسنجی سرور.
export const MOOD_TAGS = [
  "غمگین",
  "شاد",
  "امیدوارکننده",
  "تلخ",
  "آرام",
  "الهام‌بخش",
  "فلسفی",
  "عمیق",
  "تاریک",
  "تأمل‌برانگیز",
  "پرکشش",
  "سنگین",
] as const;

export type MoodTag = (typeof MOOD_TAGS)[number];

const MOOD_SET = new Set<string>(MOOD_TAGS);

/**
 * اعتبارسنجی ورودی حس‌ها برای ذخیره:
 * - `undefined` یعنی فیلد ارسال نشده (به‌روزرسانی نشود).
 * - آرایه‌ی نامعتبر هم `undefined` برمی‌گرداند تا route آن را رد کند.
 * - مقادیر فقط از فهرست مجاز، بدون تکرار، پاک‌سازی می‌شوند.
 */
export function sanitizeMoodTags(value: unknown): string[] | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (!Array.isArray(value)) return undefined;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .filter((item) => MOOD_SET.has(item));
  return Array.from(new Set(cleaned)).slice(0, MOOD_TAGS.length);
}

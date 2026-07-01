// ابزار اسلاگ کتاب — توابع خالص بدون وابستگی به دیتابیس (قابل استفاده در کلاینت).

/** آیا مقدار یک UUID است؟ (لینک‌های قدیمی بر پایه‌ی id). */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * ساخت اسلاگ از عنوان. حروف فارسی/لاتین و اعداد حفظ می‌شوند؛ فاصله و نشانه‌ها
 * به خط تیره تبدیل می‌شوند. نیم‌فاصله و علامت‌های جهت حذف می‌شوند.
 */
export function slugify(input: string): string {
  return (input || "")
    .trim()
    .toLowerCase()
    .replace(/[‌‍‎‏]/g, "") // ZWNJ/ZWJ/LRM/RLM
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * اسلاگ یکتا از روی عنوان + مجموعه‌ی اسلاگ‌های گرفته‌شده. اگر پایه خالی بود یا
 * تکراری بود، پسوند کوتاه اضافه می‌شود.
 */
export function uniqueSlug(
  title: string,
  taken: Set<string>,
  fallback: string
): string {
  const base = slugify(title) || slugify(fallback) || "book";
  if (!taken.has(base)) return base;
  // پسوند کوتاه افزایشی
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  // در عمل هرگز به اینجا نمی‌رسیم؛ پسوند تصادفی به‌عنوان پشتیبان
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

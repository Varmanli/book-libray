export const MAGAZINE_CATEGORIES = [
  { slug: "reading-guide", name: "راهنمای مطالعه", description: "راهنماهایی برای انتخاب مسیر بعدی مطالعه." },
  { slug: "author-guide", name: "معرفی نویسندگان", description: "نویسندگان مهم و نقطهٔ شروع برای خواندن آثارشان." },
  { slug: "genre-and-literature", name: "ژانرها و ادبیات", description: "شناخت ژانرها، جریان‌ها و جهان ادبیات." },
  { slug: "book-recommendation", name: "پیشنهاد کتاب", description: "پیشنهادهایی برای پیدا کردن کتاب بعدی." },
  { slug: "book-review", name: "معرفی و بررسی کتاب", description: "نگاهی دقیق‌تر به کتاب‌هایی که ارزش خواندن دارند." },
  { slug: "reading-list", name: "فهرست‌ها و مجموعه‌های مطالعاتی", description: "فهرست‌های منتخب برای موقعیت‌ها و سلیقه‌های گوناگون." },
] as const;

export type MagazineCategorySlug = (typeof MAGAZINE_CATEGORIES)[number]["slug"];

export function getMagazineCategory(slug: string) {
  return MAGAZINE_CATEGORIES.find((category) => category.slug === slug) ?? null;
}

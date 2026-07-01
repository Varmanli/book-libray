// انواع سبک سمت کلاینت برای نتایج کاتالوگ (هم‌شکل با DTO سرویس سرور،
// اینجا جدا تعریف شده تا کد سرور/دیتابیس وارد باندل کلاینت نشود).

export interface CatalogEdition {
  id: string;
  translator: string | null;
  publisher: string | null;
  isbn: string | null;
  format: "PHYSICAL" | "ELECTRONIC";
  coverImage: string | null;
  publishedYear: number | null;
  editionLabel: string | null;
  pageCount: number | null;
  language: string | null;
}

export interface CatalogResult {
  id: string;
  title: string;
  author: string;
  description: string | null;
  genre: string | null;
  country: string | null;
  language: string | null;
  editions: CatalogEdition[];
}

export const READING_STATUS_LABELS: Record<string, string> = {
  UNREAD: "خوانده‌نشده",
  READING: "در حال خواندن",
  FINISHED: "تمام‌شده",
};

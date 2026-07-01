import { sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { Book, CatalogBook } from "@/db/schema";
import { coalesceCoverImage } from "@/lib/book/cover";

/**
 * هر آیتمِ محتوای صفحه‌ی اصلی (پیشنهادی/اسلاید) ممکن است به دو شکل ذخیره شده باشد:
 *  - جدید: `catalog_book_id` → مستقیم به CatalogBook (هویت کانونی).
 *  - قدیمی: `book_id` → ردیف کتابخانه‌ی کاربر (که شاید به کاتالوگ هم لینک باشد).
 *
 * این ماژول هر دو را به یک شکلِ یکدست (slug/title/author/cover کانونی) تبدیل می‌کند
 * تا همه‌ی بخش‌های صفحه‌ی اصلی از یک resolver واحد عبور کنند.
 */
export interface ResolvedHomeBook {
  catalogBookId: string | null;
  slug: string | null;
  title: string;
  author: string;
  coverImage: string | null;
  genre: string | null;
}

/** نام‌های مستعار برای join (هر فراخوانی نام یکتای خودش را می‌دهد تا تداخل نشود). */
export function homeBookJoins(prefix: string) {
  return {
    directCatalog: alias(CatalogBook, `${prefix}_direct_cat`),
    linkedBook: alias(Book, `${prefix}_linked_book`),
    linkedCatalog: alias(CatalogBook, `${prefix}_linked_cat`),
  };
}

type HomeBookJoins = ReturnType<typeof homeBookJoins>;

/** عبارت SQL برای شناسه‌ی کانونیِ کاتالوگ (از لینک مستقیم یا از طریق ردیف Book). */
function canonicalCatalogId(j: HomeBookJoins): SQL<string | null> {
  return sql<string | null>`coalesce(${j.directCatalog.id}, ${j.linkedCatalog.id})`;
}

/** بهترین جلدِ نسخه‌ی تأییدشده برای هویت کانونی (همان منطق آرشیو عمومی). */
function bestEditionCover(j: HomeBookJoins): SQL<string | null> {
  return sql<string | null>`(
    select be.cover_image
    from "BookEdition" be
    where be.catalog_book_id = coalesce(${j.directCatalog.id}, ${j.linkedCatalog.id})
      and be.status = 'APPROVED'
    order by
      (be.cover_image is not null and trim(be.cover_image) <> '') desc,
      be.published_year desc nulls last,
      be.created_at desc
    limit 1
  )`;
}

/** ستون‌های یکدستِ resolved برای استفاده در select (هویت کانونی + fallback جلد). */
export function homeBookColumns(j: HomeBookJoins) {
  return {
    catalogBookId: canonicalCatalogId(j),
    slug: sql<string | null>`coalesce(
      ${j.directCatalog.slug},
      ${j.linkedCatalog.slug},
      ${j.linkedBook.slug}
    )`,
    title: sql<string | null>`coalesce(${j.directCatalog.title}, ${j.linkedBook.title})`,
    author: sql<string | null>`coalesce(${j.directCatalog.author}, ${j.linkedBook.author})`,
    genre: sql<string | null>`coalesce(${j.directCatalog.genre}, ${j.linkedBook.genre})`,
    // ترتیب fallback جلد: بهترین نسخه ← جلد کاتالوگ ← جلد ردیف کتابخانه.
    coverImage: sql<string | null>`coalesce(
      ${bestEditionCover(j)},
      ${j.directCatalog.coverImage},
      ${j.linkedCatalog.coverImage},
      ${j.linkedBook.coverImage}
    )`,
  };
}

/** پاکسازی نهاییِ یک ردیف resolved در سمت JS (نرمال‌سازی جلد، حذف عنوان خالی). */
export function normalizeResolvedHomeBook(row: {
  catalogBookId: string | null;
  slug: string | null;
  title: string | null;
  author: string | null;
  genre: string | null;
  coverImage: string | null;
}): ResolvedHomeBook | null {
  const title = row.title?.trim();
  if (!title) return null;
  return {
    catalogBookId: row.catalogBookId,
    slug: row.slug?.trim() || null,
    title,
    author: row.author?.trim() || "",
    coverImage: coalesceCoverImage(row.coverImage),
    genre: row.genre?.trim() || null,
  };
}

import { and, desc, eq, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { Book, ReferenceItem } from "@/db/schema";
import type { ReferenceTypeValue } from "@/lib/validations/reference";

export interface ReferenceEntity {
  id: string;
  type: ReferenceTypeValue;
  name: string;
  slug: string;
  coverImage: string | null;
  bannerImage: string | null;
  description: string | null;
}

export interface ReferenceBookCard {
  id: string;
  slug: string | null;
  title: string;
  author: string;
  translator: string | null;
  publisher: string | null;
  coverImage: string | null;
  rating: number | null;
  createdAt: Date;
}

/** مسیر عمومی هر نوع موجودیت. */
export const ROUTE_BY_TYPE: Record<ReferenceTypeValue, string> = {
  AUTHOR: "authors",
  TRANSLATOR: "translators",
  PUBLISHER: "publishers",
  COUNTRY: "countries",
  GENRE: "genres",
};

/** فیلد رشته‌ای متناظر در جدول Book برای هر نوع موجودیت. */
const FIELD_BY_TYPE = {
  AUTHOR: Book.author,
  TRANSLATOR: Book.translator,
  PUBLISHER: Book.publisher,
  COUNTRY: Book.country,
  GENRE: Book.genre,
} as const;

/**
 * موجودیت مرجع عمومی را با اسلاگ یا نام (هردو) پیدا می‌کند. فقط موارد APPROVED
 * عمومی‌اند؛ PENDING/REJECTED برای عموم نامرئی است.
 */
export async function getReferenceEntity(
  type: ReferenceTypeValue,
  ref: string
): Promise<ReferenceEntity | null> {
  const [row] = await db
    .select({
      id: ReferenceItem.id,
      type: ReferenceItem.type,
      name: ReferenceItem.name,
      slug: ReferenceItem.slug,
      coverImage: ReferenceItem.coverImage,
      bannerImage: ReferenceItem.bannerImage,
      description: ReferenceItem.description,
    })
    .from(ReferenceItem)
    .where(
      and(
        eq(ReferenceItem.type, type),
        eq(ReferenceItem.status, "APPROVED"),
        or(
          eq(ReferenceItem.slug, ref),
          sql`lower(${ReferenceItem.name}) = lower(${ref})`
        )
      )
    )
    .limit(1);

  if (!row?.slug) return null;
  return { ...row, slug: row.slug };
}

/**
 * کتاب‌های مرتبط با یک موجودیت: ردیف‌های Book که فیلد متناظرشان با نام موجودیت
 * برابر است. تکراری‌ها (یک کتاب کانونی که چند کاربر اضافه کرده‌اند) بر اساس
 * هویت کاتالوگ یکتا می‌شوند تا هر کتاب فقط یک‌بار دیده شود.
 */
export async function getReferenceBooks(
  type: ReferenceTypeValue,
  name: string
): Promise<ReferenceBookCard[]> {
  const field = FIELD_BY_TYPE[type];
  const rows = await db
    .select({
      id: Book.id,
      slug: Book.slug,
      title: Book.title,
      author: Book.author,
      translator: Book.translator,
      publisher: Book.publisher,
      coverImage: Book.coverImage,
      rating: Book.rating,
      createdAt: Book.createdAt,
      catalogBookId: Book.catalogBookId,
    })
    .from(Book)
    .where(sql`lower(${field}) = lower(${name})`)
    .orderBy(desc(Book.createdAt));

  const seen = new Set<string>();
  const out: ReferenceBookCard[] = [];
  for (const row of rows) {
    const key = row.catalogBookId ?? row.id;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: row.id,
      slug: row.slug,
      title: row.title,
      author: row.author,
      translator: row.translator,
      publisher: row.publisher,
      coverImage: row.coverImage,
      rating: row.rating,
      createdAt: row.createdAt,
    });
  }
  return out;
}

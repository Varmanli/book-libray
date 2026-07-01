import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { BookEdition, CatalogBook } from "@/db/schema";
import { coalesceCoverImage } from "@/lib/book/cover";
import { ensureCatalogBookSlug } from "@/lib/book/public-slug";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit")) || 10));
    const offset = (page - 1) * limit;

    if (query.length === 0) {
      return NextResponse.json({ books: [], total: 0, page, limit, totalPages: 0 });
    }

    const searchTerm = `%${query}%`;
    const bestEditionField = <T,>(fieldName: string) => sql<T>`(
      select be.${sql.raw(fieldName)}
      from "BookEdition" be
      where be.catalog_book_id = ${CatalogBook.id}
        and be.status = 'APPROVED'
      order by
        (be.cover_image is not null and trim(be.cover_image) <> '') desc,
        be.published_year desc nulls last,
        be.created_at desc
      limit 1
    )`;

    const where = and(
      eq(CatalogBook.status, "APPROVED"),
      or(
        ilike(CatalogBook.title, searchTerm),
        ilike(CatalogBook.originalTitle, searchTerm),
        ilike(CatalogBook.author, searchTerm),
        ilike(CatalogBook.genre, searchTerm),
        ilike(BookEdition.translator, searchTerm),
        ilike(BookEdition.publisher, searchTerm),
      ),
    );

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: CatalogBook.id,
          slug: CatalogBook.slug,
          title: CatalogBook.title,
          author: CatalogBook.author,
          genre: CatalogBook.genre,
          translator: bestEditionField<string | null>("translator"),
          publisher: bestEditionField<string | null>("publisher"),
          coverImage: sql<string | null>`coalesce(
            ${bestEditionField<string | null>("cover_image")},
            ${CatalogBook.coverImage}
          )`,
          createdAt: CatalogBook.createdAt,
        })
        .from(CatalogBook)
        .leftJoin(BookEdition, eq(BookEdition.catalogBookId, CatalogBook.id))
        .where(where)
        .groupBy(CatalogBook.id)
        .orderBy(desc(CatalogBook.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(distinct ${CatalogBook.id})::int` })
        .from(CatalogBook)
        .leftJoin(BookEdition, eq(BookEdition.catalogBookId, CatalogBook.id))
        .where(where),
    ]);

    const books = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        slug: await ensureCatalogBookSlug({
          id: row.id,
          title: row.title,
          slug: row.slug,
        }),
        coverImage: coalesceCoverImage(row.coverImage),
      })),
    );

    const total = countRows[0]?.count ?? 0;

    return NextResponse.json({
      books,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (err) {
    console.error("❌ خطا در جستجوی کتاب‌ها:", err);
    return NextResponse.json(
      { error: "خطا در جستجوی کتاب‌ها" },
      { status: 500 },
    );
  }
}

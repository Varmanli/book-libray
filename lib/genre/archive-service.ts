import { and, asc, desc, eq, ilike, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { ReferenceItem } from "@/db/schema";
import { approvedCatalogGenreBookCount } from "@/lib/genre/query";
import {
  GENRE_ARCHIVE_PAGE_SIZE,
  getGenreArchivePageCount,
  normalizeGenreArchivePage,
  type GenreArchiveFilters,
} from "@/lib/genre/archive-search";

export type GenreArchiveItem = {
  id: string;
  name: string;
  slug: string;
  bookCount: number;
};

export type GenreArchiveResult = {
  items: GenreArchiveItem[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  q: string;
};

const genreBookCount = approvedCatalogGenreBookCount(ReferenceItem.name);

function genreArchiveCondition(q: string) {
  return and(
    eq(ReferenceItem.type, "GENRE"),
    eq(ReferenceItem.status, "APPROVED"),
    isNotNull(ReferenceItem.slug),
    sql`${genreBookCount} > 0`,
    q ? ilike(ReferenceItem.name, "%" + q + "%") : undefined,
  );
}

/**
 * Database-paginated public Genre directory. Eligibility and counts share the
 * same complete-token approved-catalog rule used by Genre landing pages.
 */
export async function getGenreArchive(
  filters: GenreArchiveFilters,
  pageSize = GENRE_ARCHIVE_PAGE_SIZE,
): Promise<GenreArchiveResult> {
  const q = filters.q.trim();
  const condition = genreArchiveCondition(q);
  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(ReferenceItem)
    .where(condition);
  const total = countRow?.total ?? 0;
  const page = normalizeGenreArchivePage(filters.page, total, pageSize);
  const pageCount = getGenreArchivePageCount(total, pageSize);

  const rows = await db
    .select({
      id: ReferenceItem.id,
      name: ReferenceItem.name,
      slug: ReferenceItem.slug,
      bookCount: genreBookCount,
    })
    .from(ReferenceItem)
    .where(condition)
    .orderBy(desc(genreBookCount), asc(ReferenceItem.name))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    items: rows.map((row) => ({ ...row, slug: row.slug! })),
    total,
    page,
    pageCount,
    pageSize,
    q,
  };
}

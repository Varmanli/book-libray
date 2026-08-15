import { sql } from "drizzle-orm";

/** Matches the complete genre token across every separator accepted by genre input. */
export function catalogGenreContains(column: unknown, name: unknown) {
  return sql`exists (
    select 1 from regexp_split_to_table(coalesce(${column}, ''), E'[\\n\\r،,;؛•]+') as genre_value
    where lower(trim(genre_value)) = lower(${name})
  )`;
}

/** Counts only approved catalog books whose genre field contains this complete token. */
export function approvedCatalogGenreBookCount(name: unknown) {
  return sql<number>`(
    select count(*)::int
    from "CatalogBook" book
    where book.status = 'APPROVED'
      and ${catalogGenreContains(sql`book.genre`, name)}
  )`;
}

export function eligibleGenreRows<T extends { slug: string | null; bookCount: number }>(rows: T[]) {
  return rows.filter((row) => Boolean(row.slug) && row.bookCount > 0);
}

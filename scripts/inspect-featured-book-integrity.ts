import { sql } from "drizzle-orm";

import { db } from "@/db";

async function main() {
  const duplicateCatalogRows = await db.execute(sql`
    select
      hfb.catalog_book_id,
      count(*)::int as row_count
    from "HomeFeaturedBook" hfb
    where hfb.is_active = true
      and hfb.catalog_book_id is not null
    group by hfb.catalog_book_id
    having count(*) > 1
    order by count(*) desc, hfb.catalog_book_id asc
  `);

  const mixedReferenceRows = await db.execute(sql`
    select
      hfb.id,
      hfb.catalog_book_id,
      hfb.book_id,
      hfb.sort_order,
      hfb.is_active,
      hfb.created_at
    from "HomeFeaturedBook" hfb
    where hfb.catalog_book_id is not null
      and hfb.book_id is not null
    order by hfb.sort_order asc, hfb.created_at asc
  `);

  const legacyDuplicateRows = await db.execute(sql`
    select
      hfb.id,
      hfb.catalog_book_id,
      hfb.book_id,
      b.catalog_book_id as linked_catalog_book_id,
      hfb.sort_order,
      hfb.is_active
    from "HomeFeaturedBook" hfb
    left join "Book" b on b.id = hfb.book_id
    where hfb.is_active = true
      and hfb.book_id is not null
      and b.catalog_book_id is not null
    order by b.catalog_book_id asc, hfb.sort_order asc
  `);

  console.log("Active direct catalog duplicates:");
  console.table(duplicateCatalogRows.rows);

  console.log('Rows with both "catalog_book_id" and "book_id" set:');
  console.table(mixedReferenceRows.rows);

  console.log("Active legacy rows that resolve to a catalog book:");
  console.table(legacyDuplicateRows.rows);
}

void main().catch((error) => {
  console.error("featured book integrity inspection failed:", error);
  process.exitCode = 1;
});

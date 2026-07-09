/**
 * Reports and, only with --apply, repairs invalid CatalogBook primary pointers.
 * It never deletes or merges CatalogBook/BookEdition rows and is idempotent.
 */
import { pool } from "@/db";

const APPLY = process.argv.includes("--apply");

const crossBookSql = `
  SELECT cb.id AS catalog_book_id, cb.title AS catalog_book_title,
         cb.primary_edition_id, be.catalog_book_id AS actual_edition_parent,
         parent.title AS actual_parent_title
  FROM "CatalogBook" cb
  JOIN "BookEdition" be ON be.id = cb.primary_edition_id
  JOIN "CatalogBook" parent ON parent.id = be.catalog_book_id
  WHERE be.catalog_book_id <> cb.id
  ORDER BY cb.updated_at DESC NULLS LAST, cb.id`;

const missingTargetSql = `
  SELECT cb.id, cb.title, cb.primary_edition_id
  FROM "CatalogBook" cb
  LEFT JOIN "BookEdition" be ON be.id = cb.primary_edition_id
  WHERE cb.primary_edition_id IS NOT NULL AND be.id IS NULL
  ORDER BY cb.updated_at DESC NULLS LAST, cb.id`;

async function report(query: string, title: string) {
  const { rows } = await pool.query(query);
  console.log(`\n${title}: ${rows.length}`);
  console.table(rows);
  return rows;
}

async function main() {
  const schema = await pool.query<{ table_name: string; column_name: string }>(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('CatalogBook', 'BookEdition')
      AND column_name IN ('id', 'title', 'author', 'primary_edition_id', 'catalog_book_id', 'updated_at')`);
  const found = new Set(schema.rows.map((row) => `${row.table_name}.${row.column_name}`));
  for (const required of [
    "CatalogBook.id", "CatalogBook.primary_edition_id", "BookEdition.id", "BookEdition.catalog_book_id",
  ]) {
    if (!found.has(required)) {
      throw new Error(`Production schema is incompatible: missing ${required}`);
    }
  }
  console.log(APPLY ? "APPLY mode: invalid pointers will be cleared." : "DRY RUN: no data will be changed. Pass --apply to clear invalid pointers.");
  const crossBook = await report(crossBookSql, "Cross-book primary edition pointers");
  const missing = await report(missingTargetSql, "Missing primary edition targets");
  await report(`
    SELECT id, title_override, catalog_book_id, created_at, updated_at
    FROM "BookEdition"
    ORDER BY updated_at DESC NULLS LAST
    LIMIT 100`, "Most recently changed editions");
  await report(`
    SELECT lower(trim(title)) AS normalized_title, lower(trim(author)) AS normalized_author,
           count(*)::int AS catalog_book_count, array_agg(id ORDER BY id) AS catalog_book_ids
    FROM "CatalogBook"
    GROUP BY lower(trim(title)), lower(trim(author))
    HAVING count(*) > 1
    ORDER BY catalog_book_count DESC, normalized_title`, "Possible duplicate CatalogBooks (report only)");

  if (!APPLY) return;
  const ids = [...crossBook, ...missing].map((row) => row.catalog_book_id ?? row.id);
  if (ids.length === 0) return;
  const result = await pool.query(
    `UPDATE "CatalogBook" SET primary_edition_id = NULL, updated_at = NOW()
     WHERE id = ANY($1::varchar[]) AND primary_edition_id IS NOT NULL`,
    [ids],
  );
  console.log(`Cleared ${result.rowCount ?? 0} invalid primary edition pointer(s).`);
}

main()
  .catch((error) => {
    console.error("Primary-edition integrity repair failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

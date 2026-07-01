/**
 * Applies the BlogCategory table + BlogPost.category_id column.
 * Run once:
 *   npx tsx --env-file=.env scripts/apply-blog-categories.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { pool } from "@/db";

async function main() {
  const sqlPath = join(process.cwd(), "drizzle", "0011_blog_categories.sql");
  const statements = readFileSync(sqlPath, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  const { rows } = await pool.query(
    `SELECT
       to_regclass('public."BlogCategory"') AS category_table,
       (SELECT count(*)
          FROM information_schema.columns
         WHERE table_name = 'BlogPost' AND column_name = 'category_id') AS category_column`
  );

  console.log("BlogCategory:", rows[0]?.category_table ?? "MISSING");
  console.log(
    "BlogPost.category_id:",
    Number(rows[0]?.category_column ?? 0) === 1 ? "present" : "MISSING",
  );

  await pool.end();
}

main().catch((err) => {
  console.error("Failed to apply blog category DDL:", err);
  process.exit(1);
});

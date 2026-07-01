/**
 * Applies the BlogPost table + BlogPostStatus enum (additive, idempotent enough
 * for a one-time local/dev migration run). Run once:
 *   npx tsx --env-file=.env scripts/apply-blog-posts.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { pool } from "@/db";

async function main() {
  const sqlPath = join(process.cwd(), "drizzle", "0010_blog_posts.sql");
  const statements = readFileSync(sqlPath, "utf8")
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  const { rows } = await pool.query(
    `SELECT
       to_regclass('public."BlogPost"') AS blog_table,
       EXISTS (
         SELECT 1
         FROM pg_type
         WHERE typname = 'BlogPostStatus'
       ) AS has_status_enum`
  );

  console.log("BlogPost:", rows[0]?.blog_table ?? "MISSING");
  console.log(
    "BlogPostStatus:",
    rows[0]?.has_status_enum ? "present" : "MISSING",
  );

  await pool.end();
}

main().catch((err) => {
  console.error("Failed to apply blog DDL:", err);
  process.exit(1);
});

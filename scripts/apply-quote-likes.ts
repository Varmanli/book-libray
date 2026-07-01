/**
 * Applies the QuoteLike table DDL directly (surgical, additive). Run once:
 *   npx tsx --env-file=.env scripts/apply-quote-likes.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";

async function main() {
  const sqlPath = join(process.cwd(), "drizzle", "0006_quote_likes.sql");
  const raw = readFileSync(sqlPath, "utf8");
  const statements = raw
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  const { rows } = await pool.query(
    "SELECT to_regclass('public.\"QuoteLike\"') AS table"
  );
  console.log("QuoteLike table:", rows[0]?.table ?? "NOT CREATED");
  await pool.end();
}

main().catch((err) => {
  console.error("Failed to apply QuoteLike DDL:", err);
  process.exit(1);
});

/**
 * Applies the profile-banner column + PublishedBookNote table (additive,
 * idempotent). Run once:
 *   npx tsx --env-file=.env scripts/apply-banner-and-notes.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";

async function main() {
  const sqlPath = join(process.cwd(), "drizzle", "0007_banner_and_notes.sql");
  const statements = readFileSync(sqlPath, "utf8")
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await pool.query(statement);
  }

  const { rows } = await pool.query(
    `SELECT
       to_regclass('public."PublishedBookNote"') AS notes_table,
       (SELECT count(*) FROM information_schema.columns
         WHERE table_name = 'User' AND column_name = 'profile_banner_image') AS banner_col`
  );
  console.log("PublishedBookNote:", rows[0]?.notes_table ?? "NOT CREATED");
  console.log("User.profile_banner_image:", rows[0]?.banner_col === "1" || rows[0]?.banner_col === 1 ? "present" : "MISSING");
  await pool.end();
}

main().catch((err) => {
  console.error("Failed to apply banner/notes DDL:", err);
  process.exit(1);
});

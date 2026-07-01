import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";

async function main() {
  const sql = readFileSync(
    join(process.cwd(), "drizzle", "0013_home_content_catalog.sql"),
    "utf8",
  );
  for (const s of sql
    .split("--> statement-breakpoint")
    .map((x) => x.trim())
    .filter(Boolean)) {
    await pool.query(s);
  }

  const { rows: featured } = await pool.query(
    "SELECT count(*) AS c FROM information_schema.columns WHERE table_name='HomeFeaturedBook' AND column_name='catalog_book_id'",
  );
  const { rows: hero } = await pool.query(
    "SELECT count(*) AS c FROM information_schema.columns WHERE table_name='HomeHeroSlideBook' AND column_name='catalog_book_id'",
  );
  console.log(
    "HomeFeaturedBook.catalog_book_id:",
    Number(featured[0].c) === 1 ? "present" : "MISSING",
  );
  console.log(
    "HomeHeroSlideBook.catalog_book_id:",
    Number(hero[0].c) === 1 ? "present" : "MISSING",
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

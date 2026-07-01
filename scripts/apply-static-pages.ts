import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";
import { ensureDefaultStaticPages } from "@/lib/static-pages/service";

async function main() {
  const sql = readFileSync(
    join(process.cwd(), "drizzle", "0016_static_pages.sql"),
    "utf8",
  );
  for (const s of sql
    .split("--> statement-breakpoint")
    .map((x) => x.trim())
    .filter(Boolean)) {
    await pool.query(s);
  }

  const { rows } = await pool.query(
    "SELECT count(*) AS c FROM information_schema.tables WHERE table_name='StaticPage'",
  );
  console.log(
    "StaticPage table:",
    Number(rows[0].c) === 1 ? "present" : "MISSING",
  );

  // صفحه‌های هسته‌ای را در صورت نبود می‌سازد (idempotent).
  await ensureDefaultStaticPages();
  const { rows: countRows } = await pool.query(
    'SELECT count(*) AS c FROM "StaticPage"',
  );
  console.log("StaticPage rows:", Number(countRows[0].c));

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

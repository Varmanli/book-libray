import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";

async function main() {
  const sql = readFileSync(
    join(process.cwd(), "drizzle", "0015_site_settings.sql"),
    "utf8",
  );
  for (const s of sql
    .split("--> statement-breakpoint")
    .map((x) => x.trim())
    .filter(Boolean)) {
    await pool.query(s);
  }

  const { rows } = await pool.query(
    "SELECT count(*) AS c FROM information_schema.tables WHERE table_name='SiteSetting'",
  );
  console.log("SiteSetting table:", Number(rows[0].c) === 1 ? "present" : "MISSING");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pool } from "@/db";
async function main() {
  const sql = readFileSync(join(process.cwd(), "drizzle", "0009_note_likes.sql"), "utf8");
  for (const s of sql.split("--> statement-breakpoint").map(x=>x.trim()).filter(Boolean)) await pool.query(s);
  const { rows } = await pool.query("SELECT to_regclass('public.\"PublishedBookNoteLike\"') AS t");
  console.log("PublishedBookNoteLike:", rows[0].t ?? "MISSING");
  await pool.end();
}
main().catch(e=>{console.error(e);process.exit(1);});

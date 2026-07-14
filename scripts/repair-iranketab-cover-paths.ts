import pg from "pg";
import { headImageUpload } from "@/lib/server/upload-storage";
import { repairVerifiedIranKetabCoverPaths } from "@/lib/importers/iranketab/repair-cover-paths";

async function main() {
 const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
 await client.connect();
 try {
  const { rows } = await client.query<{ id: string; cover_image: string }>(
    `select id, cover_image from "BookEdition" where cover_image like '/uploads/covers/iranketab-%' order by id`,
  );
  const result = await repairVerifiedIranKetabCoverPaths({
    rows: rows.map((row) => ({ id: row.id, coverImage: row.cover_image })),
    objectExists: async (key) => Boolean(await headImageUpload(key)),
    updateCoverImage: async (id, key) => {
      await client.query(
        `update "BookEdition" set cover_image = $1, updated_at = now() where id = $2 and cover_image = $3`,
        [key, id, `/uploads/${key}`],
      );
    },
  });
  console.log(JSON.stringify({ repaired: result.repaired.length, skipped: result.skipped.length, ids: result.repaired.map((item) => item.id) }));
 } finally {
   await client.end();
 }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : "repair failed"); process.exitCode = 1; });

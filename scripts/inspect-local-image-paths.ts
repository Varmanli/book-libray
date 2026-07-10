/** Read-only report of legacy image values that point at container-local uploads. */
import { pool } from "@/db";

const localPathPredicate = (column: string) => `(
  ${column} LIKE '/uploads/%' OR ${column} LIKE 'uploads/%'
  OR ${column} LIKE 'public/uploads/%' OR ${column} LIKE '/public/uploads/%'
  OR ${column} LIKE '/app/public/uploads/%'
)`;

const reports = [
  ["CatalogBook.cover_image", `SELECT id, title, cover_image AS image_value FROM "CatalogBook" WHERE ${localPathPredicate("cover_image")}`],
  ["BookEdition.cover_image", `SELECT id, catalog_book_id, cover_image AS image_value FROM "BookEdition" WHERE ${localPathPredicate("cover_image")}`],
  ["Book.cover_image (legacy)", `SELECT id, title, cover_image AS image_value FROM "Book" WHERE ${localPathPredicate("cover_image")}`],
  ["ReferenceItem image fields", `SELECT id, name, 'cover_image' AS field, cover_image AS image_value FROM "ReferenceItem" WHERE ${localPathPredicate("cover_image")}
    UNION ALL SELECT id, name, 'banner_image', banner_image FROM "ReferenceItem" WHERE ${localPathPredicate("banner_image")}
    UNION ALL SELECT id, name, 'image_filename', image_filename FROM "ReferenceItem" WHERE ${localPathPredicate("image_filename")}`],
  ["User avatar/banner fields", `SELECT id, username, 'image' AS field, image AS image_value FROM "User" WHERE ${localPathPredicate("image")}
    UNION ALL SELECT id, username, 'profile_banner_image', profile_banner_image FROM "User" WHERE ${localPathPredicate("profile_banner_image")}`],
  ["BlogPost.banner_image", `SELECT id, title, banner_image AS image_value FROM "BlogPost" WHERE ${localPathPredicate("banner_image")}`],
  ["HomeHeroSlide.image_url", `SELECT id, title, image_url AS image_value FROM "HomeHeroSlide" WHERE ${localPathPredicate("image_url")}`],
  ["SiteSetting values", `SELECT key AS id, key AS title, value AS image_value FROM "SiteSetting" WHERE ${localPathPredicate("value")}`],
  ["StaticPage embedded paths", `SELECT id, slug AS title, content AS image_value FROM "StaticPage" WHERE content LIKE '%/uploads/%' OR content LIKE '%public/uploads/%' OR content LIKE '%/app/public/uploads/%'`],
] as const;

async function main() {
  let total = 0;
  console.log("Read-only local image path diagnostic. No rows will be modified.");
  for (const [name, query] of reports) {
    const { rows } = await pool.query(query);
    total += rows.length;
    console.log(`\n${name}: ${rows.length}`);
    console.table(rows);
  }
  console.log(`\nTotal stale local image-path values: ${total}`);
}

main()
  .catch((error) => {
    console.error("Local image-path diagnostic failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });

/**
 * Backfill `public-read` ACL on existing image objects referenced in the DB.
 *
 * Objects uploaded before the `ACL: "public-read"` fix in lib/server/s3.ts were
 * stored privately on ArvanCloud, so their public URLs return 403 and the
 * images do not render in the UI. This one-off script re-applies a public-read
 * ACL to every avatar / banner / cover URL currently stored in the database.
 *
 * Run once after deploying the upload fix:
 *   node scripts/backfill-public-acl.mjs
 */
import "dotenv/config";
import { Pool } from "pg";
import { PutObjectAclCommand, S3Client } from "@aws-sdk/client-s3";

const base = (process.env.S3_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
const bucket = process.env.S3_BUCKET;

if (!base || !bucket) {
  console.error("S3_PUBLIC_BASE_URL / S3_BUCKET missing in environment.");
  process.exit(1);
}

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/** Extract the object key from a stored public URL, or null if not on our bucket. */
function keyOf(url) {
  if (!url) return null;
  return url.startsWith(`${base}/`) ? url.slice(base.length + 1) : null;
}

const QUERIES = [
  `SELECT image AS u FROM "User" WHERE image IS NOT NULL`,
  `SELECT profile_banner_image AS u FROM "User" WHERE profile_banner_image IS NOT NULL`,
  `SELECT cover_image AS u FROM "Book" WHERE cover_image IS NOT NULL`,
  `SELECT cover_image AS u FROM "CatalogBook" WHERE cover_image IS NOT NULL`,
];

async function main() {
  const urls = new Set();
  for (const q of QUERIES) {
    try {
      const { rows } = await pool.query(q);
      rows.forEach((row) => urls.add(row.u));
    } catch (e) {
      console.log("query skipped:", e.message);
    }
  }

  let ok = 0;
  let fail = 0;
  let skipped = 0;
  for (const url of urls) {
    const key = keyOf(url);
    if (!key) {
      skipped++;
      continue;
    }
    try {
      await s3.send(
        new PutObjectAclCommand({ Bucket: bucket, Key: key, ACL: "public-read" })
      );
      ok++;
    } catch (e) {
      fail++;
      console.log("ACL failed:", key, e.name);
    }
  }

  console.log(
    `backfill complete — ${ok} updated, ${fail} failed, ${skipped} non-bucket skipped (of ${urls.size} URLs).`
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { Pool } from "pg";

import { loadScriptEnv } from "./load-script-env.mjs";

function log(message) {
  console.log(`[prod-db-repair] ${message}`);
}

function logError(message, error) {
  console.error(`[prod-db-repair] ${message}`, error);
}

function isStrictMode() {
  return (
    process.env.DB_REPAIR_STRICT === "true" ||
    process.env.FEATURED_REPAIR_STRICT === "true"
  );
}

function maybeExitFailure() {
  if (isStrictMode()) {
    process.exit(1);
  }
  process.exit(0);
}

const enumStatements = [
  `DO $$ BEGIN
     CREATE TYPE "BookFormat" AS ENUM ('PHYSICAL', 'ELECTRONIC');
   EXCEPTION
     WHEN duplicate_object THEN NULL;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
   EXCEPTION
     WHEN duplicate_object THEN NULL;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "NoteScope" AS ENUM ('book', 'edition');
   EXCEPTION
     WHEN duplicate_object THEN NULL;
   END $$;`,
];

const bookStatements = [
  'ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "slug" text',
  'ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "mood_tags" text[]',
  'ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "is_favorite" boolean DEFAULT false',
  'ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar',
  'ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "edition_id" varchar',
];

const bookEditionStatements = [
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "title_override" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "translator" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "publisher" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "isbn" varchar(20)',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "isbn10" varchar(20)',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "isbn13" varchar(20)',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "format" "BookFormat"',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "cover_image" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "cover_filename" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "published_year" integer',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "edition_label" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "edition_description" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "page_count" integer',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "language" varchar(50)',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "source_name" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "source_url" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "source_edition_code" text',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "status" "ApprovalStatus"',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "created_by_id" varchar',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "created_at" timestamp',
  'ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "updated_at" timestamp',
];

const catalogBookStatements = [
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "subtitle" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "slug" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "original_title" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "description" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "cover_image" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "author" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "language" varchar(50)',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "genre" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "country" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "first_published_year" integer',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "source_name" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "source_url" text',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "status" "ApprovalStatus"',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "primary_edition_id" varchar',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "created_by_id" varchar',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "created_at" timestamp',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "updated_at" timestamp',
];

const referenceItemStatements = [
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "slug" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "cover_image" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "banner_image" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "original_name" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "description" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "short_description" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "image_filename" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "source_name" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "source_url" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "seo_title" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "seo_description" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "metadata" jsonb',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "birth_year" integer',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "death_year" integer',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "country_name" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "country_slug" text',
  'ALTER TABLE "ReferenceItem" ADD COLUMN IF NOT EXISTS "website" text',
];

const publishedBookNoteStatements = [
  'ALTER TABLE "PublishedBookNote" ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar',
  'ALTER TABLE "PublishedBookNote" ADD COLUMN IF NOT EXISTS "book_edition_id" varchar',
  'ALTER TABLE "PublishedBookNote" ADD COLUMN IF NOT EXISTS "scope" "NoteScope"',
];

const quoteStatements = [
  // Added nullable first; repairQuoteIntegrity backfills and validates ownership
  // before enforcing the authoritative NOT NULL contract.
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "user_id" varchar',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "book_edition_id" varchar',
];

const publishedBookNoteLikeStatements = [
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "id" varchar',
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "note_id" varchar',
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "user_id" varchar',
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "created_at" timestamp',
];

const homeFeaturedBookStatements = [
  'ALTER TABLE "HomeFeaturedBook" ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar',
  'ALTER TABLE "HomeFeaturedBook" ADD COLUMN IF NOT EXISTS "book_id" varchar',
  'ALTER TABLE "HomeFeaturedBook" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 0',
  'ALTER TABLE "HomeFeaturedBook" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true',
  'ALTER TABLE "HomeFeaturedBook" ADD COLUMN IF NOT EXISTS "created_at" timestamp',
  'ALTER TABLE "HomeFeaturedBook" ADD COLUMN IF NOT EXISTS "updated_at" timestamp',
];

async function tableExists(pool, tableName) {
  const result = await pool.query("select to_regclass($1) as table_name", [
    `"${tableName}"`,
  ]);
  return Boolean(result.rows[0]?.table_name);
}

async function runStatements(pool, tableName, statements) {
  const exists = await tableExists(pool, tableName);
  if (!exists) {
    log(`table "${tableName}" does not exist, skipping.`);
    return false;
  }

  log(`repairing "${tableName}" columns...`);
  for (const statement of statements) {
    console.log(statement);
    await pool.query(statement);
  }

  return true;
}

async function repairFeaturedBookIntegrity(pool) {
  const homeFeaturedExists = await tableExists(pool, "HomeFeaturedBook");
  if (!homeFeaturedExists) {
    log('table "HomeFeaturedBook" does not exist, skipping featured repair.');
    return;
  }

  const bookTableExists = await tableExists(pool, "Book");
  if (!bookTableExists) {
    log('table "Book" does not exist, skipping featured repair.');
    return;
  }

  log("repairing featured book integrity...");

  const mixedRefsResult = await pool.query(`
    UPDATE "HomeFeaturedBook"
    SET "book_id" = NULL, "updated_at" = NOW()
    WHERE "catalog_book_id" IS NOT NULL
      AND "book_id" IS NOT NULL
  `);

  const duplicateRowsResult = await pool.query(`
    WITH ranked AS (
      SELECT
        h."id",
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(h."catalog_book_id", b."catalog_book_id")
          ORDER BY h."sort_order" ASC, h."created_at" ASC NULLS LAST, h."id" ASC
        ) AS row_number
      FROM "HomeFeaturedBook" h
      LEFT JOIN "Book" b ON b."id" = h."book_id"
      WHERE h."is_active" = TRUE
        AND COALESCE(h."catalog_book_id", b."catalog_book_id") IS NOT NULL
    )
    UPDATE "HomeFeaturedBook" h
    SET "is_active" = FALSE, "updated_at" = NOW()
    FROM ranked
    WHERE h."id" = ranked."id"
      AND ranked.row_number > 1
  `);

  const migratedRowsResult = await pool.query(`
    UPDATE "HomeFeaturedBook" h
    SET
      "catalog_book_id" = b."catalog_book_id",
      "book_id" = NULL,
      "updated_at" = NOW()
    FROM "Book" b
    WHERE h."book_id" = b."id"
      AND h."catalog_book_id" IS NULL
      AND b."catalog_book_id" IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM "HomeFeaturedBook" existing
        WHERE existing."id" <> h."id"
          AND existing."catalog_book_id" = b."catalog_book_id"
      )
  `);

  log(
    `featured repair summary: mixedRefsFixed=${mixedRefsResult.rowCount ?? 0}, duplicatesDeactivated=${duplicateRowsResult.rowCount ?? 0}, legacyRowsMigrated=${migratedRowsResult.rowCount ?? 0}`,
  );
}

async function repairQuoteIntegrity(pool) {
  const requiredTables = await Promise.all(
    ["Quote", "Book", "User", "CatalogBook", "BookEdition"].map((table) =>
      tableExists(pool, table),
    ),
  );
  if (requiredTables.some((exists) => !exists)) {
    log("Quote relation repair skipped because a required table does not exist.");
    return;
  }

  await pool.query("BEGIN");
  try {
    await pool.query(`
    UPDATE "Quote" q
    SET "user_id" = b."user_id"
    FROM "Book" b
    WHERE q."book_id" = b."id" AND q."user_id" IS NULL
  `);

    const unresolved = await pool.query(`
      SELECT count(*)::int AS count
      FROM "Quote" q
      LEFT JOIN "Book" b ON b."id" = q."book_id"
      WHERE q."user_id" IS NULL OR b."id" IS NULL OR b."user_id" IS NULL
    `);
    if (unresolved.rows[0].count > 0) {
      throw new Error(
        `Quote ownership audit failed: ${unresolved.rows[0].count} row(s) cannot be mapped from Quote.book_id to Book.user_id`,
      );
    }

    await pool.query(`
      ALTER TABLE "Quote" ALTER COLUMN "user_id" SET NOT NULL
    `);
    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "Quote" ADD CONSTRAINT "Quote_user_id_User_id_fk"
          FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "Quote_user_id_idx" ON "Quote" ("user_id")
    `);

    await pool.query(`
    UPDATE "Quote" q SET "catalog_book_id" = NULL
    WHERE q."catalog_book_id" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "CatalogBook" cb WHERE cb."id" = q."catalog_book_id")
    `);
    await pool.query(`
    UPDATE "Quote" q SET "book_edition_id" = NULL
    WHERE q."book_edition_id" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM "BookEdition" be WHERE be."id" = q."book_edition_id")
    `);
    await pool.query(`
    UPDATE "Quote" q
    SET
      "catalog_book_id" = COALESCE(q."catalog_book_id", b."catalog_book_id"),
      "book_edition_id" = COALESCE(q."book_edition_id", b."edition_id")
    FROM "Book" b
    WHERE q."book_id" = b."id"
      AND (q."catalog_book_id" IS NULL OR q."book_edition_id" IS NULL)
    `);

    for (const statement of [
    `DO $$ BEGIN
       ALTER TABLE "Quote" ADD CONSTRAINT "Quote_catalog_book_id_CatalogBook_id_fk"
       FOREIGN KEY ("catalog_book_id") REFERENCES "CatalogBook"("id") ON DELETE SET NULL;
     EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `DO $$ BEGIN
       ALTER TABLE "Quote" ADD CONSTRAINT "Quote_book_edition_id_BookEdition_id_fk"
       FOREIGN KEY ("book_edition_id") REFERENCES "BookEdition"("id") ON DELETE SET NULL;
     EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    ]) {
      await pool.query(statement);
    }
    await pool.query("COMMIT");
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function main() {
  const { loadedFiles } = loadScriptEnv();
  if (loadedFiles.length > 0) {
    log(`loaded env files: ${loadedFiles.join(", ")}`);
  }

  if (!process.env.DATABASE_URL) {
    log(
      "DATABASE_URL is not set after loading env files. Checked .env.local, .env.production, and .env.",
    );
    maybeExitFailure();
    return;
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query("select 1");

    log("ensuring production enum types exist...");
    for (const statement of enumStatements) {
      await pool.query(statement);
    }

    await runStatements(pool, "Book", bookStatements);
    await runStatements(pool, "BookEdition", bookEditionStatements);
    await runStatements(pool, "CatalogBook", catalogBookStatements);
    await runStatements(pool, "ReferenceItem", referenceItemStatements);
    await runStatements(pool, "Quote", quoteStatements);
    await runStatements(pool, "PublishedBookNote", publishedBookNoteStatements);
    await runStatements(
      pool,
      "PublishedBookNoteLike",
      publishedBookNoteLikeStatements,
    );
    await runStatements(pool, "HomeFeaturedBook", homeFeaturedBookStatements);
    await repairQuoteIntegrity(pool);
    await repairFeaturedBookIntegrity(pool);

    log("production database repair completed.");
  } catch (error) {
    logError("production database repair failed:", error);
    maybeExitFailure();
  } finally {
    await pool.end();
  }
}

void main();

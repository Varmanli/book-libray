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
  `DO $$ BEGIN
     CREATE TYPE "IranKetabImportStatus" AS ENUM ('CREATED','EXTRACTING','PREVIEW_READY','DRAFT_REVIEW','COVER_PREPARATION','IMPORTING_REFERENCES','READY_TO_COMMIT','COMMITTING','SUCCESS','FAILED','CANCELLED');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN
     CREATE TYPE "IranKetabImportEventType" AS ENUM ('SESSION_CREATED','EXTRACTION_STARTED','EXTRACTION_COMPLETED','DRAFT_SAVED','COVER_PREPARATION_STARTED','COVER_PREPARATION_COMPLETED','CONTRIBUTOR_STEP_STARTED','CONTRIBUTOR_PROFILE_FETCH_STARTED','CONTRIBUTOR_PROFILE_FETCH_COMPLETED','CONTRIBUTOR_MATCHED','CONTRIBUTOR_CREATED','CONTRIBUTOR_UPDATED','CONTRIBUTOR_IGNORED','CONTRIBUTOR_IMAGE_STAGED','CONTRIBUTOR_FAILED','CONTRIBUTOR_STEP_COMPLETED','COMMIT_STARTED','COMMIT_COMPLETED','COMMIT_FAILED');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  `DO $$ BEGIN CREATE TYPE "CatalogBookContributorRole" AS ENUM ('AUTHOR','TRANSLATOR'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
];

const contributorStatements = [
  `CREATE TABLE IF NOT EXISTS "CatalogBookContributor" ("id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "catalog_book_id" varchar NOT NULL, "reference_item_id" varchar NOT NULL, "role" "CatalogBookContributorRole" NOT NULL, "sort_order" integer DEFAULT 0 NOT NULL, "source_name" text, "source_url" text, CONSTRAINT "CatalogBookContributor_unique" UNIQUE("catalog_book_id","reference_item_id","role"))`,
  `CREATE TABLE IF NOT EXISTS "BookEditionPublisher" ("id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL, "book_edition_id" varchar NOT NULL, "reference_item_id" varchar NOT NULL, "sort_order" integer DEFAULT 0 NOT NULL, "source_name" text, "source_url" text, CONSTRAINT "BookEditionPublisher_unique" UNIQUE("book_edition_id","reference_item_id"))`,
  `CREATE INDEX IF NOT EXISTS "CatalogBookContributor_catalog_idx" ON "CatalogBookContributor" ("catalog_book_id")`,
  `CREATE INDEX IF NOT EXISTS "CatalogBookContributor_reference_idx" ON "CatalogBookContributor" ("reference_item_id")`,
  `CREATE INDEX IF NOT EXISTS "BookEditionPublisher_edition_idx" ON "BookEditionPublisher" ("book_edition_id")`,
  `CREATE INDEX IF NOT EXISTS "BookEditionPublisher_reference_idx" ON "BookEditionPublisher" ("reference_item_id")`,
];

// PostgreSQL enum labels are added outside the table-repair transaction. This
// is intentional: a newly-added label must be committed before verification
// inserts use it during the same prestart run.
const importerEnumValueStatements = [
  `ALTER TYPE "IranKetabImportStatus" ADD VALUE IF NOT EXISTS 'IMPORTING_REFERENCES'`,
  ...[
    'CONTRIBUTOR_STEP_STARTED', 'CONTRIBUTOR_PROFILE_FETCH_STARTED',
    'CONTRIBUTOR_PROFILE_FETCH_COMPLETED', 'CONTRIBUTOR_MATCHED',
    'CONTRIBUTOR_CREATED', 'CONTRIBUTOR_UPDATED', 'CONTRIBUTOR_IGNORED',
    'CONTRIBUTOR_IMAGE_STAGED', 'CONTRIBUTOR_FAILED',
    'CONTRIBUTOR_STEP_COMPLETED',
  ].map((value) => `ALTER TYPE "IranKetabImportEventType" ADD VALUE IF NOT EXISTS '${value}'`),
];

const importerTableStatements = [
  `CREATE TABLE IF NOT EXISTS "IranKetabImportSession" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "admin_id" varchar NOT NULL,
    "source_url" text NOT NULL,
    "canonical_source_url" text NOT NULL,
    "source_name" text DEFAULT 'iranketab' NOT NULL,
    "status" "IranKetabImportStatus" DEFAULT 'CREATED' NOT NULL,
    "started_at" timestamp,
    "completed_at" timestamp,
    "draft_version" integer DEFAULT 1 NOT NULL,
    "catalog_id" varchar,
    "draft" jsonb,
    "extraction" jsonb,
    "extraction_fingerprint" text,
    "prepared_covers" jsonb,
    "result_summary" jsonb,
    "error_code" text,
    "error_message" text,
    "retryable" boolean DEFAULT false NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS "IranKetabImportEvent" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "session_id" varchar NOT NULL,
    "type" "IranKetabImportEventType" NOT NULL,
    "metadata" jsonb,
    "created_at" timestamp DEFAULT now() NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "IranKetabImportSession_admin_idx" ON "IranKetabImportSession" ("admin_id")`,
  `CREATE INDEX IF NOT EXISTS "IranKetabImportSession_status_idx" ON "IranKetabImportSession" ("status")`,
  `CREATE INDEX IF NOT EXISTS "IranKetabImportSession_created_idx" ON "IranKetabImportSession" ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "IranKetabImportSession_canonical_idx" ON "IranKetabImportSession" ("canonical_source_url")`,
  `CREATE INDEX IF NOT EXISTS "IranKetabImportEvent_session_idx" ON "IranKetabImportEvent" ("session_id")`,
  `CREATE INDEX IF NOT EXISTS "IranKetabImportEvent_created_idx" ON "IranKetabImportEvent" ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "IranKetabImportEvent_type_idx" ON "IranKetabImportEvent" ("type")`,
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
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "id" varchar DEFAULT gen_random_uuid()',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "content" text',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "page" integer',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "book_id" varchar',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "user_id" varchar',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "image_key" text',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "book_edition_id" varchar',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "created_at" timestamp',
  'ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "updated_at" timestamp',
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

async function repairImporterSchema(pool) {
  for (const statement of importerTableStatements) await pool.query(statement);
  for (const statement of [
    `DO $$ BEGIN ALTER TABLE "IranKetabImportSession" ADD CONSTRAINT "IranKetabImportSession_admin_id_User_id_fk" FOREIGN KEY ("admin_id") REFERENCES "User"("id") ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `DO $$ BEGIN ALTER TABLE "IranKetabImportSession" ADD CONSTRAINT "IranKetabImportSession_catalog_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "CatalogBook"("id") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `DO $$ BEGIN ALTER TABLE "IranKetabImportEvent" ADD CONSTRAINT "IranKetabImportEvent_session_id_IranKetabImportSession_id_fk" FOREIGN KEY ("session_id") REFERENCES "IranKetabImportSession"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  ]) await pool.query(statement);
}

async function repairContributorSchema(pool) {
  for (const statement of contributorStatements) await pool.query(statement);
  for (const statement of [
    `DO $$ BEGIN ALTER TABLE "CatalogBookContributor" ADD CONSTRAINT "CatalogBookContributor_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "CatalogBook"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `DO $$ BEGIN ALTER TABLE "CatalogBookContributor" ADD CONSTRAINT "CatalogBookContributor_reference_item_id_ReferenceItem_id_fk" FOREIGN KEY ("reference_item_id") REFERENCES "ReferenceItem"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `DO $$ BEGIN ALTER TABLE "BookEditionPublisher" ADD CONSTRAINT "BookEditionPublisher_book_edition_id_BookEdition_id_fk" FOREIGN KEY ("book_edition_id") REFERENCES "BookEdition"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    `DO $$ BEGIN ALTER TABLE "BookEditionPublisher" ADD CONSTRAINT "BookEditionPublisher_reference_item_id_ReferenceItem_id_fk" FOREIGN KEY ("reference_item_id") REFERENCES "ReferenceItem"("id") ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
  ]) await pool.query(statement);
}

async function verifyImporterSchema(pool) {
  const expected = {
    IranKetabImportSession: {
      id: ['character varying', 'NO', 'gen_random_uuid()'], admin_id: ['character varying', 'NO', null], source_url: ['text','NO',null], canonical_source_url: ['text','NO',null], source_name: ['text','NO',"'iranketab'::text"], status: ['USER-DEFINED','NO',"'CREATED'::\"IranKetabImportStatus\""], started_at: ['timestamp without time zone','YES',null], completed_at: ['timestamp without time zone','YES',null], draft_version: ['integer','NO','1'], catalog_id: ['character varying','YES',null], draft: ['jsonb','YES',null], extraction: ['jsonb','YES',null], extraction_fingerprint: ['text','YES',null], prepared_covers: ['jsonb','YES',null], result_summary: ['jsonb','YES',null], error_code: ['text','YES',null], error_message: ['text','YES',null], retryable: ['boolean','NO','false'], metadata: ['jsonb','YES',null], created_at: ['timestamp without time zone','NO','now()'], updated_at: ['timestamp without time zone','NO','now()']
    },
    IranKetabImportEvent: { id: ['character varying','NO','gen_random_uuid()'], session_id: ['character varying','NO',null], type: ['USER-DEFINED','NO',null], metadata: ['jsonb','YES',null], created_at: ['timestamp without time zone','NO','now()'] }
  };
  const failures = [];
  for (const [table, fields] of Object.entries(expected)) {
    const result = await pool.query(`SELECT column_name,data_type,udt_name,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`, [table]);
    const rows = new Map(result.rows.map((row) => [row.column_name, row]));
    for (const [column, [type, nullable, defaultValue]] of Object.entries(fields)) {
      const row = rows.get(column);
      const actualType = row?.data_type === 'USER-DEFINED' ? row.udt_name : row?.data_type;
      if (!row || (type === 'USER-DEFINED' ? actualType !== (column === 'status' ? 'IranKetabImportStatus' : 'IranKetabImportEventType') : actualType !== type) || row.is_nullable !== nullable || (defaultValue && !row.column_default.includes(defaultValue))) failures.push(`${table}.${column}`);
    }
  }
  const enums = await pool.query(`SELECT typname FROM pg_type WHERE typname IN ('IranKetabImportStatus','IranKetabImportEventType')`);
  if (enums.rowCount !== 2) failures.push('importer enums');
  const constraints = await pool.query(`SELECT conname FROM pg_constraint WHERE conrelid IN ('public."IranKetabImportSession"'::regclass,'public."IranKetabImportEvent"'::regclass)`);
  for (const name of ['IranKetabImportSession_admin_id_User_id_fk','IranKetabImportSession_catalog_id_CatalogBook_id_fk','IranKetabImportEvent_session_id_IranKetabImportSession_id_fk']) if (!constraints.rows.some((row) => row.conname === name)) failures.push(`constraint ${name}`);
  const indexes = await pool.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename IN ('IranKetabImportSession','IranKetabImportEvent')`);
  for (const name of ['IranKetabImportSession_admin_idx','IranKetabImportSession_status_idx','IranKetabImportSession_created_idx','IranKetabImportSession_canonical_idx','IranKetabImportEvent_session_idx','IranKetabImportEvent_created_idx','IranKetabImportEvent_type_idx']) if (!indexes.rows.some((row) => row.indexname === name)) failures.push(`index ${name}`);
  if (failures.length) throw new Error(`IranKetab importer schema verification failed: ${failures.join(', ')}`);
  log('IranKetab importer schema verification passed.');
}

async function verifyImporterEnumValues(pool) {
  const expected = [
    'CONTRIBUTOR_STEP_STARTED', 'CONTRIBUTOR_PROFILE_FETCH_STARTED',
    'CONTRIBUTOR_PROFILE_FETCH_COMPLETED', 'CONTRIBUTOR_MATCHED',
    'CONTRIBUTOR_CREATED', 'CONTRIBUTOR_UPDATED', 'CONTRIBUTOR_IGNORED',
    'CONTRIBUTOR_IMAGE_STAGED', 'CONTRIBUTOR_FAILED',
    'CONTRIBUTOR_STEP_COMPLETED',
  ];
  const result = await pool.query(`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE pg_type.typname = 'IranKetabImportEventType'`);
  const actual = new Set(result.rows.map((row) => row.enumlabel));
  const missing = expected.filter((value) => !actual.has(value));
  if (missing.length) throw new Error(`IranKetabImportEventType enum verification failed: ${missing.join(', ')}`);
  await pool.query('BEGIN');
  try {
    const [session] = (await pool.query(`SELECT id FROM "IranKetabImportSession" LIMIT 1`)).rows;
    const [admin] = (await pool.query(`SELECT id FROM "User" LIMIT 1`)).rows;
    const sessionId = session?.id ?? (await pool.query(`INSERT INTO "IranKetabImportSession" (admin_id, source_url, canonical_source_url, status) VALUES ($1, 'https://iranketab.ir/verification', 'https://iranketab.ir/verification', 'IMPORTING_REFERENCES') RETURNING id`, [admin?.id])).rows[0]?.id;
    if (!sessionId) throw new Error('No admin available for importer enum insert verification.');
    for (const value of expected) await pool.query(`INSERT INTO "IranKetabImportEvent" (session_id, type, metadata) VALUES ($1, $2, '{}'::jsonb)`, [sessionId, value]);
    await pool.query('ROLLBACK');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  }
  log(`IranKetabImportEventType verification passed for ${expected.length} contributor values; rollback insert test passed.`);
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
      UPDATE "Quote"
      SET "created_at" = COALESCE("created_at", NOW()),
          "updated_at" = COALESCE("updated_at", "created_at", NOW())
      WHERE "created_at" IS NULL OR "updated_at" IS NULL
    `);
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
      ALTER TABLE "Quote" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
      ALTER TABLE "Quote" ALTER COLUMN "content" SET NOT NULL;
      ALTER TABLE "Quote" ALTER COLUMN "book_id" SET NOT NULL;
      ALTER TABLE "Quote" ALTER COLUMN "created_at" SET DEFAULT NOW();
      ALTER TABLE "Quote" ALTER COLUMN "created_at" SET NOT NULL;
      ALTER TABLE "Quote" ALTER COLUMN "updated_at" SET DEFAULT NOW();
      ALTER TABLE "Quote" ALTER COLUMN "updated_at" SET NOT NULL;
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
      CREATE INDEX IF NOT EXISTS "Quote_book_id_idx" ON "Quote" ("book_id")
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "Quote_created_at_idx" ON "Quote" ("created_at")
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "Quote_updated_at_idx" ON "Quote" ("updated_at")
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "Quote_image_key_unique"
      ON "Quote" ("image_key")
    `);

    for (const statement of [
      `DO $$ BEGIN
         ALTER TABLE "Quote" ADD CONSTRAINT "Quote_book_id_Book_id_fk"
         FOREIGN KEY ("book_id") REFERENCES "Book"("id") ON DELETE CASCADE;
       EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    ]) {
      await pool.query(statement);
    }

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

async function verifyQuoteSchema(pool) {
  const columns = await pool.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Quote'
  `);
  const expectedColumns = {
    id: ['character varying', 'NO', 'gen_random_uuid()'],
    content: ['text', 'NO', null],
    image_key: ['text', 'YES', null],
    page: ['integer', 'YES', null],
    book_id: ['character varying', 'NO', null],
    user_id: ['character varying', 'NO', null],
    catalog_book_id: ['character varying', 'YES', null],
    book_edition_id: ['character varying', 'YES', null],
    created_at: ['timestamp without time zone', 'NO', 'now()'],
    updated_at: ['timestamp without time zone', 'NO', 'now()'],
  };
  const actualColumns = new Map(columns.rows.map((row) => [row.column_name, row]));
  const failures = [];
  for (const [name, [type, nullable, defaultValue]] of Object.entries(expectedColumns)) {
    const actual = actualColumns.get(name);
    if (!actual || actual.data_type !== type || actual.is_nullable !== nullable ||
        (defaultValue && actual.column_default !== defaultValue)) {
      failures.push(`${name}=${JSON.stringify(actual ?? null)}`);
    }
  }

  const constraints = await pool.query(`
    SELECT conname, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'public."Quote"'::regclass
  `);
  const requiredConstraints = {
    Quote_book_id_Book_id_fk: 'FOREIGN KEY (book_id) REFERENCES "Book"(id) ON DELETE CASCADE',
    Quote_user_id_User_id_fk: 'FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE',
    Quote_catalog_book_id_CatalogBook_id_fk: 'FOREIGN KEY (catalog_book_id) REFERENCES "CatalogBook"(id) ON DELETE SET NULL',
    Quote_book_edition_id_BookEdition_id_fk: 'FOREIGN KEY (book_edition_id) REFERENCES "BookEdition"(id) ON DELETE SET NULL',
  };
  const actualConstraints = new Map(constraints.rows.map((row) => [row.conname, row.definition]));
  for (const [name, definition] of Object.entries(requiredConstraints)) {
    if (!actualConstraints.get(name)?.replaceAll('"public".', '')) failures.push(`constraint ${name}`);
  }

  const indexes = await pool.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='Quote'`);
  const actualIndexes = new Set(indexes.rows.map((row) => row.indexname));
  for (const name of ['Quote_image_key_unique', 'Quote_book_id_idx', 'Quote_user_id_idx', 'Quote_created_at_idx', 'Quote_updated_at_idx']) {
    if (!actualIndexes.has(name)) failures.push(`index ${name}`);
  }
  if (failures.length) throw new Error(`Quote schema verification failed: ${failures.join(', ')}`);
  log('Quote schema verification passed.');
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
    for (const statement of importerEnumValueStatements) await pool.query(statement);
    await repairImporterSchema(pool);
    await repairContributorSchema(pool);

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
    await verifyQuoteSchema(pool);
    await verifyImporterSchema(pool);
    await verifyImporterEnumValues(pool);
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

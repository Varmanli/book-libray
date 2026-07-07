import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required for production database repair.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "created_by_id" varchar',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "created_at" timestamp',
  'ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "updated_at" timestamp',
];

const publishedBookNoteStatements = [
  'ALTER TABLE "PublishedBookNote" ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar',
  'ALTER TABLE "PublishedBookNote" ADD COLUMN IF NOT EXISTS "book_edition_id" varchar',
  'ALTER TABLE "PublishedBookNote" ADD COLUMN IF NOT EXISTS "scope" "NoteScope"',
];

const publishedBookNoteLikeStatements = [
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "id" varchar',
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "note_id" varchar',
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "user_id" varchar',
  'ALTER TABLE "PublishedBookNoteLike" ADD COLUMN IF NOT EXISTS "created_at" timestamp',
];

try {
  await pool.query("select 1");

  console.log("Ensuring production enum types exist...");
  for (const statement of enumStatements) {
    await pool.query(statement);
  }

  const tableCheck = await pool.query(
    "select to_regclass($1) as table_name",
    ['"BookEdition"']
  );

  if (!tableCheck.rows[0]?.table_name) {
    throw new Error('Required table "BookEdition" does not exist.');
  }

  console.log('Repairing "BookEdition" columns...');
  for (const statement of bookEditionStatements) {
    console.log(statement);
    await pool.query(statement);
  }

  const catalogTableCheck = await pool.query(
    "select to_regclass($1) as table_name",
    ['"CatalogBook"']
  );

  if (!catalogTableCheck.rows[0]?.table_name) {
    throw new Error('Required table "CatalogBook" does not exist.');
  }

  console.log('Repairing "CatalogBook" columns...');
  for (const statement of catalogBookStatements) {
    console.log(statement);
    await pool.query(statement);
  }

  const publishedBookNoteTableCheck = await pool.query(
    "select to_regclass($1) as table_name",
    ['"PublishedBookNote"']
  );

  if (!publishedBookNoteTableCheck.rows[0]?.table_name) {
    throw new Error('Required table "PublishedBookNote" does not exist.');
  }

  console.log('Repairing "PublishedBookNote" columns...');
  for (const statement of publishedBookNoteStatements) {
    console.log(statement);
    await pool.query(statement);
  }

  const publishedBookNoteLikeTableCheck = await pool.query(
    "select to_regclass($1) as table_name",
    ['"PublishedBookNoteLike"']
  );

  if (!publishedBookNoteLikeTableCheck.rows[0]?.table_name) {
    throw new Error('Required table "PublishedBookNoteLike" does not exist.');
  }

  console.log('Repairing "PublishedBookNoteLike" columns...');
  for (const statement of publishedBookNoteLikeStatements) {
    console.log(statement);
    await pool.query(statement);
  }

  console.log("Production database repair completed.");
} finally {
  await pool.end();
}

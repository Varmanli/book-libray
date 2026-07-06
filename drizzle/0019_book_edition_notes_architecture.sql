DO $$ BEGIN
 CREATE TYPE "public"."NoteScope" AS ENUM('book', 'edition');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "CatalogBook"
  ADD COLUMN IF NOT EXISTS "subtitle" text,
  ADD COLUMN IF NOT EXISTS "first_published_year" integer,
  ADD COLUMN IF NOT EXISTS "source_name" text,
  ADD COLUMN IF NOT EXISTS "source_url" text;

ALTER TABLE "BookEdition"
  ADD COLUMN IF NOT EXISTS "title_override" text,
  ADD COLUMN IF NOT EXISTS "isbn10" varchar(20),
  ADD COLUMN IF NOT EXISTS "isbn13" varchar(20),
  ADD COLUMN IF NOT EXISTS "edition_description" text,
  ADD COLUMN IF NOT EXISTS "source_name" text,
  ADD COLUMN IF NOT EXISTS "source_url" text,
  ADD COLUMN IF NOT EXISTS "source_edition_code" text;

ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar,
  ADD COLUMN IF NOT EXISTS "book_edition_id" varchar;

DO $$ BEGIN
 ALTER TABLE "Quote"
   ADD CONSTRAINT "Quote_catalog_book_id_fk"
   FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id")
   ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "Quote"
   ADD CONSTRAINT "Quote_book_edition_id_fk"
   FOREIGN KEY ("book_edition_id") REFERENCES "public"."BookEdition"("id")
   ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "PublishedBookNote"
  ALTER COLUMN "book_id" DROP NOT NULL;

ALTER TABLE "PublishedBookNote"
  ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar,
  ADD COLUMN IF NOT EXISTS "book_edition_id" varchar,
  ADD COLUMN IF NOT EXISTS "scope" "public"."NoteScope" DEFAULT 'book' NOT NULL;

DO $$ BEGIN
 ALTER TABLE "PublishedBookNote"
   ADD CONSTRAINT "PublishedBookNote_catalog_book_id_fk"
   FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id")
   ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "PublishedBookNote"
   ADD CONSTRAINT "PublishedBookNote_book_edition_id_fk"
   FOREIGN KEY ("book_edition_id") REFERENCES "public"."BookEdition"("id")
   ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

UPDATE "Quote" q
SET
  "catalog_book_id" = b."catalog_book_id",
  "book_edition_id" = b."edition_id"
FROM "Book" b
WHERE q."book_id" = b."id"
  AND (q."catalog_book_id" IS NULL OR q."book_edition_id" IS NULL);

UPDATE "PublishedBookNote" n
SET
  "catalog_book_id" = b."catalog_book_id",
  "book_edition_id" = NULL,
  "scope" = 'book'
FROM "Book" b
WHERE n."book_id" = b."id"
  AND n."catalog_book_id" IS NULL;

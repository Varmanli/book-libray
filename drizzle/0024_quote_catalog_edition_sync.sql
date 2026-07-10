-- Quote keeps book_id as its required link to the user's library entry.
-- These optional links enable catalog- and edition-aware reads and must match
-- the Drizzle Quote definition.
ALTER TABLE "Quote"
  ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar,
  ADD COLUMN IF NOT EXISTS "book_edition_id" varchar;

-- Clear only optional references that cannot satisfy their foreign keys.
UPDATE "Quote" q
SET "catalog_book_id" = NULL
WHERE q."catalog_book_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "CatalogBook" cb WHERE cb."id" = q."catalog_book_id");

UPDATE "Quote" q
SET "book_edition_id" = NULL
WHERE q."book_edition_id" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "BookEdition" be WHERE be."id" = q."book_edition_id");

-- Backfill legacy rows from their authoritative Book relation.
UPDATE "Quote" q
SET
  "catalog_book_id" = COALESCE(q."catalog_book_id", b."catalog_book_id"),
  "book_edition_id" = COALESCE(q."book_edition_id", b."edition_id")
FROM "Book" b
WHERE q."book_id" = b."id"
  AND (q."catalog_book_id" IS NULL OR q."book_edition_id" IS NULL);

DO $$ BEGIN
  ALTER TABLE "Quote"
    ADD CONSTRAINT "Quote_catalog_book_id_CatalogBook_id_fk"
    FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Quote"
    ADD CONSTRAINT "Quote_book_edition_id_BookEdition_id_fk"
    FOREIGN KEY ("book_edition_id") REFERENCES "public"."BookEdition"("id")
    ON DELETE SET NULL ON UPDATE NO ACTION;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

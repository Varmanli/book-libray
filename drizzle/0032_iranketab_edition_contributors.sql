CREATE TABLE IF NOT EXISTS "BookEditionContributor" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "book_edition_id" varchar NOT NULL REFERENCES "BookEdition"("id") ON DELETE CASCADE,
  "reference_item_id" varchar NOT NULL REFERENCES "ReferenceItem"("id") ON DELETE CASCADE,
  "role" "CatalogBookContributorRole" NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "source_name" text,
  "source_url" text
);
CREATE UNIQUE INDEX IF NOT EXISTS "BookEditionContributor_unique" ON "BookEditionContributor" ("book_edition_id", "reference_item_id", "role");
CREATE INDEX IF NOT EXISTS "BookEditionContributor_edition_idx" ON "BookEditionContributor" ("book_edition_id");
CREATE INDEX IF NOT EXISTS "BookEditionContributor_reference_idx" ON "BookEditionContributor" ("reference_item_id");

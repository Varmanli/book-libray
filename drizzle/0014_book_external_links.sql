-- لینک‌های خرید/مطالعه‌ی بیرونیِ کتاب (طاقچه/فیدیبو/ایران‌کتاب/...).
-- مدل مقیاس‌پذیر: یک ردیف به‌ازای هر لینک، نه یک ستون به‌ازای هر فروشگاه.

DO $$ BEGIN
  CREATE TYPE "ExternalLinkProvider" AS ENUM (
    'taaghche','fidibo','iranketab','ketabrah','digikala','publisher','other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "ExternalLinkType" AS ENUM ('print','ebook','audiobook','unknown');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "BookExternalLink" (
  "id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "catalog_book_id" varchar NOT NULL REFERENCES "CatalogBook"("id") ON DELETE CASCADE,
  "edition_id" varchar REFERENCES "BookEdition"("id") ON DELETE SET NULL,
  "provider" "ExternalLinkProvider" NOT NULL,
  "label" text,
  "url" text NOT NULL,
  "type" "ExternalLinkType" NOT NULL DEFAULT 'unknown',
  "is_active" boolean NOT NULL DEFAULT true,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BookExternalLink_catalog_idx"
  ON "BookExternalLink" ("catalog_book_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BookExternalLink_provider_idx"
  ON "BookExternalLink" ("provider");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BookExternalLink_active_idx"
  ON "BookExternalLink" ("is_active");
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "BookExternalLink"
    ADD CONSTRAINT "BookExternalLink_catalog_provider_url_unique"
    UNIQUE ("catalog_book_id","provider","url");
EXCEPTION WHEN duplicate_object THEN null; END $$;

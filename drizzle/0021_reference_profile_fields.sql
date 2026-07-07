ALTER TABLE "ReferenceItem"
  ADD COLUMN "original_name" text,
  ADD COLUMN "short_description" text,
  ADD COLUMN "image_filename" text,
  ADD COLUMN "source_name" text,
  ADD COLUMN "source_url" text,
  ADD COLUMN "seo_title" text,
  ADD COLUMN "seo_description" text,
  ADD COLUMN "metadata" jsonb,
  ADD COLUMN "birth_year" integer,
  ADD COLUMN "death_year" integer,
  ADD COLUMN "country_name" text,
  ADD COLUMN "country_slug" text,
  ADD COLUMN "website" text;

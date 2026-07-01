ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "slug" text;
--> statement-breakpoint
ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "cover_image" text;
--> statement-breakpoint

DO $$ BEGIN
	ALTER TABLE "CatalogBook" ADD CONSTRAINT "CatalogBook_slug_unique" UNIQUE("slug");
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "CatalogBook_slug_idx" ON "CatalogBook" ("slug");

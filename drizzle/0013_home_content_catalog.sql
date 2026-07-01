-- Home content (سلایدر/پیشنهادی صفحه‌ی اصلی) را به هویت کانونی کاتالوگ متصل می‌کند.
-- ستون catalog_book_id افزوده می‌شود و book_id قدیمی nullable می‌شود تا انتخاب‌های
-- جدید به CatalogBook اشاره کنند و ردیف‌های قدیمی (book_id) همچنان کار کنند.

-- ---- HomeFeaturedBook ----
ALTER TABLE "HomeFeaturedBook"
  ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar;
--> statement-breakpoint
ALTER TABLE "HomeFeaturedBook"
  ALTER COLUMN "book_id" DROP NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "HomeFeaturedBook"
    ADD CONSTRAINT "HomeFeaturedBook_catalog_book_id_fkey"
    FOREIGN KEY ("catalog_book_id") REFERENCES "CatalogBook"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "HomeFeaturedBook"
    ADD CONSTRAINT "HomeFeaturedBook_catalog_book_id_unique" UNIQUE ("catalog_book_id");
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
-- بک‌فیل: انتخاب‌های موجود (book_id) را به کتاب کانونی‌شان نگاشت می‌کند.
UPDATE "HomeFeaturedBook" hf
SET "catalog_book_id" = b."catalog_book_id"
FROM "Book" b
WHERE hf."book_id" = b."id"
  AND b."catalog_book_id" IS NOT NULL
  AND hf."catalog_book_id" IS NULL;
--> statement-breakpoint

-- ---- HomeHeroSlideBook ----
ALTER TABLE "HomeHeroSlideBook"
  ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar;
--> statement-breakpoint
ALTER TABLE "HomeHeroSlideBook"
  ALTER COLUMN "book_id" DROP NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "HomeHeroSlideBook"
    ADD CONSTRAINT "HomeHeroSlideBook_catalog_book_id_fkey"
    FOREIGN KEY ("catalog_book_id") REFERENCES "CatalogBook"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
UPDATE "HomeHeroSlideBook" hsb
SET "catalog_book_id" = b."catalog_book_id"
FROM "Book" b
WHERE hsb."book_id" = b."id"
  AND b."catalog_book_id" IS NOT NULL
  AND hsb."catalog_book_id" IS NULL;

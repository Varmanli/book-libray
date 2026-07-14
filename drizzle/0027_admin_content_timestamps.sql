-- Add nullable columns first so this migration is safe on populated databases.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "created_at" timestamp;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "updated_at" timestamp;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "user_id" varchar;

-- PostgreSQL evaluates now() once per transaction, giving every legacy row a
-- stable and deterministic backfill value for this migration run.
UPDATE "Quote"
SET
  "created_at" = COALESCE("created_at", now()),
  "updated_at" = COALESCE("updated_at", "created_at", now())
WHERE "created_at" IS NULL OR "updated_at" IS NULL;

-- Quote ownership historically came from its personal-library Book row.
UPDATE "Quote" AS q
SET "user_id" = b."user_id"
FROM "Book" AS b
WHERE q."book_id" = b."id" AND q."user_id" IS NULL;

ALTER TABLE "Quote" ALTER COLUMN "created_at" SET DEFAULT now();
ALTER TABLE "Quote" ALTER COLUMN "updated_at" SET DEFAULT now();
ALTER TABLE "Quote" ALTER COLUMN "created_at" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "updated_at" SET NOT NULL;
ALTER TABLE "Quote" ALTER COLUMN "user_id" SET NOT NULL;
DO $$ BEGIN
  ALTER TABLE "Quote" ADD CONSTRAINT "Quote_user_id_User_id_fk"
    FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- These indexes correspond directly to admin filters and ordering paths.
CREATE INDEX IF NOT EXISTS "Quote_book_id_idx" ON "Quote" ("book_id");
CREATE INDEX IF NOT EXISTS "Quote_user_id_idx" ON "Quote" ("user_id");
CREATE INDEX IF NOT EXISTS "Quote_created_at_idx" ON "Quote" ("created_at");
CREATE INDEX IF NOT EXISTS "Quote_updated_at_idx" ON "Quote" ("updated_at");
CREATE INDEX IF NOT EXISTS "PublishedBookNote_user_id_idx" ON "PublishedBookNote" ("user_id");
CREATE INDEX IF NOT EXISTS "PublishedBookNote_book_id_idx" ON "PublishedBookNote" ("book_id");
CREATE INDEX IF NOT EXISTS "PublishedBookNote_created_at_idx" ON "PublishedBookNote" ("created_at");
CREATE INDEX IF NOT EXISTS "PublishedBookNote_updated_at_idx" ON "PublishedBookNote" ("updated_at");

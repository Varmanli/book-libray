-- Production-only reconciliation for a database whose legacy schema predates
-- its Drizzle ledger. This is additive: it never drops, rewrites, or backfills
-- application data. It is intentionally the first migration executed after
-- the legacy ledger recovery records 0000 through 0037.

DO $$ BEGIN
  CREATE TYPE "ReadingEventType" AS ENUM ('START', 'PROGRESS', 'FINISH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "PublicBookThoughtType" AS ENUM ('THOUGHT', 'QUOTE', 'REFLECTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "BookStatus" ADD VALUE IF NOT EXISTS 'PAUSED';
--> statement-breakpoint

-- Reading progress is safe to add to populated personal Book rows because the
-- non-null counter has a durable default and the timestamps remain nullable.
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "current_page" integer DEFAULT 0 NOT NULL;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "reading_updated_at" timestamp;
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" varchar(30);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profile_banner_image" text;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "PersonalBookNote" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "book_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "content" text NOT NULL,
  "page_number" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."PersonalBookNote"'::regclass AND contype='f' AND confrelid='public."Book"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "PersonalBookNote" ADD CONSTRAINT "PersonalBookNote_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "Book"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."PersonalBookNote"'::regclass AND contype='f' AND confrelid='public."User"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "PersonalBookNote" ADD CONSTRAINT "PersonalBookNote_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PersonalBookNote_book_user_idx" ON "PersonalBookNote" USING btree ("book_id", "user_id");
CREATE INDEX IF NOT EXISTS "PersonalBookNote_created_at_idx" ON "PersonalBookNote" USING btree ("created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ReadingEvent" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL,
  "book_id" varchar NOT NULL,
  "type" "ReadingEventType" NOT NULL,
  "page_from" integer,
  "page_to" integer,
  "pages_read" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."ReadingEvent"'::regclass AND contype='f' AND confrelid='public."User"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "ReadingEvent" ADD CONSTRAINT "ReadingEvent_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."ReadingEvent"'::regclass AND contype='f' AND confrelid='public."Book"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "ReadingEvent" ADD CONSTRAINT "ReadingEvent_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "Book"("id") ON DELETE CASCADE;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ReadingEvent_user_book_created_idx" ON "ReadingEvent" USING btree ("user_id", "book_id", "created_at");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "PublicBookThought" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "catalog_book_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "source_personal_note_id" varchar,
  "content" text NOT NULL,
  "page_number" integer,
  "type" "PublicBookThoughtType" DEFAULT 'THOUGHT' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."PublicBookThought"'::regclass AND contype='f' AND confrelid='public."CatalogBook"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "PublicBookThought" ADD CONSTRAINT "PublicBookThought_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "CatalogBook"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."PublicBookThought"'::regclass AND contype='f' AND confrelid='public."User"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "PublicBookThought" ADD CONSTRAINT "PublicBookThought_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."PublicBookThought"'::regclass AND contype='f' AND confrelid='public."PersonalBookNote"'::regclass AND confdeltype='n') THEN
    ALTER TABLE "PublicBookThought" ADD CONSTRAINT "PublicBookThought_source_personal_note_id_PersonalBookNote_id_fk" FOREIGN KEY ("source_personal_note_id") REFERENCES "PersonalBookNote"("id") ON DELETE SET NULL;
  END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "PublicBookThought_source_note_unique" ON "PublicBookThought" USING btree ("source_personal_note_id");
CREATE INDEX IF NOT EXISTS "PublicBookThought_book_created_idx" ON "PublicBookThought" USING btree ("catalog_book_id", "created_at");
CREATE INDEX IF NOT EXISTS "PublicBookThought_user_idx" ON "PublicBookThought" USING btree ("user_id");
--> statement-breakpoint

-- Durable legacy catalog lookup indexes that are still used by current reads.
CREATE INDEX IF NOT EXISTS "CatalogBook_title_idx" ON "CatalogBook" ("title");
CREATE INDEX IF NOT EXISTS "CatalogBook_author_idx" ON "CatalogBook" ("author");
CREATE INDEX IF NOT EXISTS "BookEdition_catalog_book_id_idx" ON "BookEdition" ("catalog_book_id");
CREATE INDEX IF NOT EXISTS "BookEdition_isbn_idx" ON "BookEdition" ("isbn");
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_lower_unique" ON "User" (lower("username"));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "QuoteLike" (
  "id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
  "quote_id" varchar NOT NULL,
  "user_id" varchar NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "QuoteLike_quote_user_unique" UNIQUE("quote_id", "user_id")
);
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."QuoteLike"'::regclass AND contype='f' AND confrelid='public."Quote"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "QuoteLike" ADD CONSTRAINT "QuoteLike_quote_id_Quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public."QuoteLike"'::regclass AND contype='f' AND confrelid='public."User"'::regclass AND confdeltype='c') THEN
    ALTER TABLE "QuoteLike" ADD CONSTRAINT "QuoteLike_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;
  END IF;
END $$;

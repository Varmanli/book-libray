ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "is_favorite" boolean DEFAULT false NOT NULL;

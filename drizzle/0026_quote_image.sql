-- Additive only: existing text excerpts, IDs, likes, and relations are unchanged.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "image_key" text;
CREATE UNIQUE INDEX IF NOT EXISTS "Quote_image_key_unique"
  ON "Quote" ("image_key");

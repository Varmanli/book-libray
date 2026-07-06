ALTER TABLE "BookEdition"
  ADD COLUMN IF NOT EXISTS "cover_filename" text;

UPDATE "BookEdition"
SET
  "cover_filename" = COALESCE(NULLIF(trim("cover_filename"), ''), NULLIF(trim("cover_image"), '')),
  "cover_image" = NULL
WHERE
  "cover_image" IS NOT NULL
  AND trim("cover_image") <> ''
  AND "cover_image" !~* '^https?://'
  AND "cover_image" NOT LIKE '/%'
  AND "cover_image" NOT LIKE 'uploads/%';

-- Phase 1 magazine metadata is additive and preserves all existing BlogPost rows.
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "canonical_url" text;
--> statement-breakpoint
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "og_image" text;
--> statement-breakpoint
INSERT INTO "BlogCategory" ("name", "slug", "description") VALUES
  ('راهنمای مطالعه', 'reading-guide', 'راهنماهایی برای انتخاب مسیر بعدی مطالعه.'),
  ('معرفی نویسندگان', 'author-guide', 'نویسندگان مهم و نقطهٔ شروع برای خواندن آثارشان.'),
  ('ژانرها و ادبیات', 'genre-and-literature', 'شناخت ژانرها، جریان‌ها و جهان ادبیات.'),
  ('پیشنهاد کتاب', 'book-recommendation', 'پیشنهادهایی برای پیدا کردن کتاب بعدی.'),
  ('معرفی و بررسی کتاب', 'book-review', 'نگاهی دقیق‌تر به کتاب‌هایی که ارزش خواندن دارند.'),
  ('فهرست‌ها و مجموعه‌های مطالعاتی', 'reading-list', 'فهرست‌های منتخب برای موقعیت‌ها و سلیقه‌های گوناگون.')
ON CONFLICT ("slug") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "updated_at" = now();

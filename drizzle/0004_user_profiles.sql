-- enum نمایانی پروفایل
DO $$ BEGIN
	CREATE TYPE "public"."ProfileVisibility" AS ENUM('PUBLIC', 'PRIVATE');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- فیلدهای پروفایل روی جدول User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" varchar(30);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" varchar(500);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "location" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "website" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instagram" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twitter" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "linkedin" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "telegram" varchar(100);--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profile_visibility" "ProfileVisibility" DEFAULT 'PRIVATE' NOT NULL;--> statement-breakpoint

-- یکتایی نام‌کاربری (حساس‌نبودن به حروف بزرگ/کوچک)
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_lower_unique" ON "User" (lower("username"));

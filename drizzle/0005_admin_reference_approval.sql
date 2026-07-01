-- enums جدید
DO $$ BEGIN
	CREATE TYPE "public"."UserRole" AS ENUM('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."ApprovalStatus" AS ENUM('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "public"."ReferenceType" AS ENUM('AUTHOR', 'GENRE', 'TRANSLATOR', 'PUBLISHER', 'COUNTRY');
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- نقش کاربر
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" "UserRole" DEFAULT 'USER' NOT NULL;--> statement-breakpoint

-- وضعیت تأیید روی کاتالوگ و نسخه‌ها (پیش‌فرض APPROVED تا داده‌ی موجود نمایان بماند)
ALTER TABLE "CatalogBook" ADD COLUMN IF NOT EXISTS "status" "ApprovalStatus" DEFAULT 'APPROVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "BookEdition" ADD COLUMN IF NOT EXISTS "status" "ApprovalStatus" DEFAULT 'APPROVED' NOT NULL;--> statement-breakpoint

-- جلد کتاب اختیاری می‌شود
ALTER TABLE "Book" ALTER COLUMN "cover_image" DROP NOT NULL;--> statement-breakpoint

-- جدول فهرست‌های مرجع
CREATE TABLE IF NOT EXISTS "ReferenceItem" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "ReferenceType" NOT NULL,
	"name" text NOT NULL,
	"status" "ApprovalStatus" DEFAULT 'PENDING' NOT NULL,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "ReferenceItem" ADD CONSTRAINT "ReferenceItem_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
-- یکتایی نوع + نام (بدون حساسیت به حروف)
CREATE UNIQUE INDEX IF NOT EXISTS "ReferenceItem_type_name_unique" ON "ReferenceItem" ("type", lower("name"));--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ReferenceItem_type_status_idx" ON "ReferenceItem" ("type", "status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CatalogBook_status_idx" ON "CatalogBook" ("status");

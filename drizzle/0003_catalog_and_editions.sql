-- کاتالوگ سراسری کتاب‌ها
CREATE TABLE IF NOT EXISTS "CatalogBook" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"original_title" text,
	"description" text,
	"author" text NOT NULL,
	"language" varchar(50),
	"genre" text,
	"country" text,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- نسخه/چاپ‌های هر کتاب کانونی
CREATE TABLE IF NOT EXISTS "BookEdition" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_book_id" varchar NOT NULL,
	"translator" text,
	"publisher" text,
	"isbn" varchar(20),
	"format" "BookFormat" DEFAULT 'PHYSICAL' NOT NULL,
	"cover_image" text,
	"published_year" integer,
	"edition_label" text,
	"page_count" integer,
	"language" varchar(50),
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- پیوندهای اختیاری از ردیف کتابخانه‌ی کاربر به کاتالوگ
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "catalog_book_id" varchar;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "edition_id" varchar;--> statement-breakpoint

-- کلیدهای خارجی (با گاردِ idempotent)
DO $$ BEGIN
	ALTER TABLE "CatalogBook" ADD CONSTRAINT "CatalogBook_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "BookEdition" ADD CONSTRAINT "BookEdition_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "BookEdition" ADD CONSTRAINT "BookEdition_created_by_id_User_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "Book" ADD CONSTRAINT "Book_catalog_book_id_CatalogBook_id_fk" FOREIGN KEY ("catalog_book_id") REFERENCES "public"."CatalogBook"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "Book" ADD CONSTRAINT "Book_edition_id_BookEdition_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."BookEdition"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint

-- ایندکس‌های جست‌وجو در کاتالوگ
CREATE INDEX IF NOT EXISTS "CatalogBook_title_idx" ON "CatalogBook" ("title");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "CatalogBook_author_idx" ON "CatalogBook" ("author");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BookEdition_catalog_book_id_idx" ON "BookEdition" ("catalog_book_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "BookEdition_isbn_idx" ON "BookEdition" ("isbn");

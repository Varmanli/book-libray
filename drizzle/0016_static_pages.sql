DO $$ BEGIN
 CREATE TYPE "StaticPageStatus" AS ENUM('DRAFT', 'PUBLISHED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "StaticPage" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"content" text DEFAULT '' NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"status" "StaticPageStatus" DEFAULT 'PUBLISHED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "StaticPage_slug_unique" UNIQUE("slug")
);

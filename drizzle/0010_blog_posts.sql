CREATE TYPE "public"."BlogPostStatus" AS ENUM('DRAFT', 'PUBLISHED');

CREATE TABLE "BlogPost" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "excerpt" text,
  "content" text NOT NULL,
  "banner_image" text NOT NULL,
  "status" "BlogPostStatus" DEFAULT 'DRAFT' NOT NULL,
  "created_by_id" varchar,
  "published_at" timestamp,
  "reading_time" integer,
  "seo_title" text,
  "seo_description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "BlogPost_slug_unique" UNIQUE("slug")
);

ALTER TABLE "BlogPost"
  ADD CONSTRAINT "BlogPost_created_by_id_User_id_fk"
  FOREIGN KEY ("created_by_id")
  REFERENCES "public"."User"("id")
  ON DELETE set null
  ON UPDATE no action;

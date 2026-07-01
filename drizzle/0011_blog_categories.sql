CREATE TABLE IF NOT EXISTS "BlogCategory" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "BlogCategory_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "BlogPost"
  ADD COLUMN IF NOT EXISTS "category_id" varchar;
--> statement-breakpoint
DO $$
BEGIN
  ALTER TABLE "BlogPost"
    ADD CONSTRAINT "BlogPost_category_id_BlogCategory_id_fk"
    FOREIGN KEY ("category_id")
    REFERENCES "public"."BlogCategory"("id")
    ON DELETE RESTRICT
    ON UPDATE NO ACTION;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

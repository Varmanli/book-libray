CREATE TYPE "PublicBookThoughtType" AS ENUM ('THOUGHT', 'QUOTE', 'REFLECTION');--> statement-breakpoint
CREATE TABLE "PublicBookThought" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "catalog_book_id" varchar NOT NULL REFERENCES "CatalogBook"("id") ON DELETE cascade,
  "user_id" varchar NOT NULL REFERENCES "User"("id") ON DELETE cascade,
  "source_personal_note_id" varchar REFERENCES "PersonalBookNote"("id") ON DELETE set null,
  "content" text NOT NULL,
  "page_number" integer,
  "type" "PublicBookThoughtType" DEFAULT 'THOUGHT' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "PublicBookThought_source_note_unique" ON "PublicBookThought" USING btree ("source_personal_note_id");--> statement-breakpoint
CREATE INDEX "PublicBookThought_book_created_idx" ON "PublicBookThought" USING btree ("catalog_book_id", "created_at");--> statement-breakpoint
CREATE INDEX "PublicBookThought_user_idx" ON "PublicBookThought" USING btree ("user_id");

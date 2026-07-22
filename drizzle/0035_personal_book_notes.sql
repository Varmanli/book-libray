CREATE TABLE IF NOT EXISTS "PersonalBookNote" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "book_id" varchar NOT NULL REFERENCES "Book"("id") ON DELETE CASCADE,
  "user_id" varchar NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "page_number" integer,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PersonalBookNote_book_user_idx" ON "PersonalBookNote" USING btree ("book_id", "user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "PersonalBookNote_created_at_idx" ON "PersonalBookNote" USING btree ("created_at");

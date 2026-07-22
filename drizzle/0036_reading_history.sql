CREATE TYPE "ReadingEventType" AS ENUM ('START', 'PROGRESS', 'FINISH');--> statement-breakpoint
CREATE TABLE "ReadingEvent" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar NOT NULL REFERENCES "User"("id") ON DELETE cascade,
  "book_id" varchar NOT NULL REFERENCES "Book"("id") ON DELETE cascade,
  "type" "ReadingEventType" NOT NULL,
  "page_from" integer,
  "page_to" integer,
  "pages_read" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "ReadingEvent_user_book_created_idx" ON "ReadingEvent" USING btree ("user_id", "book_id", "created_at");

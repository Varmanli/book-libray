ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profile_banner_image" text;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "PublishedBookNote" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	"user_id" varchar NOT NULL,
	"book_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "PublishedBookNote" ADD CONSTRAINT "PublishedBookNote_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "PublishedBookNote" ADD CONSTRAINT "PublishedBookNote_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "Book"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

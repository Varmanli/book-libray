CREATE TABLE IF NOT EXISTS "PublishedBookNoteLike" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	"note_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "PublishedBookNoteLike_note_user_unique" UNIQUE("note_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "PublishedBookNoteLike" ADD CONSTRAINT "PublishedBookNoteLike_note_id_fk" FOREIGN KEY ("note_id") REFERENCES "PublishedBookNote"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "PublishedBookNoteLike" ADD CONSTRAINT "PublishedBookNoteLike_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

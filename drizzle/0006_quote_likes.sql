CREATE TABLE IF NOT EXISTS "QuoteLike" (
	"id" varchar PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),
	"quote_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "QuoteLike_quote_user_unique" UNIQUE("quote_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "QuoteLike" ADD CONSTRAINT "QuoteLike_quote_id_Quote_id_fk" FOREIGN KEY ("quote_id") REFERENCES "Quote"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN
	ALTER TABLE "QuoteLike" ADD CONSTRAINT "QuoteLike_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null; END $$;

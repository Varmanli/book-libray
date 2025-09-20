CREATE TYPE "public"."PurchasePriority" AS ENUM('MUST_HAVE', 'WANT_IT', 'NICE_TO_HAVE', 'IF_EXTRA_MONEY', 'NOT_IMPORTANT');--> statement-breakpoint
CREATE TABLE "Wishlist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"translator" text,
	"publisher" text,
	"genre" text,
	"note" text,
	"priority" "PurchasePriority" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Wishlist" ADD CONSTRAINT "Wishlist_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
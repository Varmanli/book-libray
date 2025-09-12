CREATE TYPE "public"."BookFormat" AS ENUM('PHYSICAL', 'ELECTRONIC');--> statement-breakpoint
CREATE TYPE "public"."BookStatus" AS ENUM('UNREAD', 'READING', 'FINISHED');--> statement-breakpoint
CREATE TABLE "Account" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "Book" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"cover_image" text NOT NULL,
	"author" text NOT NULL,
	"translator" text,
	"description" text,
	"country" text,
	"genre" text NOT NULL,
	"page_count" integer,
	"format" "BookFormat" NOT NULL,
	"publisher" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar NOT NULL,
	"status" "BookStatus" DEFAULT 'UNREAD' NOT NULL,
	"progress" integer,
	"rating" integer,
	"review" text
);
--> statement-breakpoint
CREATE TABLE "Quote" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"page" integer,
	"book_id" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Session" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" varchar NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "Session_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"email" varchar(255),
	"email_verified" timestamp,
	"image" text,
	"password" text,
	CONSTRAINT "User_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "VerificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "VerificationToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "Account" ADD CONSTRAINT "Account_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Book" ADD CONSTRAINT "Book_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_book_id_Book_id_fk" FOREIGN KEY ("book_id") REFERENCES "public"."Book"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_User_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE no action;
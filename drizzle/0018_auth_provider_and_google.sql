CREATE TYPE "public"."AuthProvider" AS ENUM('password', 'google', 'otp');--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "auth_provider" "AuthProvider" DEFAULT 'password' NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "google_id" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "session_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "User" ADD CONSTRAINT "User_google_id_unique" UNIQUE("google_id");--> statement-breakpoint
UPDATE "User" SET "password_hash" = "password" WHERE "password_hash" IS NULL AND "password" IS NOT NULL;--> statement-breakpoint

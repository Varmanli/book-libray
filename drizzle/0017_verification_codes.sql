CREATE TYPE "public"."VerificationCodePurpose" AS ENUM('email_verification', 'login', 'password_reset');--> statement-breakpoint
CREATE TABLE "VerificationCode" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code_hash" text NOT NULL,
	"purpose" "VerificationCodePurpose" NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX "VerificationCode_email_purpose_idx" ON "VerificationCode" USING btree ("email","purpose");--> statement-breakpoint
CREATE INDEX "VerificationCode_expires_at_idx" ON "VerificationCode" USING btree ("expires_at");--> statement-breakpoint

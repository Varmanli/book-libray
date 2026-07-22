ALTER TYPE "BookStatus" ADD VALUE IF NOT EXISTS 'PAUSED';--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "current_page" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "reading_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "Book" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;

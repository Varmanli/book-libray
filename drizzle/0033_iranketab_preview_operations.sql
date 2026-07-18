CREATE TYPE "IranKetabPreviewOperationStatus" AS ENUM ('PROCESSING','COMPLETED','FAILED');--> statement-breakpoint
CREATE TABLE "IranKetabPreviewOperation" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "source_identity" text NOT NULL,
  "status" "IranKetabPreviewOperationStatus" DEFAULT 'PROCESSING' NOT NULL,
  "lease_expires_at" timestamp,
  "expires_at" timestamp,
  "result" jsonb,
  "error_code" text,
  "error_message" text,
  "retryable" boolean DEFAULT false NOT NULL,
  "generation" integer DEFAULT 1 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "IranKetabPreviewOperation_source_identity_unique" UNIQUE("source_identity")
);--> statement-breakpoint
CREATE INDEX "IranKetabPreviewOperation_reclaim_idx" ON "IranKetabPreviewOperation" ("status","lease_expires_at","expires_at");

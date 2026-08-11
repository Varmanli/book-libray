CREATE TYPE "IranKetabDiscoveryImportJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint

CREATE TABLE "IranKetabDiscoveryImportJob" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "discovery_item_id" varchar NOT NULL REFERENCES "IranKetabDiscoveryItem"("id") ON DELETE cascade,
  "status" "IranKetabDiscoveryImportJobStatus" DEFAULT 'PENDING' NOT NULL,
  "priority" integer DEFAULT 0 NOT NULL,
  "attempts" integer DEFAULT 0 NOT NULL,
  "max_attempts" integer DEFAULT 3 NOT NULL,
  "available_at" timestamp DEFAULT now() NOT NULL,
  "locked_at" timestamp,
  "locked_by" varchar,
  "started_at" timestamp,
  "completed_at" timestamp,
  "last_error_code" text,
  "last_error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "IranKetabDiscoveryImportJob_priority_range_check" CHECK ("priority" BETWEEN 0 AND 100),
  CONSTRAINT "IranKetabDiscoveryImportJob_attempts_nonnegative_check" CHECK ("attempts" >= 0),
  CONSTRAINT "IranKetabDiscoveryImportJob_max_attempts_positive_check" CHECK ("max_attempts" > 0)
);--> statement-breakpoint

CREATE UNIQUE INDEX "IranKetabDiscoveryImportJob_active_item_unique" ON "IranKetabDiscoveryImportJob" ("discovery_item_id") WHERE "status" IN ('PENDING', 'PROCESSING');--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryImportJob_claim_idx" ON "IranKetabDiscoveryImportJob" ("status", "available_at", "priority" DESC, "created_at");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryImportJob_item_idx" ON "IranKetabDiscoveryImportJob" ("discovery_item_id", "created_at");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryImportJob_lock_idx" ON "IranKetabDiscoveryImportJob" ("status", "locked_at");

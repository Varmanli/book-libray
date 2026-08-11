CREATE TYPE "IranKetabDiscoverySourceType" AS ENUM ('AWARD', 'CURATED_LIST', 'EDITORIAL_COLLECTION', 'AUTHOR', 'PUBLISHER', 'TAG', 'SEARCH');--> statement-breakpoint
CREATE TYPE "IranKetabDiscoveryCrawlStatus" AS ENUM ('IDLE', 'RUNNING', 'SUCCEEDED', 'FAILED', 'PAUSED');--> statement-breakpoint
CREATE TYPE "IranKetabDiscoveryImportConfidence" AS ENUM ('HIGH', 'MEDIUM', 'LOW');--> statement-breakpoint
CREATE TYPE "IranKetabDiscoveryItemStatus" AS ENUM ('DISCOVERED', 'SCORED', 'QUEUED', 'IMPORTING', 'IMPORTED', 'NEEDS_REVIEW', 'SKIPPED', 'FAILED');--> statement-breakpoint
CREATE TYPE "IranKetabDiscoveryRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');--> statement-breakpoint

CREATE TABLE "IranKetabDiscoverySource" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "source_type" "IranKetabDiscoverySourceType" NOT NULL,
  "source_url" text NOT NULL,
  "source_key" text NOT NULL,
  "importance" integer DEFAULT 50 NOT NULL,
  "enabled" boolean DEFAULT true NOT NULL,
  "crawl_status" "IranKetabDiscoveryCrawlStatus" DEFAULT 'IDLE' NOT NULL,
  "parser_version" integer DEFAULT 1 NOT NULL,
  "last_crawled_at" timestamp,
  "next_crawl_at" timestamp,
  "last_success_at" timestamp,
  "last_error_code" text,
  "last_error_message" text,
  "discovered_book_count" integer DEFAULT 0 NOT NULL,
  "new_book_count" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb,
  "created_by_id" varchar REFERENCES "User"("id") ON DELETE set null,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "IranKetabDiscoverySource_source_url_unique" UNIQUE("source_url"),
  CONSTRAINT "IranKetabDiscoverySource_source_key_unique" UNIQUE("source_key"),
  CONSTRAINT "IranKetabDiscoverySource_importance_range_check" CHECK ("importance" BETWEEN 0 AND 100),
  CONSTRAINT "IranKetabDiscoverySource_discovered_book_count_nonnegative_check" CHECK ("discovered_book_count" >= 0),
  CONSTRAINT "IranKetabDiscoverySource_new_book_count_nonnegative_check" CHECK ("new_book_count" >= 0)
);--> statement-breakpoint

CREATE TABLE "IranKetabDiscoveryItem" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "iranketab_book_id" varchar(32) NOT NULL,
  "canonical_url" text NOT NULL,
  "title_hint" text,
  "author_hint" text,
  "preferred_edition_code" text,
  "priority_score" integer DEFAULT 0 NOT NULL,
  "score_breakdown" jsonb,
  "import_confidence" "IranKetabDiscoveryImportConfidence" DEFAULT 'LOW' NOT NULL,
  "status" "IranKetabDiscoveryItemStatus" DEFAULT 'DISCOVERED' NOT NULL,
  "existing_catalog_book_id" varchar REFERENCES "CatalogBook"("id") ON DELETE set null,
  "import_session_id" varchar REFERENCES "IranKetabImportSession"("id") ON DELETE set null,
  "failure_code" text,
  "failure_reason" text,
  "retry_count" integer DEFAULT 0 NOT NULL,
  "next_retry_at" timestamp,
  "lease_expires_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "IranKetabDiscoveryItem_iranketab_book_id_unique" UNIQUE("iranketab_book_id"),
  CONSTRAINT "IranKetabDiscoveryItem_canonical_url_unique" UNIQUE("canonical_url"),
  CONSTRAINT "IranKetabDiscoveryItem_priority_score_range_check" CHECK ("priority_score" BETWEEN 0 AND 100),
  CONSTRAINT "IranKetabDiscoveryItem_retry_count_nonnegative_check" CHECK ("retry_count" >= 0)
);--> statement-breakpoint

CREATE TABLE "IranKetabDiscoveryMembership" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "discovery_item_id" varchar NOT NULL REFERENCES "IranKetabDiscoveryItem"("id") ON DELETE cascade,
  "discovery_source_id" varchar NOT NULL REFERENCES "IranKetabDiscoverySource"("id") ON DELETE cascade,
  "first_seen_at" timestamp DEFAULT now() NOT NULL,
  "last_seen_at" timestamp DEFAULT now() NOT NULL,
  "source_position" integer,
  "source_title_hint" text,
  "preferred_edition_code" text,
  "source_score_contribution" integer DEFAULT 0 NOT NULL,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "IranKetabDiscoveryMembership_item_source_unique" UNIQUE("discovery_item_id", "discovery_source_id"),
  CONSTRAINT "IranKetabDiscoveryMembership_source_position_nonnegative_check" CHECK ("source_position" IS NULL OR "source_position" >= 0)
);--> statement-breakpoint

CREATE TABLE "IranKetabDiscoveryRun" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "discovery_source_id" varchar NOT NULL REFERENCES "IranKetabDiscoverySource"("id") ON DELETE cascade,
  "status" "IranKetabDiscoveryRunStatus" NOT NULL,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  "pages_fetched" integer DEFAULT 0 NOT NULL,
  "books_found" integer DEFAULT 0 NOT NULL,
  "items_inserted" integer DEFAULT 0 NOT NULL,
  "items_updated" integer DEFAULT 0 NOT NULL,
  "error_code" text,
  "error_message" text,
  "diagnostics" jsonb,
  CONSTRAINT "IranKetabDiscoveryRun_pages_fetched_nonnegative_check" CHECK ("pages_fetched" >= 0),
  CONSTRAINT "IranKetabDiscoveryRun_books_found_nonnegative_check" CHECK ("books_found" >= 0),
  CONSTRAINT "IranKetabDiscoveryRun_items_inserted_nonnegative_check" CHECK ("items_inserted" >= 0),
  CONSTRAINT "IranKetabDiscoveryRun_items_updated_nonnegative_check" CHECK ("items_updated" >= 0)
);--> statement-breakpoint

CREATE INDEX "IranKetabDiscoverySource_crawl_ready_idx" ON "IranKetabDiscoverySource" ("enabled", "crawl_status", "next_crawl_at");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryItem_queue_idx" ON "IranKetabDiscoveryItem" ("status", "priority_score", "next_retry_at");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryItem_status_idx" ON "IranKetabDiscoveryItem" ("status");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryItem_lease_idx" ON "IranKetabDiscoveryItem" ("status", "lease_expires_at");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryMembership_source_idx" ON "IranKetabDiscoveryMembership" ("discovery_source_id", "last_seen_at");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryMembership_item_idx" ON "IranKetabDiscoveryMembership" ("discovery_item_id");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryRun_source_started_idx" ON "IranKetabDiscoveryRun" ("discovery_source_id", "started_at");--> statement-breakpoint
CREATE INDEX "IranKetabDiscoveryRun_status_idx" ON "IranKetabDiscoveryRun" ("status");

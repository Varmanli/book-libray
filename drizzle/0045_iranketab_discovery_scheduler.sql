ALTER TABLE "IranKetabDiscoverySource" ADD COLUMN "crawl_interval_minutes" integer DEFAULT 1440 NOT NULL;--> statement-breakpoint
ALTER TABLE "IranKetabDiscoverySource" ADD COLUMN "auto_queue" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "IranKetabDiscoverySource" ADD COLUMN "minimum_queue_score" integer DEFAULT 85 NOT NULL;--> statement-breakpoint
ALTER TABLE "IranKetabDiscoverySource" ADD CONSTRAINT "IranKetabDiscoverySource_crawl_interval_positive_check" CHECK ("crawl_interval_minutes" > 0);--> statement-breakpoint
ALTER TABLE "IranKetabDiscoverySource" ADD CONSTRAINT "IranKetabDiscoverySource_minimum_queue_score_range_check" CHECK ("minimum_queue_score" BETWEEN 0 AND 100);--> statement-breakpoint
UPDATE "IranKetabDiscoverySource" SET "next_crawl_at" = now() WHERE "next_crawl_at" IS NULL;

ALTER TABLE "IranKetabDiscoverySource" ADD COLUMN "crawl_lease_expires_at" timestamp;--> statement-breakpoint
CREATE INDEX "IranKetabDiscoverySource_crawl_lease_idx" ON "IranKetabDiscoverySource" ("crawl_status", "crawl_lease_expires_at");

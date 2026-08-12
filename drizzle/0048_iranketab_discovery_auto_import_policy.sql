CREATE TYPE "IranKetabDiscoveryImportMode" AS ENUM ('MANUAL_REVIEW', 'AUTO_IMPORT');
ALTER TABLE "IranKetabDiscoverySource" ADD COLUMN "import_mode" "IranKetabDiscoveryImportMode" DEFAULT 'MANUAL_REVIEW' NOT NULL;
ALTER TABLE "IranKetabDiscoveryImportJob" ADD COLUMN "discovery_source_id" varchar REFERENCES "IranKetabDiscoverySource"("id") ON DELETE SET NULL;
CREATE INDEX "IranKetabDiscoveryImportJob_source_idx" ON "IranKetabDiscoveryImportJob" ("discovery_source_id", "status");

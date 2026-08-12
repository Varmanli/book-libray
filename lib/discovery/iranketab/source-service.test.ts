import assert from "node:assert/strict";
import test from "node:test";

import { iranKetabDiscoverySourceInputSchema } from "@/lib/validations/iranketab-discovery";
import { prepareIranKetabDiscoverySourceCreateValues } from "./source-policy";

test("a newly created enabled source is immediately scheduler-eligible", () => {
  const now = new Date("2026-08-12T10:00:00.000Z");
  const input = iranKetabDiscoverySourceInputSchema.parse({
    name: "1001 books",
    sourceType: "CURATED_LIST",
    sourceUrl: "https://www.iranketab.ir/booklist/example",
    sourceKey: "1001-books",
    importance: 100,
    enabled: true,
    crawlIntervalMinutes: 1440,
    autoQueue: false,
    minimumQueueScore: 85,
    parserVersion: 1,
  });

  const values = prepareIranKetabDiscoverySourceCreateValues(input, now);
  assert.equal(values.enabled, true);
  assert.equal(values.crawlStatus, "IDLE");
  assert.equal(values.crawlLeaseExpiresAt, null);
  assert.equal(values.nextCrawlAt, now);
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  enqueueIranKetabDiscoveryItemsSchema,
  iranKetabDiscoveryCandidateActionSchema,
  iranKetabDiscoverySourceInputSchema,
  listIranKetabDiscoveryImportJobsQuerySchema,
  listIranKetabDiscoveryItemsQuerySchema,
} from "./iranketab-discovery";

test("candidate list query accepts supported review filters", () => {
  const parsed = listIranKetabDiscoveryItemsQuerySchema.parse({
    status: "SCORED",
    importConfidence: "HIGH",
    minimumPriorityScore: "75",
    sourceId: "source-1",
    q: "ماه الماس",
  });
  assert.equal(parsed.status, "SCORED");
  assert.equal(parsed.importConfidence, "HIGH");
  assert.equal(parsed.minimumPriorityScore, 75);
});

test("import queue validation accepts bounded batches and queue filters", () => {
  assert.equal(enqueueIranKetabDiscoveryItemsSchema.safeParse({ discoveryItemIds: ["a", "b"] }).success, true);
  assert.equal(enqueueIranKetabDiscoveryItemsSchema.safeParse({ discoveryItemIds: [] }).success, false);
  const parsed = listIranKetabDiscoveryImportJobsQuerySchema.parse({ status: "FAILED", minimumPriority: "80" });
  assert.equal(parsed.status, "FAILED");
  assert.equal(parsed.minimumPriority, 80);
});

test("source scheduling policy validates crawl interval and automatic queue threshold", () => {
  const source = iranKetabDiscoverySourceInputSchema.parse({
    name: "فهرست منتخب",
    sourceType: "CURATED_LIST",
    sourceUrl: "https://www.iranketab.ir/tag/test",
    sourceKey: "curated:test",
    crawlIntervalMinutes: 60,
    autoQueue: true,
    minimumQueueScore: 90,
  });
  assert.equal(source.crawlIntervalMinutes, 60);
  assert.equal(source.autoQueue, true);
  assert.equal(source.minimumQueueScore, 90);
});

test("candidate review actions are explicit and reject import execution", () => {
  assert.equal(
    iranKetabDiscoveryCandidateActionSchema.safeParse({
      action: "APPROVE_FOR_IMPORT",
    }).success,
    true,
  );
  assert.equal(
    iranKetabDiscoveryCandidateActionSchema.safeParse({
      action: "COMMIT_IMPORT",
    }).success,
    false,
  );
});

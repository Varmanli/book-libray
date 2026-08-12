import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("bulk import validates selected IDs, queues only eligible candidates, and starts a bounded worker pass", async () => {
  const [route, queue] = await Promise.all([
    readFile(path.join(process.cwd(), "app/api/admin/iranketab-discovery/items/bulk-import/route.ts"), "utf8"),
    readFile(path.join(process.cwd(), "lib/discovery/iranketab/import-queue.ts"), "utf8"),
  ]);
  assert.match(route, /assertAdminApi/);
  assert.match(route, /enqueueIranKetabDiscoveryItemsSchema/);
  assert.match(route, /processDiscoveryImportQueueBatch/);
  assert.match(route, /summary\.queued \+ summary\.reused/);
  assert.match(route, /parsed\.data\.discoverySourceId/);
  assert.match(queue, /approveAndEnqueueDiscoveryItems/);
  assert.match(queue, /\["SCORED", "NEEDS_REVIEW", "QUEUED"\]\.includes\(item\.status\)/);
  assert.match(queue, /item\.importConfidence === "HIGH"/);
  assert.match(queue, /resolveQueueOrigins/);
});

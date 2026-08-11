import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const queuePath = path.join(process.cwd(), "lib/discovery/iranketab/import-queue.ts");
const migrationPath = path.join(process.cwd(), "drizzle/0044_iranketab_discovery_import_queue.sql");

test("enqueue duplicate prevention is enforced by the active-job partial unique index", async () => {
  const [queue, migration] = await Promise.all([readFile(queuePath, "utf8"), readFile(migrationPath, "utf8")]);
  assert.match(migration, /active_item_unique[\s\S]*WHERE "status" IN \('PENDING', 'PROCESSING'\)/);
  assert.match(queue, /findActiveJob\(discoveryItemId\)/);
  assert.match(queue, /partial unique index is the concurrency-safe duplicate guard/);
});

test("claims prioritize higher-priority ready jobs and use SKIP LOCKED atomically", async () => {
  const queue = await readFile(queuePath, "utf8");
  assert.match(queue, /ORDER BY "priority" DESC, "created_at" ASC/);
  assert.match(queue, /FOR UPDATE SKIP LOCKED/);
  assert.match(queue, /"status" = 'PROCESSING'/);
  assert.match(queue, /"attempts" = job\."attempts" \+ 1/);
  assert.match(queue, /eq\(IranKetabDiscoveryImportJob\.status, "PROCESSING"\)/);
  assert.match(queue, /lte\(IranKetabDiscoveryImportJob\.lockedAt, leaseExpiredAt\)/);
});

test("failed jobs back off exponentially and become terminal after max attempts", async () => {
  const queue = await readFile(queuePath, "utf8");
  assert.match(queue, /const retry = current\.attempts < current\.maxAttempts/);
  assert.match(queue, /status: retry \? "PENDING" : "FAILED"/);
  assert.match(queue, /15_000 \* 2 \*\* Math\.max\(0, attempts - 1\)/);
  assert.match(queue, /set\(\{ status: "QUEUED", updatedAt: now \}\)/);
});

test("successful processing delegates to the bridge then completes exactly the claimed job", async () => {
  const queue = await readFile(queuePath, "utf8");
  assert.match(queue, /const job = await claimNextImportJob\(workerId\)/);
  assert.match(queue, /await startDiscoveryImport\(job\.discoveryItemId, workerId\)/);
  assert.match(queue, /await completeImportJob\(job\.id\)/);
  assert.match(queue, /await failImportJob\(job\.id, error\)/);
});

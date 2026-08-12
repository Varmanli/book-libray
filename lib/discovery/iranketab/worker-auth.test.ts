import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("the production tick is fail-closed, bounded, and uses a real admin actor", async () => {
  const [route, auth, env] = await Promise.all([
    readFile(path.join(root, "app/api/internal/iranketab-discovery/tick/route.ts"), "utf8"),
    readFile(path.join(root, "lib/discovery/iranketab/worker-auth.ts"), "utf8"),
    readFile(path.join(root, ".env.example"), "utf8"),
  ]);
  assert.match(route, /assertIranKetabDiscoveryWorkerRequest/);
  assert.match(route, /runScheduledDiscovery\(\)/);
  assert.match(route, /processDiscoveryImportQueueBatch/);
  assert.match(route, /Math\.min\(25/);
  assert.match(auth, /timingSafeEqual/);
  assert.match(auth, /IRANKETAB_DISCOVERY_WORKER_SECRET/);
  assert.match(auth, /IRANKETAB_DISCOVERY_WORKER_ACTOR_ID/);
  assert.match(auth, /isAdmin\(actor\)/);
  assert.match(env, /IRANKETAB_DISCOVERY_WORKER_SECRET/);
});

test("scheduler work is bounded so one cron invocation cannot claim every source", async () => {
  const scheduler = await readFile(path.join(root, "lib/discovery/iranketab/scheduler.ts"), "utf8");
  assert.match(scheduler, /IRANKETAB_DISCOVERY_SCHEDULER_SOURCE_BATCH_SIZE/);
  assert.match(scheduler, /\.limit\(schedulerSourceBatchSize\(\)\)/);
  assert.match(scheduler, /Math\.min\(25/);
});

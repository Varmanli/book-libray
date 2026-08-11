import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { calculateSuccessRate } from "./analytics-policy";

test("source success rate is safe for sources with no runs", () => {
  assert.equal(calculateSuccessRate(0, 0), 0);
  assert.equal(calculateSuccessRate(3, 4), 75);
});

test("analytics service exposes overview, performance, and recent activity queries", async () => {
  const source = await readFile(path.join(process.cwd(), "lib/discovery/iranketab/analytics.ts"), "utf8");
  assert.match(source, /export async function getDiscoveryOverview/);
  assert.match(source, /export async function getSourcePerformance/);
  assert.match(source, /export async function getRecentActivity/);
  assert.match(source, /IranKetabDiscoveryImportJob/);
  assert.match(source, /IranKetabDiscoveryRun/);
});

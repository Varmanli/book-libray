import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateNextCrawlAt,
  isAutoQueueEligible,
  selectDueDiscoverySources,
} from "./scheduler-policy";

const now = new Date("2026-08-11T10:00:00.000Z");

test("scheduler selects only enabled due sources and skips sources already running", () => {
  const due = selectDueDiscoverySources([
    { id: "due", enabled: true, crawlStatus: "IDLE", nextCrawlAt: new Date("2026-08-11T09:59:00.000Z"), crawlIntervalMinutes: 60, autoQueue: false, minimumQueueScore: 85 },
    { id: "future", enabled: true, crawlStatus: "IDLE", nextCrawlAt: new Date("2026-08-11T10:01:00.000Z"), crawlIntervalMinutes: 60, autoQueue: false, minimumQueueScore: 85 },
    { id: "running", enabled: true, crawlStatus: "RUNNING", crawlLeaseExpiresAt: new Date("2026-08-11T10:10:00.000Z"), nextCrawlAt: new Date("2026-08-11T09:00:00.000Z"), crawlIntervalMinutes: 60, autoQueue: false, minimumQueueScore: 85 },
    { id: "disabled", enabled: false, crawlStatus: "IDLE", nextCrawlAt: new Date("2026-08-11T09:00:00.000Z"), crawlIntervalMinutes: 60, autoQueue: false, minimumQueueScore: 85 },
  ], now);
  const recovered = selectDueDiscoverySources([
    { id: "stale-running", enabled: true, crawlStatus: "RUNNING", crawlLeaseExpiresAt: new Date("2026-08-11T09:59:00.000Z"), nextCrawlAt: new Date("2026-08-11T09:00:00.000Z"), crawlIntervalMinutes: 60, autoQueue: false, minimumQueueScore: 85 },
  ], now);
  const immediatelyRunnable = selectDueDiscoverySources([
    { id: "new-source", enabled: true, crawlStatus: "IDLE", nextCrawlAt: now, crawlIntervalMinutes: 60, autoQueue: false, minimumQueueScore: 85 },
    { id: "running-without-lease", enabled: true, crawlStatus: "RUNNING", crawlLeaseExpiresAt: null, nextCrawlAt: now, crawlIntervalMinutes: 60, autoQueue: false, minimumQueueScore: 85 },
  ], now);
  assert.deepEqual(due.map((source) => source.id), ["due"]);
  assert.deepEqual(recovered.map((source) => source.id), ["stale-running"]);
  assert.deepEqual(immediatelyRunnable.map((source) => source.id), ["new-source", "running-without-lease"]);
});

test("scheduler advances the next crawl by the configured source interval", () => {
  assert.equal(calculateNextCrawlAt(now, 90).toISOString(), "2026-08-11T11:30:00.000Z");
});

test("automatic queue preparation accepts only high-confidence scored candidates above threshold", () => {
  assert.equal(isAutoQueueEligible({ status: "SCORED", importConfidence: "HIGH", priorityScore: 85 }, 85), true);
  assert.equal(isAutoQueueEligible({ status: "SCORED", importConfidence: "MEDIUM", priorityScore: 99 }, 85), false);
  assert.equal(isAutoQueueEligible({ status: "QUEUED", importConfidence: "HIGH", priorityScore: 99 }, 85), false);
  assert.equal(isAutoQueueEligible({ status: "SCORED", importConfidence: "HIGH", priorityScore: 84 }, 85), false);
});

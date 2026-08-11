import { and, desc, eq, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";

import { db } from "@/db";
import { IranKetabDiscoveryItem, IranKetabDiscoveryMembership, IranKetabDiscoverySource } from "@/db/schema";
import { enqueueManyDiscoveryItems } from "./import-queue";
import { runDiscoverySource } from "./discovery-service";
import {
  calculateNextCrawlAt,
  isAutoQueueEligible,
  selectDueDiscoverySources,
} from "./scheduler-policy";

const DISCOVERY_SOURCE_LEASE_MS = 30 * 60_000;

export { calculateNextCrawlAt, isAutoQueueEligible, selectDueDiscoverySources } from "./scheduler-policy";

/**
 * Performs one bounded scheduling pass. A cron invocation can call this
 * function; it intentionally does not start an import worker or commit books.
 */
export async function runScheduledDiscovery() {
  const now = new Date();
  const candidates = await db
    .select({
      id: IranKetabDiscoverySource.id,
      enabled: IranKetabDiscoverySource.enabled,
      crawlStatus: IranKetabDiscoverySource.crawlStatus,
      crawlLeaseExpiresAt: IranKetabDiscoverySource.crawlLeaseExpiresAt,
      nextCrawlAt: IranKetabDiscoverySource.nextCrawlAt,
      crawlIntervalMinutes: IranKetabDiscoverySource.crawlIntervalMinutes,
      autoQueue: IranKetabDiscoverySource.autoQueue,
      minimumQueueScore: IranKetabDiscoverySource.minimumQueueScore,
    })
    .from(IranKetabDiscoverySource)
    .where(
      and(
        eq(IranKetabDiscoverySource.enabled, true),
        or(
          ne(IranKetabDiscoverySource.crawlStatus, "RUNNING"),
          isNull(IranKetabDiscoverySource.crawlLeaseExpiresAt),
          lte(IranKetabDiscoverySource.crawlLeaseExpiresAt, now),
        ),
        lte(IranKetabDiscoverySource.nextCrawlAt, now),
      ),
    )
    .orderBy(IranKetabDiscoverySource.nextCrawlAt)
    .limit(100);

  const dueSources = selectDueDiscoverySources(candidates, now);
  const results = [];
  for (const source of dueSources) {
    const [claimed] = await db
      .update(IranKetabDiscoverySource)
      .set({
        crawlStatus: "RUNNING",
        crawlLeaseExpiresAt: new Date(now.getTime() + DISCOVERY_SOURCE_LEASE_MS),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(IranKetabDiscoverySource.id, source.id),
          eq(IranKetabDiscoverySource.enabled, true),
          or(
            ne(IranKetabDiscoverySource.crawlStatus, "RUNNING"),
            isNull(IranKetabDiscoverySource.crawlLeaseExpiresAt),
            lte(IranKetabDiscoverySource.crawlLeaseExpiresAt, now),
          ),
          lte(IranKetabDiscoverySource.nextCrawlAt, now),
        ),
      )
      .returning({ id: IranKetabDiscoverySource.id });
    if (!claimed) continue;

    try {
      const run = await runDiscoverySource(source.id);
      const queueResults = source.autoQueue
        ? await enqueueEligibleSourceItems(source.id, source.minimumQueueScore)
        : [];
      await scheduleSource(source.id, source.crawlIntervalMinutes, now);
      results.push({ sourceId: source.id, status: "SUCCEEDED" as const, run, queueResults });
    } catch (error) {
      // The runner has already recorded its run/source failure. Advance the
      // schedule so a bad source does not create a tight scheduler loop.
      const errorCode = error instanceof Error && "code" in error && typeof error.code === "string" ? error.code : "DISCOVERY_RUN_FAILED";
      const errorMessage = error instanceof Error ? error.message : "اجرای کشف منبع ناموفق بود.";
      await db
        .update(IranKetabDiscoverySource)
        .set({ crawlStatus: "FAILED", crawlLeaseExpiresAt: null, lastErrorCode: errorCode, lastErrorMessage: errorMessage, updatedAt: new Date() })
        .where(and(eq(IranKetabDiscoverySource.id, source.id), eq(IranKetabDiscoverySource.crawlStatus, "RUNNING")));
      await scheduleSource(source.id, source.crawlIntervalMinutes, now);
      results.push({
        sourceId: source.id,
        status: "FAILED" as const,
        errorCode,
        errorMessage,
      });
    }
  }
  return { ranAt: now, dueCount: dueSources.length, results };
}

async function scheduleSource(sourceId: string, crawlIntervalMinutes: number, now: Date) {
  await db
    .update(IranKetabDiscoverySource)
    .set({ nextCrawlAt: calculateNextCrawlAt(now, crawlIntervalMinutes), updatedAt: new Date() })
    .where(eq(IranKetabDiscoverySource.id, sourceId));
}

async function enqueueEligibleSourceItems(sourceId: string, minimumQueueScore: number) {
  const items = await db
    .select({ id: IranKetabDiscoveryItem.id, status: IranKetabDiscoveryItem.status, priorityScore: IranKetabDiscoveryItem.priorityScore, importConfidence: IranKetabDiscoveryItem.importConfidence })
    .from(IranKetabDiscoveryItem)
    .innerJoin(IranKetabDiscoveryMembership, eq(IranKetabDiscoveryMembership.discoveryItemId, IranKetabDiscoveryItem.id))
    .where(and(eq(IranKetabDiscoveryMembership.discoverySourceId, sourceId), eq(IranKetabDiscoveryItem.status, "SCORED"), eq(IranKetabDiscoveryItem.importConfidence, "HIGH"), gte(IranKetabDiscoveryItem.priorityScore, minimumQueueScore)))
    .orderBy(desc(IranKetabDiscoveryItem.priorityScore));
  const eligible = items.filter((item) => isAutoQueueEligible(item, minimumQueueScore));
  if (!eligible.length) return [];
  await db
    .update(IranKetabDiscoveryItem)
    .set({ status: "QUEUED", updatedAt: new Date() })
    .where(inArray(IranKetabDiscoveryItem.id, eligible.map((item) => item.id)));
  return enqueueManyDiscoveryItems(eligible.map((item) => item.id));
}

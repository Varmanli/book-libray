import { desc, eq, gte, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  IranKetabDiscoveryImportJob,
  IranKetabDiscoveryItem,
  IranKetabDiscoveryMembership,
  IranKetabDiscoveryRun,
  IranKetabDiscoverySource,
} from "@/db/schema";
import { calculateSuccessRate } from "./analytics-policy";

export async function getDiscoveryOverview() {
  const recentSince = new Date(Date.now() - 24 * 60 * 60_000);
  const [enabled, recentSources, candidates, average, queuedJobs, failedJobs, statusRows, confidenceRows] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(IranKetabDiscoverySource).where(eq(IranKetabDiscoverySource.enabled, true)),
    db.select({ total: sql<number>`count(*)::int` }).from(IranKetabDiscoverySource).where(gte(IranKetabDiscoverySource.lastCrawledAt, recentSince)),
    db.select({ total: sql<number>`count(*)::int` }).from(IranKetabDiscoveryItem),
    db.select({ value: sql<number>`coalesce(round(avg(${IranKetabDiscoveryItem.priorityScore})::numeric, 1), 0)::float` }).from(IranKetabDiscoveryItem),
    db.select({ total: sql<number>`count(*)::int` }).from(IranKetabDiscoveryImportJob).where(inArray(IranKetabDiscoveryImportJob.status, ["PENDING", "PROCESSING"])),
    db.select({ total: sql<number>`count(*)::int` }).from(IranKetabDiscoveryImportJob).where(eq(IranKetabDiscoveryImportJob.status, "FAILED")),
    db.select({ status: IranKetabDiscoveryItem.status, total: sql<number>`count(*)::int` }).from(IranKetabDiscoveryItem).groupBy(IranKetabDiscoveryItem.status),
    db.select({ confidence: IranKetabDiscoveryItem.importConfidence, total: sql<number>`count(*)::int` }).from(IranKetabDiscoveryItem).groupBy(IranKetabDiscoveryItem.importConfidence),
  ]);
  return {
    enabledSources: enabled[0]?.total ?? 0,
    sourcesExecutedRecently: recentSources[0]?.total ?? 0,
    totalCandidates: candidates[0]?.total ?? 0,
    averagePriorityScore: average[0]?.value ?? 0,
    queuedImportJobs: queuedJobs[0]?.total ?? 0,
    failedImportJobs: failedJobs[0]?.total ?? 0,
    candidatesByStatus: Object.fromEntries(statusRows.map((row) => [row.status, row.total])),
    candidatesByConfidence: Object.fromEntries(confidenceRows.map((row) => [row.confidence, row.total])),
  };
}

export async function getSourcePerformance() {
  const [sources, runRows, queueRows] = await Promise.all([
    db.select({ id: IranKetabDiscoverySource.id, name: IranKetabDiscoverySource.name, lastCrawledAt: IranKetabDiscoverySource.lastCrawledAt, discoveredBookCount: IranKetabDiscoverySource.discoveredBookCount, crawlStatus: IranKetabDiscoverySource.crawlStatus })
      .from(IranKetabDiscoverySource)
      .orderBy(desc(IranKetabDiscoverySource.lastCrawledAt), IranKetabDiscoverySource.name),
    db.select({ sourceId: IranKetabDiscoveryRun.discoverySourceId, total: sql<number>`count(*)::int`, succeeded: sql<number>`count(*) filter (where ${IranKetabDiscoveryRun.status} = 'SUCCESS')::int`, failures: sql<number>`count(*) filter (where ${IranKetabDiscoveryRun.status} = 'FAILED')::int` })
      .from(IranKetabDiscoveryRun)
      .groupBy(IranKetabDiscoveryRun.discoverySourceId),
    db.select({ sourceId: IranKetabDiscoveryMembership.discoverySourceId, total: sql<number>`count(distinct ${IranKetabDiscoveryImportJob.discoveryItemId})::int` })
      .from(IranKetabDiscoveryMembership)
      .innerJoin(IranKetabDiscoveryImportJob, eq(IranKetabDiscoveryImportJob.discoveryItemId, IranKetabDiscoveryMembership.discoveryItemId))
      .where(inArray(IranKetabDiscoveryImportJob.status, ["PENDING", "PROCESSING", "COMPLETED"]))
      .groupBy(IranKetabDiscoveryMembership.discoverySourceId),
  ]);
  const runsBySource = new Map(runRows.map((row) => [row.sourceId, row]));
  const queuedBySource = new Map(queueRows.map((row) => [row.sourceId, row.total]));
  return sources.map((source) => {
    const runs = runsBySource.get(source.id) ?? { total: 0, succeeded: 0, failures: 0 };
    return { ...source, booksQueued: queuedBySource.get(source.id) ?? 0, failures: runs.failures, totalRuns: runs.total, successRate: calculateSuccessRate(runs.succeeded, runs.total) };
  });
}

export async function getRecentActivity() {
  const [runs, books, failedImports] = await Promise.all([
    db.select({ id: IranKetabDiscoveryRun.id, status: IranKetabDiscoveryRun.status, startedAt: IranKetabDiscoveryRun.startedAt, completedAt: IranKetabDiscoveryRun.completedAt, booksFound: IranKetabDiscoveryRun.booksFound, errorMessage: IranKetabDiscoveryRun.errorMessage, sourceId: IranKetabDiscoverySource.id, sourceName: IranKetabDiscoverySource.name })
      .from(IranKetabDiscoveryRun)
      .innerJoin(IranKetabDiscoverySource, eq(IranKetabDiscoveryRun.discoverySourceId, IranKetabDiscoverySource.id))
      .orderBy(desc(IranKetabDiscoveryRun.startedAt)).limit(10),
    db.select({ id: IranKetabDiscoveryItem.id, titleHint: IranKetabDiscoveryItem.titleHint, authorHint: IranKetabDiscoveryItem.authorHint, priorityScore: IranKetabDiscoveryItem.priorityScore, importConfidence: IranKetabDiscoveryItem.importConfidence, status: IranKetabDiscoveryItem.status, createdAt: IranKetabDiscoveryItem.createdAt })
      .from(IranKetabDiscoveryItem)
      .orderBy(desc(IranKetabDiscoveryItem.createdAt)).limit(10),
    db.select({ id: IranKetabDiscoveryImportJob.id, discoveryItemId: IranKetabDiscoveryImportJob.discoveryItemId, lastErrorCode: IranKetabDiscoveryImportJob.lastErrorCode, lastErrorMessage: IranKetabDiscoveryImportJob.lastErrorMessage, completedAt: IranKetabDiscoveryImportJob.completedAt, titleHint: IranKetabDiscoveryItem.titleHint })
      .from(IranKetabDiscoveryImportJob)
      .innerJoin(IranKetabDiscoveryItem, eq(IranKetabDiscoveryImportJob.discoveryItemId, IranKetabDiscoveryItem.id))
      .where(eq(IranKetabDiscoveryImportJob.status, "FAILED"))
      .orderBy(desc(IranKetabDiscoveryImportJob.completedAt)).limit(10),
  ]);
  return { latestRuns: runs, latestDiscoveredBooks: books, latestFailedImports: failedImports };
}

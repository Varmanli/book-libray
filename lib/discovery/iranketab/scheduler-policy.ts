export type ScheduledDiscoverySource = {
  id: string;
  enabled: boolean;
  crawlStatus: "IDLE" | "RUNNING" | "SUCCEEDED" | "FAILED" | "PAUSED";
  crawlLeaseExpiresAt?: Date | null;
  nextCrawlAt: Date | null;
  crawlIntervalMinutes: number;
  autoQueue: boolean;
  minimumQueueScore: number;
};

export function selectDueDiscoverySources(sources: ScheduledDiscoverySource[], now = new Date()) {
  return sources.filter((source) =>
    source.enabled &&
    (source.crawlStatus !== "RUNNING" || source.crawlLeaseExpiresAt === null || source.crawlLeaseExpiresAt === undefined || source.crawlLeaseExpiresAt <= now) &&
    source.nextCrawlAt !== null &&
    source.nextCrawlAt <= now,
  );
}

export function calculateNextCrawlAt(now: Date, crawlIntervalMinutes: number) {
  return new Date(now.getTime() + crawlIntervalMinutes * 60_000);
}

export function isAutoQueueEligible(item: { status: string; priorityScore: number; importConfidence: string }, minimumQueueScore: number) {
  return item.status === "SCORED" && item.importConfidence === "HIGH" && item.priorityScore >= minimumQueueScore;
}

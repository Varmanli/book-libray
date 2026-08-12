import type { IranKetabDiscoverySourceInput } from "@/lib/validations/iranketab-discovery";

export function canonicalIranKetabDiscoverySourceUrl(value: string) {
  const url = new URL(value.trim());
  url.hostname = url.hostname.toLowerCase();
  url.hash = "";
  return url.toString();
}

/** Defaults that make a new enabled source immediately runnable by the scheduler. */
export function prepareIranKetabDiscoverySourceCreateValues(
  input: IranKetabDiscoverySourceInput,
  now = new Date(),
) {
  return {
    name: input.name.trim(),
    sourceType: input.sourceType,
    sourceUrl: canonicalIranKetabDiscoverySourceUrl(input.sourceUrl),
    sourceKey: input.sourceKey.trim().toLowerCase(),
    importance: input.importance,
    enabled: input.enabled,
    crawlIntervalMinutes: input.crawlIntervalMinutes,
    autoQueue: input.autoQueue,
    importMode: input.importMode,
    minimumQueueScore: input.minimumQueueScore,
    parserVersion: input.parserVersion,
    crawlStatus: "IDLE" as const,
    crawlLeaseExpiresAt: null,
    nextCrawlAt: input.nextCrawlAt ?? now,
    metadata: input.metadata ?? null,
  };
}

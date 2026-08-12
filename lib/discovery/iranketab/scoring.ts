import type { IranKetabDiscoverySourceType } from "./collection-fetch";

export type DiscoveryScoreBreakdown = {
  sourceScore: number;
  multiSourceBonus: number;
  positionBonus: number;
  reasons: string[];
};

export type DiscoveryScoreResult = {
  priorityScore: number;
  breakdown: DiscoveryScoreBreakdown;
  importConfidence: "HIGH" | "MEDIUM" | "LOW";
};

export type DiscoveryItemForScoring = {
  id: string;
  canonicalUrl: string;
  status:
    | "DISCOVERED"
    | "SCORED"
    | "QUEUED"
    | "IMPORTING"
    | "IMPORTED"
    | "NEEDS_REVIEW"
    | "APPROVED"
    | "SKIPPED"
    | "FAILED";
  memberships: Array<{
    sourceId: string;
    sourceName: string;
    sourceType: IranKetabDiscoverySourceType;
    sourceImportance: number;
    sourcePosition: number | null;
  }>;
};

export class IranKetabDiscoveryScoringError extends Error {
  constructor(public readonly code: "DISCOVERY_ITEM_NOT_FOUND") {
    super(code);
  }
}

const SOURCE_TYPE_BONUS: Record<IranKetabDiscoverySourceType, number> = {
  AWARD: 12,
  CURATED_LIST: 10,
  EDITORIAL_COLLECTION: 8,
  AUTHOR: 6,
  PUBLISHER: 5,
  TAG: 4,
  SEARCH: 0,
};

/**
 * Scores only source provenance already present in Discovery tables. It does
 * not infer ratings, awards, reviews, or importer match outcomes.
 */
export function calculateItemScore(
  item: DiscoveryItemForScoring,
): DiscoveryScoreResult {
  const memberships = uniqueMemberships(item.memberships);
  const reasons: string[] = [];
  const strongest = memberships.reduce<
    DiscoveryItemForScoring["memberships"][number] | null
  >((best, membership) => {
    if (!best) return membership;
    return sourceValue(membership) > sourceValue(best) ? membership : best;
  }, null);

  const sourceScore = strongest ? Math.min(70, sourceValue(strongest)) : 0;
  if (strongest) {
    reasons.push(
      `منبع «${strongest.sourceName}» با اهمیت ${strongest.sourceImportance} و نوع ${strongest.sourceType} مبنای امتیاز است.`,
    );
  } else {
    reasons.push("هیچ منبع فعالی برای امتیازدهی این کتاب ثبت نشده است.");
  }

  const multiSourceBonus = Math.min(15, Math.max(0, memberships.length - 1) * 5);
  if (multiSourceBonus)
    reasons.push(`کتاب در ${memberships.length} منبع مستقل دیده شده است.`);

  const bestPosition = memberships.reduce<number | null>((best, membership) => {
    if (membership.sourcePosition === null) return best;
    return best === null ? membership.sourcePosition : Math.min(best, membership.sourcePosition);
  }, null);
  const positionBonus = scorePosition(bestPosition);
  if (positionBonus)
    reasons.push(`رتبه ${bestPosition} در یک منبع منتخب، امتیاز جایگاه را افزایش داد.`);

  const priorityScore = Math.max(
    0,
    Math.min(100, sourceScore + multiSourceBonus + positionBonus),
  );
  const importConfidence = calculateImportConfidence({
    canonicalUrl: item.canonicalUrl,
    status: item.status,
    strongestImportance: strongest?.sourceImportance ?? 0,
    priorityScore,
  });
  reasons.push(confidenceReason(importConfidence, item.status));

  return {
    priorityScore,
    breakdown: { sourceScore, multiSourceBonus, positionBonus, reasons },
    importConfidence,
  };
}

/** Calculates and persists the score for one discovery item. */
export async function calculateDiscoveryScore(
  discoveryItemId: string,
): Promise<DiscoveryScoreResult> {
  // Dynamic imports keep calculateItemScore usable in no-database unit tests.
  const [{ db }, schema, orm] = await Promise.all([
    import("@/db"),
    import("@/db/schema"),
    import("drizzle-orm"),
  ]);
  const {
    IranKetabDiscoveryItem,
    IranKetabDiscoveryMembership,
    IranKetabDiscoverySource,
  } = schema;
  const { eq } = orm;
  const [item] = await db
    .select({
      id: IranKetabDiscoveryItem.id,
      canonicalUrl: IranKetabDiscoveryItem.canonicalUrl,
      status: IranKetabDiscoveryItem.status,
    })
    .from(IranKetabDiscoveryItem)
    .where(eq(IranKetabDiscoveryItem.id, discoveryItemId))
    .limit(1);
  if (!item) throw new IranKetabDiscoveryScoringError("DISCOVERY_ITEM_NOT_FOUND");

  const memberships = await db
    .select({
      sourceId: IranKetabDiscoveryMembership.discoverySourceId,
      sourceName: IranKetabDiscoverySource.name,
      sourceType: IranKetabDiscoverySource.sourceType,
      sourceImportance: IranKetabDiscoverySource.importance,
      sourcePosition: IranKetabDiscoveryMembership.sourcePosition,
    })
    .from(IranKetabDiscoveryMembership)
    .innerJoin(
      IranKetabDiscoverySource,
      eq(
        IranKetabDiscoveryMembership.discoverySourceId,
        IranKetabDiscoverySource.id,
      ),
    )
    .where(eq(IranKetabDiscoveryMembership.discoveryItemId, discoveryItemId));

  const score = calculateItemScore({ ...item, memberships });
  await db
    .update(IranKetabDiscoveryItem)
    .set({
      priorityScore: score.priorityScore,
      scoreBreakdown: score.breakdown,
      importConfidence: score.importConfidence,
      status: item.status === "DISCOVERED" ? "SCORED" : item.status,
      updatedAt: new Date(),
    })
    .where(eq(IranKetabDiscoveryItem.id, discoveryItemId));
  return score;
}

function sourceValue(
  membership: DiscoveryItemForScoring["memberships"][number],
) {
  return Math.round(membership.sourceImportance * 0.6) + SOURCE_TYPE_BONUS[membership.sourceType];
}

function scorePosition(position: number | null) {
  if (position === null || position < 1) return 0;
  if (position <= 10) return 15;
  if (position <= 25) return 10;
  if (position <= 100) return 5;
  return 2;
}

function uniqueMemberships(
  memberships: DiscoveryItemForScoring["memberships"],
) {
  return [...new Map(memberships.map((membership) => [membership.sourceId, membership])).values()];
}

function calculateImportConfidence(input: {
  canonicalUrl: string;
  status: DiscoveryItemForScoring["status"];
  strongestImportance: number;
  priorityScore: number;
}): "HIGH" | "MEDIUM" | "LOW" {
  const hasKnownConflict = input.status === "NEEDS_REVIEW";
  const terminalFailure = input.status === "FAILED" || input.status === "SKIPPED";
  if (
    !isCanonicalIranKetabBookUrl(input.canonicalUrl) ||
    hasKnownConflict ||
    terminalFailure ||
    input.strongestImportance < 40
  )
    return "LOW";
  if (input.strongestImportance >= 80 && input.priorityScore >= 75)
    return "HIGH";
  return "MEDIUM";
}

function isCanonicalIranKetabBookUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["iranketab.ir", "www.iranketab.ir"].includes(
        url.hostname.toLowerCase(),
      ) &&
      /^\/book\/\d+(?:-[^/]+)?\/?$/u.test(url.pathname) &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function confidenceReason(
  confidence: "HIGH" | "MEDIUM" | "LOW",
  status: DiscoveryItemForScoring["status"],
) {
  if (confidence === "HIGH")
    return "منبع بسیار مهم و URL کانونی معتبر است؛ تعارض شناخته‌شده‌ای در وضعیت کشف وجود ندارد.";
  if (confidence === "MEDIUM")
    return "منبع و URL معتبرند، اما بررسی تطبیق در مرحله ورود هنوز لازم است.";
  if (status === "NEEDS_REVIEW")
    return "کتاب در وضعیت نیازمند بررسی است و برای ورود خودکار مناسب نیست.";
  return "شواهد منبع یا ساختار URL برای ورود با اطمینان بالا کافی نیست.";
}

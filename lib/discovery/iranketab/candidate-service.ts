import { and, count, desc, eq, ilike, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import {
  CatalogBook,
  IranKetabDiscoveryItem,
  IranKetabDiscoveryMembership,
  IranKetabDiscoverySource,
} from "@/db/schema";
import { getImportSession } from "@/lib/importers/iranketab/session";

export const IRANKETAB_DISCOVERY_ITEM_PAGE_SIZE = 25;

export class IranKetabDiscoveryCandidateError extends Error {
  constructor(public readonly code: "DISCOVERY_ITEM_NOT_FOUND" | "DISCOVERY_PREVIEW_REQUIRED" | "DISCOVERY_INVALID_TRANSITION" | "DISCOVERY_IMPORT_NOT_APPROVED") {
    super(code);
  }
}

export type IranKetabDiscoveryCandidateAction =
  | "IGNORE"
  | "NEEDS_REVIEW"
  | "APPROVE_FOR_IMPORT";

const itemSelection = {
  id: IranKetabDiscoveryItem.id,
  iranKetabBookId: IranKetabDiscoveryItem.iranKetabBookId,
  canonicalUrl: IranKetabDiscoveryItem.canonicalUrl,
  titleHint: IranKetabDiscoveryItem.titleHint,
  authorHint: IranKetabDiscoveryItem.authorHint,
  preferredEditionCode: IranKetabDiscoveryItem.preferredEditionCode,
  priorityScore: IranKetabDiscoveryItem.priorityScore,
  scoreBreakdown: IranKetabDiscoveryItem.scoreBreakdown,
  importConfidence: IranKetabDiscoveryItem.importConfidence,
  status: IranKetabDiscoveryItem.status,
  existingCatalogBookId: IranKetabDiscoveryItem.existingCatalogBookId,
  importSessionId: IranKetabDiscoveryItem.importSessionId,
  failureCode: IranKetabDiscoveryItem.failureCode,
  failureReason: IranKetabDiscoveryItem.failureReason,
  retryCount: IranKetabDiscoveryItem.retryCount,
  nextRetryAt: IranKetabDiscoveryItem.nextRetryAt,
  leaseExpiresAt: IranKetabDiscoveryItem.leaseExpiresAt,
  createdAt: IranKetabDiscoveryItem.createdAt,
  updatedAt: IranKetabDiscoveryItem.updatedAt,
  existingCatalogTitle: CatalogBook.title,
  existingCatalogSlug: CatalogBook.slug,
};

type DiscoveryMembershipDto = {
  id: string;
  discoveryItemId: string;
  discoverySourceId: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  sourcePosition: number | null;
  sourceTitleHint: string | null;
  preferredEditionCode: string | null;
  sourceScoreContribution: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  sourceName: string;
  sourceType: (typeof IranKetabDiscoverySource.$inferSelect)["sourceType"];
  sourceUrl: string;
  sourceImportance: number;
  sourceEnabled: boolean;
};

type DiscoveryCandidateRow = {
  id: string;
  iranKetabBookId: string;
  canonicalUrl: string;
  titleHint: string | null;
  authorHint: string | null;
  preferredEditionCode: string | null;
  priorityScore: number;
  scoreBreakdown: Record<string, unknown> | null;
  importConfidence: (typeof IranKetabDiscoveryItem.$inferSelect)["importConfidence"];
  status: (typeof IranKetabDiscoveryItem.$inferSelect)["status"];
  existingCatalogBookId: string | null;
  importSessionId: string | null;
  failureCode: string | null;
  failureReason: string | null;
  retryCount: number;
  nextRetryAt: Date | null;
  leaseExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  existingCatalogTitle: string | null;
  existingCatalogSlug: string | null;
};

export async function listIranKetabDiscoveryCandidates(input: {
  q?: string;
  status?: (typeof IranKetabDiscoveryItem.$inferSelect)["status"];
  importConfidence?: (typeof IranKetabDiscoveryItem.$inferSelect)["importConfidence"];
  minimumPriorityScore?: number;
  sourceId?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = Math.max(
    1,
    Math.min(100, Math.trunc(input.pageSize ?? IRANKETAB_DISCOVERY_ITEM_PAGE_SIZE)),
  );
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const conditions = candidateConditions(input);
  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, totals] = await Promise.all([
    db
      .select(itemSelection)
      .from(IranKetabDiscoveryItem)
      .leftJoin(
        CatalogBook,
        eq(IranKetabDiscoveryItem.existingCatalogBookId, CatalogBook.id),
      )
      .where(where)
      .orderBy(
        desc(IranKetabDiscoveryItem.priorityScore),
        desc(IranKetabDiscoveryItem.updatedAt),
      )
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ total: count() })
      .from(IranKetabDiscoveryItem)
      .where(where),
  ]);

  const membershipsByItem = await loadMembershipsByItem(rows.map((row) => row.id));
  const items = rows.map((row) => toCandidateDto(row, membershipsByItem.get(row.id) ?? []));
  const total = totals[0]?.total ?? 0;
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getIranKetabDiscoveryCandidate(id: string) {
  const [row] = await db
    .select(itemSelection)
    .from(IranKetabDiscoveryItem)
    .leftJoin(
      CatalogBook,
      eq(IranKetabDiscoveryItem.existingCatalogBookId, CatalogBook.id),
    )
    .where(eq(IranKetabDiscoveryItem.id, id))
    .limit(1);
  if (!row) return null;
  const membershipsByItem = await loadMembershipsByItem([id]);
  return toCandidateDto(row, membershipsByItem.get(id) ?? []);
}

export async function reviewIranKetabDiscoveryCandidate(
  id: string,
  action: IranKetabDiscoveryCandidateAction,
) {
  if (action === "APPROVE_FOR_IMPORT") return approveDiscoveryCandidate(id);
  const [current] = await db
    .select({ status: IranKetabDiscoveryItem.status })
    .from(IranKetabDiscoveryItem)
    .where(eq(IranKetabDiscoveryItem.id, id))
    .limit(1);
  if (!current) throw new IranKetabDiscoveryCandidateError("DISCOVERY_ITEM_NOT_FOUND");
  const allowed = action === "IGNORE"
    ? ["DISCOVERED", "SCORED", "NEEDS_REVIEW", "APPROVED", "FAILED"]
    : ["SCORED", "NEEDS_REVIEW", "APPROVED"];
  if (!allowed.includes(current.status))
    throw new IranKetabDiscoveryCandidateError("DISCOVERY_INVALID_TRANSITION");
  const now = new Date();
  const patch =
    action === "IGNORE"
      ? { status: "SKIPPED" as const, nextRetryAt: null, leaseExpiresAt: null }
      : action === "NEEDS_REVIEW"
        ? { status: "NEEDS_REVIEW" as const, leaseExpiresAt: null }
        : { status: "NEEDS_REVIEW" as const, leaseExpiresAt: null };
  const [updated] = await db
    .update(IranKetabDiscoveryItem)
    .set({ ...patch, updatedAt: now })
    .where(eq(IranKetabDiscoveryItem.id, id))
    .returning({ id: IranKetabDiscoveryItem.id });
  if (!updated) throw new IranKetabDiscoveryCandidateError("DISCOVERY_INVALID_TRANSITION");
  return getIranKetabDiscoveryCandidate(id);
}

/** Approval is deliberately separate from queueing: it authorizes commit of an existing preview. */
export async function approveDiscoveryCandidate(id: string) {
  const [item] = await db
    .select({ id: IranKetabDiscoveryItem.id, status: IranKetabDiscoveryItem.status, importSessionId: IranKetabDiscoveryItem.importSessionId })
    .from(IranKetabDiscoveryItem)
    .where(eq(IranKetabDiscoveryItem.id, id))
    .limit(1);
  if (!item) throw new IranKetabDiscoveryCandidateError("DISCOVERY_ITEM_NOT_FOUND");
  if (item.status !== "NEEDS_REVIEW") throw new IranKetabDiscoveryCandidateError("DISCOVERY_INVALID_TRANSITION");
  if (!item.importSessionId) throw new IranKetabDiscoveryCandidateError("DISCOVERY_PREVIEW_REQUIRED");
  const session = await getImportSession(item.importSessionId);
  if (!session || session.session.status !== "PREVIEW_READY")
    throw new IranKetabDiscoveryCandidateError("DISCOVERY_PREVIEW_REQUIRED");
  const [updated] = await db
    .update(IranKetabDiscoveryItem)
    .set({ status: "APPROVED", failureCode: null, failureReason: null, updatedAt: new Date() })
    .where(and(eq(IranKetabDiscoveryItem.id, id), eq(IranKetabDiscoveryItem.status, "NEEDS_REVIEW")))
    .returning({ id: IranKetabDiscoveryItem.id });
  if (!updated) throw new IranKetabDiscoveryCandidateError("DISCOVERY_INVALID_TRANSITION");
  return getIranKetabDiscoveryCandidate(id);
}

/** Called by the existing importer commit endpoint, never by the queue worker. */
export async function beginApprovedDiscoveryCommit(sessionId: string) {
  const [item] = await db
    .select({ id: IranKetabDiscoveryItem.id, status: IranKetabDiscoveryItem.status })
    .from(IranKetabDiscoveryItem)
    .where(eq(IranKetabDiscoveryItem.importSessionId, sessionId))
    .limit(1);
  if (!item) return null;
  const [updated] = await db
    .update(IranKetabDiscoveryItem)
    .set({ status: "IMPORTING", updatedAt: new Date() })
    .where(and(eq(IranKetabDiscoveryItem.id, item.id), eq(IranKetabDiscoveryItem.status, "APPROVED")))
    .returning({ id: IranKetabDiscoveryItem.id });
  if (!updated) throw new IranKetabDiscoveryCandidateError("DISCOVERY_IMPORT_NOT_APPROVED");
  return item.id;
}

/** Worker-only approval; its caller must have already verified AUTO_IMPORT on the originating source. */
export async function approveDiscoveryCandidateForAutoImport(sessionId: string) {
  const [updated] = await db.update(IranKetabDiscoveryItem)
    .set({ status: "APPROVED", failureCode: null, failureReason: null, updatedAt: new Date() })
    .where(and(eq(IranKetabDiscoveryItem.importSessionId, sessionId), eq(IranKetabDiscoveryItem.status, "NEEDS_REVIEW")))
    .returning({ id: IranKetabDiscoveryItem.id });
  if (!updated) throw new IranKetabDiscoveryCandidateError("DISCOVERY_IMPORT_NOT_APPROVED");
  return updated;
}

export async function completeDiscoveryCommit(sessionId: string, catalogBookId: string) {
  await db.update(IranKetabDiscoveryItem)
    .set({ status: "IMPORTED", existingCatalogBookId: catalogBookId, failureCode: null, failureReason: null, updatedAt: new Date() })
    .where(and(eq(IranKetabDiscoveryItem.importSessionId, sessionId), eq(IranKetabDiscoveryItem.status, "IMPORTING")));
}

export async function failDiscoveryCommit(sessionId: string, code: string, message: string) {
  await db.update(IranKetabDiscoveryItem)
    .set({ status: "FAILED", failureCode: code, failureReason: message, updatedAt: new Date() })
    .where(and(
      eq(IranKetabDiscoveryItem.importSessionId, sessionId),
      inArray(IranKetabDiscoveryItem.status, ["NEEDS_REVIEW", "APPROVED", "IMPORTING"]),
    ));
}

function candidateConditions(input: {
  q?: string;
  status?: (typeof IranKetabDiscoveryItem.$inferSelect)["status"];
  importConfidence?: (typeof IranKetabDiscoveryItem.$inferSelect)["importConfidence"];
  minimumPriorityScore?: number;
  sourceId?: string;
}) {
  const conditions: SQL[] = [];
  if (input.q?.trim())
    conditions.push(ilike(IranKetabDiscoveryItem.titleHint, `%${input.q.trim()}%`));
  if (input.status) conditions.push(eq(IranKetabDiscoveryItem.status, input.status));
  if (input.importConfidence)
    conditions.push(
      eq(IranKetabDiscoveryItem.importConfidence, input.importConfidence),
    );
  if (input.minimumPriorityScore !== undefined)
    conditions.push(
      sql`${IranKetabDiscoveryItem.priorityScore} >= ${input.minimumPriorityScore}`,
    );
  if (input.sourceId)
    conditions.push(sql`exists (
      select 1 from "IranKetabDiscoveryMembership" as membership
      where membership."discovery_item_id" = ${IranKetabDiscoveryItem.id}
        and membership."discovery_source_id" = ${input.sourceId}
    )`);
  return conditions;
}

async function loadMembershipsByItem(
  itemIds: string[],
): Promise<Map<string, DiscoveryMembershipDto[]>> {
  const membershipsByItem = new Map<string, DiscoveryMembershipDto[]>();
  if (!itemIds.length) return membershipsByItem;
  const rows = await db
    .select({
      id: IranKetabDiscoveryMembership.id,
      discoveryItemId: IranKetabDiscoveryMembership.discoveryItemId,
      discoverySourceId: IranKetabDiscoveryMembership.discoverySourceId,
      firstSeenAt: IranKetabDiscoveryMembership.firstSeenAt,
      lastSeenAt: IranKetabDiscoveryMembership.lastSeenAt,
      sourcePosition: IranKetabDiscoveryMembership.sourcePosition,
      sourceTitleHint: IranKetabDiscoveryMembership.sourceTitleHint,
      preferredEditionCode: IranKetabDiscoveryMembership.preferredEditionCode,
      sourceScoreContribution: IranKetabDiscoveryMembership.sourceScoreContribution,
      metadata: IranKetabDiscoveryMembership.metadata,
      createdAt: IranKetabDiscoveryMembership.createdAt,
      updatedAt: IranKetabDiscoveryMembership.updatedAt,
      sourceName: IranKetabDiscoverySource.name,
      sourceType: IranKetabDiscoverySource.sourceType,
      sourceUrl: IranKetabDiscoverySource.sourceUrl,
      sourceImportance: IranKetabDiscoverySource.importance,
      sourceEnabled: IranKetabDiscoverySource.enabled,
    })
    .from(IranKetabDiscoveryMembership)
    .innerJoin(
      IranKetabDiscoverySource,
      eq(
        IranKetabDiscoveryMembership.discoverySourceId,
        IranKetabDiscoverySource.id,
      ),
    )
    .where(inArray(IranKetabDiscoveryMembership.discoveryItemId, itemIds))
    .orderBy(desc(IranKetabDiscoveryMembership.lastSeenAt));
  for (const row of rows) {
    const memberships = membershipsByItem.get(row.discoveryItemId) ?? [];
    memberships.push(row);
    membershipsByItem.set(row.discoveryItemId, memberships);
  }
  return membershipsByItem;
}

function toCandidateDto(
  row: DiscoveryCandidateRow,
  memberships: DiscoveryMembershipDto[],
) {
  return {
    ...row,
    existingCatalogMatch: row.existingCatalogBookId
      ? {
          id: row.existingCatalogBookId,
          title: row.existingCatalogTitle,
          slug: row.existingCatalogSlug,
        }
      : null,
    sources: memberships.map((membership) => ({
      id: membership.discoverySourceId,
      name: membership.sourceName,
      type: membership.sourceType,
      url: membership.sourceUrl,
      importance: membership.sourceImportance,
      enabled: membership.sourceEnabled,
    })),
    memberships,
  };
}

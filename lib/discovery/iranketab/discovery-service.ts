import { eq } from "drizzle-orm";

import { db } from "@/db";
import {
  IranKetabDiscoveryItem,
  IranKetabDiscoveryMembership,
  IranKetabDiscoveryRun,
  IranKetabDiscoverySource,
} from "@/db/schema";
import { fetchIranKetabCollectionHtml } from "./collection-fetch";
import {
  runIranKetabDiscoverySource,
  type IranKetabDiscoveryRunRepository,
} from "./runner";
import { calculateDiscoveryScore } from "./scoring";

/** Runs one configured source immediately. Scheduling and queueing remain outside this module. */
export async function runDiscoverySource(sourceId: string) {
  return runIranKetabDiscoverySource(sourceId, {
    repository: drizzleDiscoveryRepository,
    fetchCollection: fetchIranKetabCollectionHtml,
    scoreItem: calculateDiscoveryScore,
  });
}

const drizzleDiscoveryRepository: IranKetabDiscoveryRunRepository = {
  async getSource(sourceId) {
    const [source] = await db
      .select({
        id: IranKetabDiscoverySource.id,
        sourceUrl: IranKetabDiscoverySource.sourceUrl,
        sourceType: IranKetabDiscoverySource.sourceType,
        enabled: IranKetabDiscoverySource.enabled,
        parserVersion: IranKetabDiscoverySource.parserVersion,
      })
      .from(IranKetabDiscoverySource)
      .where(eq(IranKetabDiscoverySource.id, sourceId))
      .limit(1);
    return source ?? null;
  },

  async createRun(sourceId) {
    const [run] = await db
      .insert(IranKetabDiscoveryRun)
      .values({ discoverySourceId: sourceId, status: "RUNNING" })
      .returning({ id: IranKetabDiscoveryRun.id });
    return run!;
  },

  async markSourceRunning(sourceId) {
    await db
      .update(IranKetabDiscoverySource)
      .set({
        crawlStatus: "RUNNING",
        lastErrorCode: null,
        lastErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(IranKetabDiscoverySource.id, sourceId));
  },

  async upsertCandidate({ sourceId, candidate }) {
    return db.transaction(async (tx) => {
      const now = new Date();
      const [inserted] = await tx
        .insert(IranKetabDiscoveryItem)
        .values({
          iranKetabBookId: candidate.iranKetabBookId,
          canonicalUrl: candidate.canonicalUrl,
          titleHint: candidate.titleHint,
          authorHint: candidate.authorHint,
          preferredEditionCode: candidate.preferredEditionCode,
        })
        .onConflictDoNothing()
        .returning({ id: IranKetabDiscoveryItem.id });

      const itemCreated = Boolean(inserted);
      let itemId = inserted?.id;
      if (!itemId) {
        const [existing] = await tx
          .select({ id: IranKetabDiscoveryItem.id })
          .from(IranKetabDiscoveryItem)
          .where(
            eq(
              IranKetabDiscoveryItem.iranKetabBookId,
              candidate.iranKetabBookId,
            ),
          )
          .limit(1);
        if (!existing) throw new Error("DISCOVERY_ITEM_UPSERT_LOOKUP_FAILED");
        itemId = existing.id;
        await tx
          .update(IranKetabDiscoveryItem)
          .set({
            canonicalUrl: candidate.canonicalUrl,
            ...(candidate.titleHint ? { titleHint: candidate.titleHint } : {}),
            ...(candidate.authorHint ? { authorHint: candidate.authorHint } : {}),
            ...(candidate.preferredEditionCode
              ? { preferredEditionCode: candidate.preferredEditionCode }
              : {}),
            updatedAt: now,
          })
          .where(eq(IranKetabDiscoveryItem.id, itemId));
      }

      await tx
        .insert(IranKetabDiscoveryMembership)
        .values({
          discoveryItemId: itemId,
          discoverySourceId: sourceId,
          lastSeenAt: now,
          sourcePosition: candidate.sourcePosition,
          sourceTitleHint: candidate.titleHint,
          preferredEditionCode: candidate.preferredEditionCode,
        })
        .onConflictDoUpdate({
          target: [
            IranKetabDiscoveryMembership.discoveryItemId,
            IranKetabDiscoveryMembership.discoverySourceId,
          ],
          set: {
            lastSeenAt: now,
            sourcePosition: candidate.sourcePosition,
            sourceTitleHint: candidate.titleHint,
            preferredEditionCode: candidate.preferredEditionCode,
            updatedAt: now,
          },
        });

      return { itemId, itemCreated, itemUpdated: !itemCreated };
    });
  },

  async completeRun(input) {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(IranKetabDiscoveryRun)
        .set({
          status: "SUCCESS",
          completedAt: now,
          pagesFetched: input.pagesFetched,
          booksFound: input.booksFound,
          itemsInserted: input.itemsInserted,
          itemsUpdated: input.itemsUpdated,
          errorCode: null,
          errorMessage: null,
          diagnostics: input.diagnostics,
        })
        .where(eq(IranKetabDiscoveryRun.id, input.runId));
      await tx
        .update(IranKetabDiscoverySource)
        .set({
          crawlStatus: "SUCCEEDED",
          crawlLeaseExpiresAt: null,
          lastCrawledAt: now,
          lastSuccessAt: now,
          lastErrorCode: null,
          lastErrorMessage: null,
          discoveredBookCount: input.booksFound,
          newBookCount: input.itemsInserted,
          updatedAt: now,
        })
        .where(eq(IranKetabDiscoverySource.id, input.sourceId));
    });
  },

  async failRun(input) {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(IranKetabDiscoveryRun)
        .set({
          status: "FAILED",
          completedAt: now,
          pagesFetched: input.pagesFetched,
          booksFound: input.booksFound,
          itemsInserted: input.itemsInserted,
          itemsUpdated: input.itemsUpdated,
          errorCode: input.errorCode,
          errorMessage: input.errorMessage,
          diagnostics: input.diagnostics,
        })
        .where(eq(IranKetabDiscoveryRun.id, input.runId));
      await tx
        .update(IranKetabDiscoverySource)
        .set({
          crawlStatus: "FAILED",
          crawlLeaseExpiresAt: null,
          lastCrawledAt: now,
          lastErrorCode: input.errorCode,
          lastErrorMessage: input.errorMessage,
          discoveredBookCount: input.booksFound,
          newBookCount: input.itemsInserted,
          updatedAt: now,
        })
        .where(eq(IranKetabDiscoverySource.id, input.sourceId));
    });
  },
};

import { and, asc, desc, eq, gte, inArray, lte, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { IranKetabDiscoveryImportJob, IranKetabDiscoveryItem } from "@/db/schema";
import {
  IranKetabDiscoveryImportBridgeError,
  startDiscoveryImport,
} from "./import-bridge";

export const IRANKETAB_DISCOVERY_IMPORT_JOB_PAGE_SIZE = 25;
export const IRANKETAB_DISCOVERY_IMPORT_JOB_MAX_ATTEMPTS = 3;
export const IRANKETAB_DISCOVERY_IMPORT_JOB_LEASE_MS = 10 * 60_000;

type JobStatus = (typeof IranKetabDiscoveryImportJob.$inferSelect)["status"];
type JobRow = typeof IranKetabDiscoveryImportJob.$inferSelect;

export class IranKetabDiscoveryImportQueueError extends Error {
  constructor(
    public readonly code:
      | "DISCOVERY_ITEM_NOT_FOUND"
      | "DISCOVERY_ITEM_NOT_QUEUED"
      | "IMPORT_JOB_NOT_FOUND"
      | "IMPORT_JOB_NOT_CANCELLABLE"
      | "IMPORT_JOB_NOT_RETRYABLE",
  ) {
    super(code);
  }
}

export async function enqueueDiscoveryItem(discoveryItemId: string) {
  const [item] = await db
    .select({ id: IranKetabDiscoveryItem.id, status: IranKetabDiscoveryItem.status, priorityScore: IranKetabDiscoveryItem.priorityScore })
    .from(IranKetabDiscoveryItem)
    .where(eq(IranKetabDiscoveryItem.id, discoveryItemId))
    .limit(1);
  if (!item) throw new IranKetabDiscoveryImportQueueError("DISCOVERY_ITEM_NOT_FOUND");
  if (item.status !== "QUEUED")
    throw new IranKetabDiscoveryImportQueueError("DISCOVERY_ITEM_NOT_QUEUED");

  const active = await findActiveJob(discoveryItemId);
  if (active) return { job: active, reused: true };
  try {
    const [job] = await db
      .insert(IranKetabDiscoveryImportJob)
      .values({ discoveryItemId, priority: item.priorityScore, maxAttempts: IRANKETAB_DISCOVERY_IMPORT_JOB_MAX_ATTEMPTS })
      .returning();
    return { job, reused: false };
  } catch (error) {
    // The partial unique index is the concurrency-safe duplicate guard.
    const concurrent = await findActiveJob(discoveryItemId);
    if (concurrent) return { job: concurrent, reused: true };
    throw error;
  }
}

export async function enqueueManyDiscoveryItems(ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  return Promise.all(
    uniqueIds.map(async (discoveryItemId) => {
      try {
        return { discoveryItemId, ...(await enqueueDiscoveryItem(discoveryItemId)) };
      } catch (error) {
        return {
          discoveryItemId,
          error: error instanceof IranKetabDiscoveryImportQueueError ? error.code : "IMPORT_JOB_ENQUEUE_FAILED",
        };
      }
    }),
  );
}

/** Atomically selects one runnable job with SKIP LOCKED and attaches a lease. */
export async function claimNextImportJob(workerId: string) {
  const now = new Date();
  const leaseExpiredAt = new Date(now.getTime() - IRANKETAB_DISCOVERY_IMPORT_JOB_LEASE_MS);
  // Exhausted jobs are terminal before workers consider the next claim.
  await db
    .update(IranKetabDiscoveryImportJob)
    .set({ status: "FAILED", completedAt: now, lastErrorCode: "MAX_ATTEMPTS_EXHAUSTED", lastErrorMessage: "حداکثر دفعات تلاش برای ورود انجام شد.", updatedAt: now })
    .where(
      and(
        gte(IranKetabDiscoveryImportJob.attempts, IranKetabDiscoveryImportJob.maxAttempts),
        or(
          eq(IranKetabDiscoveryImportJob.status, "PENDING"),
          and(
            eq(IranKetabDiscoveryImportJob.status, "PROCESSING"),
            lte(IranKetabDiscoveryImportJob.lockedAt, leaseExpiredAt),
          ),
        ),
      ),
    );

  const result = await db.execute(sql`
    WITH candidate AS (
      SELECT "id"
      FROM "IranKetabDiscoveryImportJob"
      WHERE
        ("status" = 'PENDING' AND "available_at" <= ${now} AND "attempts" < "max_attempts")
        OR ("status" = 'PROCESSING' AND "locked_at" <= ${leaseExpiredAt} AND "attempts" < "max_attempts")
      ORDER BY "priority" DESC, "created_at" ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    UPDATE "IranKetabDiscoveryImportJob" AS job
    SET "status" = 'PROCESSING',
        "attempts" = job."attempts" + 1,
        "locked_at" = ${now},
        "locked_by" = ${workerId},
        "started_at" = COALESCE(job."started_at", ${now}),
        "updated_at" = ${now}
    FROM candidate
    WHERE job."id" = candidate."id"
    RETURNING job.*
  `);
  return ((result as unknown as { rows: JobRow[] }).rows[0] ?? null);
}

export async function completeImportJob(jobId: string) {
  const [job] = await db
    .update(IranKetabDiscoveryImportJob)
    .set({ status: "COMPLETED", completedAt: new Date(), lockedAt: null, lockedBy: null, updatedAt: new Date() })
    .where(and(eq(IranKetabDiscoveryImportJob.id, jobId), eq(IranKetabDiscoveryImportJob.status, "PROCESSING")))
    .returning();
  if (!job) throw new IranKetabDiscoveryImportQueueError("IMPORT_JOB_NOT_FOUND");
  return job;
}

export async function failImportJob(jobId: string, error: unknown) {
  const [current] = await db
    .select()
    .from(IranKetabDiscoveryImportJob)
    .where(eq(IranKetabDiscoveryImportJob.id, jobId))
    .limit(1);
  if (!current) throw new IranKetabDiscoveryImportQueueError("IMPORT_JOB_NOT_FOUND");
  if (current.status !== "PROCESSING") return current;
  const failure = normalizeError(error);
  const retry = current.attempts < current.maxAttempts && isRetryableQueueFailure(failure.code);
  const now = new Date();
  const [updated] = await db
    .update(IranKetabDiscoveryImportJob)
    .set({
      status: retry ? "PENDING" : "FAILED",
      availableAt: retry ? new Date(now.getTime() + retryDelayMs(current.attempts)) : current.availableAt,
      lockedAt: null,
      lockedBy: null,
      completedAt: retry ? null : now,
      lastErrorCode: failure.code,
      lastErrorMessage: failure.message,
      updatedAt: now,
    })
    .where(and(eq(IranKetabDiscoveryImportJob.id, jobId), eq(IranKetabDiscoveryImportJob.status, "PROCESSING")))
    .returning();
  if (updated && retry)
    await db
      .update(IranKetabDiscoveryItem)
      .set({ status: "QUEUED", updatedAt: now })
      .where(
        and(
          eq(IranKetabDiscoveryItem.id, current.discoveryItemId),
          eq(IranKetabDiscoveryItem.status, "FAILED"),
        ),
      );
  return updated ?? current;
}

export async function cancelImportJob(jobId: string) {
  const [job] = await db
    .update(IranKetabDiscoveryImportJob)
    .set({ status: "CANCELLED", completedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(IranKetabDiscoveryImportJob.id, jobId), eq(IranKetabDiscoveryImportJob.status, "PENDING")))
    .returning();
  if (!job) throw new IranKetabDiscoveryImportQueueError("IMPORT_JOB_NOT_CANCELLABLE");
  return job;
}

/** An explicit administrator retry starts a fresh bounded attempt cycle but retains the last failure fields. */
export async function retryImportJob(jobId: string) {
  const [job] = await db
    .update(IranKetabDiscoveryImportJob)
    .set({ status: "PENDING", attempts: 0, availableAt: new Date(), lockedAt: null, lockedBy: null, completedAt: null, updatedAt: new Date() })
    .where(and(eq(IranKetabDiscoveryImportJob.id, jobId), eq(IranKetabDiscoveryImportJob.status, "FAILED")))
    .returning();
  if (!job) throw new IranKetabDiscoveryImportQueueError("IMPORT_JOB_NOT_RETRYABLE");
  await db
    .update(IranKetabDiscoveryItem)
    .set({ status: "QUEUED", updatedAt: new Date() })
    .where(
      and(
        eq(IranKetabDiscoveryItem.id, job.discoveryItemId),
        eq(IranKetabDiscoveryItem.status, "FAILED"),
      ),
    );
  return job;
}

/** Processes at most one job. The caller supplies a stable worker/admin identity. */
export async function processDiscoveryImportQueue(workerId: string) {
  const job = await claimNextImportJob(workerId);
  if (!job) return { processed: false as const, job: null };
  try {
    const result = await startDiscoveryImport(job.discoveryItemId, workerId);
    return { processed: true as const, job: await completeImportJob(job.id), result };
  } catch (error) {
    return { processed: true as const, job: await failImportJob(job.id, error), error: normalizeError(error) };
  }
}

export async function listDiscoveryImportJobs(input: { page?: number; status?: JobStatus; from?: Date; to?: Date; minimumPriority?: number }) {
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const conditions: SQL[] = [];
  if (input.status) conditions.push(eq(IranKetabDiscoveryImportJob.status, input.status));
  if (input.from) conditions.push(gte(IranKetabDiscoveryImportJob.createdAt, input.from));
  if (input.to) conditions.push(lte(IranKetabDiscoveryImportJob.createdAt, input.to));
  if (input.minimumPriority !== undefined) conditions.push(gte(IranKetabDiscoveryImportJob.priority, input.minimumPriority));
  const where = conditions.length ? and(...conditions) : undefined;
  const [jobs, totalRows] = await Promise.all([
    db.select({ job: IranKetabDiscoveryImportJob, titleHint: IranKetabDiscoveryItem.titleHint, authorHint: IranKetabDiscoveryItem.authorHint, canonicalUrl: IranKetabDiscoveryItem.canonicalUrl, itemStatus: IranKetabDiscoveryItem.status })
      .from(IranKetabDiscoveryImportJob)
      .innerJoin(IranKetabDiscoveryItem, eq(IranKetabDiscoveryImportJob.discoveryItemId, IranKetabDiscoveryItem.id))
      .where(where)
      .orderBy(desc(IranKetabDiscoveryImportJob.createdAt), desc(IranKetabDiscoveryImportJob.priority))
      .limit(IRANKETAB_DISCOVERY_IMPORT_JOB_PAGE_SIZE)
      .offset((page - 1) * IRANKETAB_DISCOVERY_IMPORT_JOB_PAGE_SIZE),
    db.select({ total: sql<number>`count(*)::int` }).from(IranKetabDiscoveryImportJob).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  return { jobs, total, page, pageSize: IRANKETAB_DISCOVERY_IMPORT_JOB_PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / IRANKETAB_DISCOVERY_IMPORT_JOB_PAGE_SIZE)) };
}

export function retryDelayMs(attempts: number) {
  return Math.min(60 * 60_000, 15_000 * 2 ** Math.max(0, attempts - 1));
}

function normalizeError(error: unknown) {
  if (error instanceof IranKetabDiscoveryImportBridgeError) return { code: error.code, message: error.message };
  if (error instanceof Error) return { code: error.message.slice(0, 120), message: error.message.slice(0, 1_000) };
  return { code: "IMPORT_QUEUE_PROCESSING_FAILED", message: "آماده‌سازی ورود از صف ناموفق بود." };
}

function isRetryableQueueFailure(code: string) {
  return ![
    "DISCOVERY_ITEM_NOT_FOUND",
    "DISCOVERY_ITEM_NOT_QUEUED",
    "DISCOVERY_ITEM_INVALID_URL",
  ].includes(code);
}

async function findActiveJob(discoveryItemId: string) {
  const [job] = await db
    .select()
    .from(IranKetabDiscoveryImportJob)
    .where(and(eq(IranKetabDiscoveryImportJob.discoveryItemId, discoveryItemId), inArray(IranKetabDiscoveryImportJob.status, ["PENDING", "PROCESSING"])))
    .orderBy(asc(IranKetabDiscoveryImportJob.createdAt))
    .limit(1);
  return job ?? null;
}

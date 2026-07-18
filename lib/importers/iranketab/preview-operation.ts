import { and, eq, lte, or } from "drizzle-orm";
import { db } from "@/db";
import { IranKetabPreviewOperation } from "@/db/schema";

const LEASE_MS = boundedEnv("IRANKETAB_PREVIEW_LEASE_MS", 5 * 60_000, 60_000, 15 * 60_000);
const RESULT_TTL_MS = boundedEnv("IRANKETAB_PREVIEW_RESULT_TTL_MS", 30 * 60_000, 60_000, 24 * 60 * 60_000);

type OperationRow = typeof IranKetabPreviewOperation.$inferSelect;
export type IranKetabPreviewPayload = { extraction: unknown; analysis: unknown; preview: unknown };
export type AcquirePreviewOperationResult =
  | { kind: "ACQUIRED" | "RETRY_ACQUIRED"; operation: OperationRow }
  | { kind: "PROCESSING"; operation: OperationRow; retryAfterSeconds: number }
  | { kind: "COMPLETED"; operation: OperationRow; payload: IranKetabPreviewPayload }
  | { kind: "FAILED"; operation: OperationRow };

function boundedEnv(name: string, fallback: number, minimum: number, maximum: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, Math.floor(value))) : fallback;
}

function lease(now = new Date()) { return new Date(now.getTime() + LEASE_MS); }
function resultExpiry(now = new Date()) { return new Date(now.getTime() + RESULT_TTL_MS); }
function asPayload(value: Record<string, unknown> | null): IranKetabPreviewPayload | null {
  if (!value || !("extraction" in value) || !("analysis" in value) || !("preview" in value)) return null;
  return value as IranKetabPreviewPayload;
}

/**
 * Atomic acquire-or-return on the unique source identity. A row is reused only
 * while its completed payload is fresh; expired leases/results are claimed with
 * a guarded update, so two reclaimers cannot both run the preview pipeline.
 */
export async function acquireOrGetIranKetabPreview(sourceIdentity: string): Promise<AcquirePreviewOperationResult> {
  const now = new Date();
  const [inserted] = await db.insert(IranKetabPreviewOperation).values({ sourceIdentity, status: "PROCESSING", leaseExpiresAt: lease(now) }).onConflictDoNothing().returning();
  if (inserted) return { kind: "ACQUIRED", operation: inserted };
  const [current] = await db.select().from(IranKetabPreviewOperation).where(eq(IranKetabPreviewOperation.sourceIdentity, sourceIdentity)).limit(1);
  if (!current) return acquireOrGetIranKetabPreview(sourceIdentity);
  const payload = asPayload(current.result);
  if (current.status === "COMPLETED" && current.expiresAt && current.expiresAt > now && payload) return { kind: "COMPLETED", operation: current, payload };
  if (current.status === "PROCESSING" && current.leaseExpiresAt && current.leaseExpiresAt > now)
    return { kind: "PROCESSING", operation: current, retryAfterSeconds: Math.max(1, Math.ceil((current.leaseExpiresAt.getTime() - now.getTime()) / 1000)) };
  if (current.status === "FAILED" && !current.retryable)
    return { kind: "FAILED", operation: current };
  const [claimed] = await db.update(IranKetabPreviewOperation).set({ status: "PROCESSING", leaseExpiresAt: lease(now), expiresAt: null, result: null, errorCode: null, errorMessage: null, retryable: false, generation: current.generation + 1, updatedAt: now }).where(and(eq(IranKetabPreviewOperation.id, current.id), or(
    and(eq(IranKetabPreviewOperation.status, "PROCESSING"), lte(IranKetabPreviewOperation.leaseExpiresAt, now)),
    and(eq(IranKetabPreviewOperation.status, "COMPLETED"), lte(IranKetabPreviewOperation.expiresAt, now)),
    and(eq(IranKetabPreviewOperation.status, "FAILED"), eq(IranKetabPreviewOperation.retryable, true)),
  ))).returning();
  if (claimed) return { kind: "RETRY_ACQUIRED", operation: claimed };
  return acquireOrGetIranKetabPreview(sourceIdentity);
}

export async function completeIranKetabPreview(operationId: string, generation: number, payload: IranKetabPreviewPayload) {
  const [updated] = await db.update(IranKetabPreviewOperation).set({ status: "COMPLETED", result: payload, leaseExpiresAt: null, expiresAt: resultExpiry(), retryable: false, errorCode: null, errorMessage: null, updatedAt: new Date() }).where(and(eq(IranKetabPreviewOperation.id, operationId), eq(IranKetabPreviewOperation.generation, generation), eq(IranKetabPreviewOperation.status, "PROCESSING"))).returning();
  if (!updated) throw new Error("PREVIEW_OPERATION_NOT_OWNED");
  return updated;
}

export async function failIranKetabPreview(operationId: string, generation: number, input: { code: string; message: string; retryable: boolean }) {
  await db.update(IranKetabPreviewOperation).set({ status: "FAILED", leaseExpiresAt: null, expiresAt: resultExpiry(), errorCode: input.code, errorMessage: input.message, retryable: input.retryable, updatedAt: new Date() }).where(and(eq(IranKetabPreviewOperation.id, operationId), eq(IranKetabPreviewOperation.generation, generation), eq(IranKetabPreviewOperation.status, "PROCESSING")));
}

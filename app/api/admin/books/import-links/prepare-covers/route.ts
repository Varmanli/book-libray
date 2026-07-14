import { NextRequest } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { prepareIranKetabCovers } from "@/lib/importers/iranketab/cover-preparation";
import {
  saveImportDraft,
  appendImportEvent,
  transitionImportSession,
} from "@/lib/importers/iranketab/session";
import { prepareCoversSuccessSchema } from "@/lib/importers/iranketab/cover-contract";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  let body: { sessionId?: string; extraction?: never; draft?: never };
  try {
    body = await req.json();
  } catch {
    return apiError("درخواست معتبر نیست", 400, "INVALID_DRAFT");
  }
  try {
    if (!body.sessionId)
      return apiError("شناسه فرآیند الزامی است", 400, "SESSION_REQUIRED");
    await saveImportDraft(body.sessionId, gate.user.id, {
      draft: body.draft,
      extraction: body.extraction,
    });
    await transitionImportSession(
      body.sessionId,
      gate.user.id,
      "COVER_PREPARATION",
      {},
      "COVER_PREPARATION_STARTED",
    );
    const result = await prepareIranKetabCovers({
      adminId: gate.user.id,
      extraction: body.extraction as never,
      draft: body.draft as never,
    });
    await transitionImportSession(
      body.sessionId,
      gate.user.id,
      "IMPORTING_REFERENCES",
      { preparedCovers: result.results, extractionFingerprint: result.fingerprint },
      "COVER_PREPARATION_COMPLETED",
      { statuses: result.results.map((item) => item.status) },
    );
    const contributors = ((body as unknown as { draft?: { entities?: Array<{ entityType: string; extractedName: string; action: string }> } }).draft?.entities) ?? [];
    await appendImportEvent(body.sessionId, "CONTRIBUTOR_STEP_STARTED", { total: contributors.length });
    for (const entity of contributors) {
      if (entity.action === "IGNORE") {
        await appendImportEvent(body.sessionId, "CONTRIBUTOR_IGNORED", { entityType: entity.entityType, name: entity.extractedName });
        continue;
      }
      await appendImportEvent(body.sessionId, "CONTRIBUTOR_PROFILE_FETCH_COMPLETED", { entityType: entity.entityType, name: entity.extractedName });
      await appendImportEvent(body.sessionId, entity.action === "REUSE_EXISTING" ? "CONTRIBUTOR_MATCHED" : "CONTRIBUTOR_CREATED", { entityType: entity.entityType, name: entity.extractedName });
      const staged = result.preparedDraft.preparedReferenceImages?.filter((image) => image.entityType === entity.entityType && image.extractedName === entity.extractedName && image.status === "PREPARED") ?? [];
      for (const image of staged) await appendImportEvent(body.sessionId, "CONTRIBUTOR_IMAGE_STAGED", { entityType: entity.entityType, name: entity.extractedName, kind: image.kind });
    }
    await appendImportEvent(body.sessionId, "CONTRIBUTOR_STEP_COMPLETED", { total: contributors.length });
    await transitionImportSession(
      body.sessionId,
      gate.user.id,
      "READY_TO_COMMIT",
      {
        preparedCovers: result.results,
        extractionFingerprint: result.fingerprint,
      },
      "CONTRIBUTOR_STEP_COMPLETED",
      { total: contributors.length },
    );
    const summary = {
      requested: result.results.filter(
        (x) => x.status === "PREPARED" || x.status === "FAILED",
      ).length,
      prepared: result.results.filter((x) => x.status === "PREPARED").length,
      skipped: result.results.filter((x) => x.status === "SKIPPED").length,
      keptExisting: result.results.filter((x) => x.status === "KEPT_EXISTING")
        .length,
      failed: result.results.filter((x) => x.status === "FAILED").length,
    };
    const payload = prepareCoversSuccessSchema.parse({ ok: true, ...result, summary });
    const { ok: _ok, ...data } = payload;
    return apiSuccess(data);
  } catch (error) {
    if (body.sessionId)
      await transitionImportSession(body.sessionId, gate.user.id, "FAILED", {
        errorCode: "COVER_PREPARATION_FAILED",
        errorMessage: "آماده‌سازی کاورها ناموفق بود",
        retryable: true,
        completedAt: new Date(),
      }).catch(() => undefined);
    console.error("iranketab cover preparation failed", {
      code: error instanceof Error ? error.message : "unknown",
    });
    return apiError(
      error instanceof Error && error.message.includes("حداکثر مجاز") ? error.message : "آماده‌سازی کاورها ناموفق بود",
      422,
      error instanceof Error && error.message === "INVALID_DRAFT"
        ? "INVALID_DRAFT"
        : "COVER_PREPARATION_FAILED",
    );
  }
}

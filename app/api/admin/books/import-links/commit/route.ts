import { NextRequest, NextResponse } from "next/server";
import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import {
  commitIranKetabImport,
  IranKetabCommitError,
} from "@/lib/importers/iranketab/commit";
import {
  assertOwnedImportSession,
  classifyRetryable,
  getImportSession,
  transitionImportSession,
} from "@/lib/importers/iranketab/session";
import { commitSuccessSchema } from "@/lib/importers/iranketab/commit-contract";
import {
  attachErrorCheckpointIfMissing,
  checkpoint,
} from "@/lib/importers/iranketab/error-diagnostics";
import { developmentErrorPayload } from "@/lib/importers/iranketab/commit-api-diagnostics";
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const body = (await req.json().catch(() => null)) as {
    extraction?: unknown;
    draft?: unknown;
    sessionId?: string;
  } | null;
  if (!body?.extraction || !body.draft || !body.sessionId)
    return apiError("درخواست ورود معتبر نیست", 400, "INVALID_DRAFT");
  let routeCheckpoint = checkpoint(
    "before_assert_owned_session",
    "POST /api/admin/books/import-links/commit",
    "session_validation",
    "assertOwnedImportSession(body.sessionId, gate.user.id)",
  );
  try {
    await assertOwnedImportSession(body.sessionId, gate.user.id);
    routeCheckpoint = checkpoint(
      "before_commit_session_transition",
      "POST /api/admin/books/import-links/commit",
      "session_transition",
      "transitionImportSession(..., COMMITTING)",
    );
    await transitionImportSession(
      body.sessionId,
      gate.user.id,
      "COMMITTING",
      {},
      "COMMIT_STARTED",
    ).catch(() => undefined);
    routeCheckpoint = checkpoint(
      "before_commit_iranketab_import",
      "POST /api/admin/books/import-links/commit",
      "commit_call",
      "commitIranKetabImport(...)",
    );
    const result = await commitIranKetabImport({
      adminId: gate.user.id,
      extraction: body.extraction as never,
      prepared: body.draft as never,
    });
    const summary = {
      catalogAction: result.catalog.action,
      catalogTitle: result.catalog.title,
      editions: result.editions.reduce<Record<string, number>>(
        (acc, item) => ({ ...acc, [item.action]: (acc[item.action] ?? 0) + 1 }),
        {},
      ),
      entities: {
        created: result.entities.created.length,
        reused: result.entities.reused.length,
      },
      warnings: result.warnings,
    };
    await transitionImportSession(
      body.sessionId,
      gate.user.id,
      "SUCCESS",
      {
        catalogId: result.catalog.id,
        resultSummary: summary,
        completedAt: new Date(),
        retryable: false,
        errorCode: null,
        errorMessage: null,
      },
      "COMMIT_COMPLETED",
      summary,
    ).catch(() => undefined);
    const payload = commitSuccessSchema.parse({ ok: true, result, sessionId: body.sessionId, sessionStatus: "SUCCESS", urls: { admin: `/admin/books/${result.catalog.id}/edit`, public: `/book/${result.catalog.id}`, history: `/admin/books/import-history/${body.sessionId}` } });
    const { ok: _ok, ...data } = payload;
    return apiSuccess(data);
  } catch (error) {
    attachErrorCheckpointIfMissing(error, routeCheckpoint);
    const code =
      error instanceof IranKetabCommitError ? error.code : "IMPORT_FAILED";
    if (code === "IMPORT_ALREADY_COMPLETED") {
      const completed = await getImportSession(body.sessionId);
      const session = completed?.session;
      const summary = (session?.resultSummary ?? {}) as { catalogAction?: string; catalogTitle?: string; warnings?: string[] };
      if (session?.status === "SUCCESS" && session.catalogId) {
        const action = ["CREATED", "REUSED", "UPDATED"].includes(summary.catalogAction ?? "") ? summary.catalogAction : "REUSED";
        const payload = commitSuccessSchema.parse({ ok: true, alreadyCompleted: true, sessionId: body.sessionId, sessionStatus: "SUCCESS", result: { catalog: { id: session.catalogId, title: summary.catalogTitle ?? "کتاب ثبت‌شده", action }, editions: [], entities: { created: [], reused: [] }, warnings: summary.warnings ?? [] }, urls: { admin: `/admin/books/${session.catalogId}/edit`, public: `/book/${session.catalogId}`, history: `/admin/books/import-history/${body.sessionId}` } });
        const { ok: _ok, ...data } = payload;
        return apiSuccess(data);
      }
    }
    await transitionImportSession(
      body.sessionId,
      gate.user.id,
      "FAILED",
      {
        errorCode: code,
        errorMessage:
          error instanceof IranKetabCommitError
            ? error.message
            : "ثبت نهایی کتاب ناموفق بود",
        retryable: classifyRetryable(code),
        completedAt: new Date(),
      },
      "COMMIT_FAILED",
      { code },
    ).catch(() => undefined);
    if (error instanceof IranKetabCommitError) {
      const developmentDiagnostics = process.env.NODE_ENV !== "production" || process.env.IRANKETAB_DEBUG === "true";
      const { diagnostic, errorChain, lastCheckpoint } = developmentErrorPayload(error, body, developmentDiagnostics);
      console.error("[iranketab.commit] API failure", { internalCode: error.code, message: error.message, cause: error.cause, errorChain, lastCheckpoint, sessionId: body.sessionId });
      const detail = process.env.NODE_ENV !== "production" && error.cause instanceof Error ? ` ${error.cause.message}` : "";
      return NextResponse.json({ ok: false, error: `${error.message}${detail}`, code: error.code, diagnostic, errorChain, lastCheckpoint }, { status: 409 });
    }
    console.error("iranketab commit failed", error);
    const developmentDiagnostics = process.env.NODE_ENV !== "production" || process.env.IRANKETAB_DEBUG === "true";
    const diagnostics = developmentErrorPayload(error, body, developmentDiagnostics);
    return NextResponse.json({
      ok: false,
      error: "ثبت نهایی کتاب ناموفق بود",
      code: "IMPORT_FAILED",
      ...diagnostics,
    }, { status: 500 });
  }
}

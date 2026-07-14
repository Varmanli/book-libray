import { NextRequest } from "next/server";
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
export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const gate = await assertAdminApi();
  if ("error" in gate) return gate.error;
  const body = (await req.json().catch(() => null)) as {
    extraction?: never;
    draft?: never;
    sessionId?: string;
  } | null;
  if (!body?.extraction || !body.draft || !body.sessionId)
    return apiError("درخواست ورود معتبر نیست", 400, "INVALID_DRAFT");
  try {
    await assertOwnedImportSession(body.sessionId, gate.user.id);
    await transitionImportSession(
      body.sessionId,
      gate.user.id,
      "COMMITTING",
      {},
      "COMMIT_STARTED",
    ).catch(() => undefined);
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
    if (error instanceof IranKetabCommitError)
      return apiError(error.message, 409, error.code);
    console.error("iranketab commit failed", error);
    return apiError("ثبت نهایی کتاب ناموفق بود", 500, "IMPORT_FAILED");
  }
}

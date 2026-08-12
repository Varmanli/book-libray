import { commitIranKetabImport, IranKetabCommitError } from "./commit";
import { preparedDraftSchema } from "./cover-contract";
import { reprepareMissingIranKetabMedia } from "./cover-preparation";
import { prepareIranKetabCovers } from "./cover-preparation";
import { initializeIranKetabDraft } from "./draft";
import {
  assertOwnedImportSession,
  classifyRetryable,
  getImportSession,
  persistPreparedImportDraft,
  saveImportDraft,
  transitionImportSession,
} from "./session";
import {
  beginApprovedDiscoveryCommit,
  completeDiscoveryCommit,
  failDiscoveryCommit,
  IranKetabDiscoveryCandidateError,
  approveDiscoveryCandidateForAutoImport,
} from "@/lib/discovery/iranketab/candidate-service";

export class IranKetabCommitServiceError extends Error {
  constructor(public readonly code: "SESSION_NOT_READY" | "AUTO_IMPORT_REVIEW_REQUIRED" | "DISCOVERY_IMPORT_NOT_APPROVED", message: string) {
    super(message);
  }
}

/**
 * The single authoritative importer commit orchestration. It intentionally
 * uses the persisted draft/media payload rather than accepting client data.
 * A queue worker can later call this service without acquiring direct DB
 * write privileges to catalog tables.
 */
export async function commitIranKetabImportSession(input: { sessionId: string; adminId: string; autoPrepare?: boolean; autoApproveDiscovery?: boolean }) {
  let discoveryCommitStarted = false;
  try {
    await assertOwnedImportSession(input.sessionId, input.adminId);
    const persisted = await getImportSession(input.sessionId);
    let prepared = preparedDraftSchema.safeParse(
      (persisted?.session.preparedCovers as unknown[] | null)?.[0],
    );
    if (!persisted?.session.extraction)
      throw new IranKetabCommitServiceError("SESSION_NOT_READY", "رسانه‌های این نشست آماده نیستند؛ دوباره آماده‌سازی کنید.");
    if (!prepared.success && input.autoPrepare) {
      if (persisted.session.status !== "PREVIEW_READY")
        throw new IranKetabCommitServiceError("SESSION_NOT_READY", "پیش‌نمایش نشست برای ورود خودکار آماده نیست.");
      const analysis = (persisted.session.metadata as { analysis?: never } | null)?.analysis;
      if (!analysis) throw new IranKetabCommitServiceError("SESSION_NOT_READY", "تحلیل پیش‌نمایش برای ورود خودکار موجود نیست.");
      if ((analysis as { summary?: { readiness?: string } }).summary?.readiness !== "READY_FOR_REVIEW")
        throw new IranKetabCommitServiceError("AUTO_IMPORT_REVIEW_REQUIRED", "تطبیق این کتاب نیازمند بررسی دستی است و ورود خودکار متوقف شد.");
      const draft = initializeIranKetabDraft(persisted.session.extraction as never, analysis);
      await saveImportDraft(input.sessionId, input.adminId, { draft, extraction: persisted.session.extraction });
      await transitionImportSession(input.sessionId, input.adminId, "COVER_PREPARATION", {}, "COVER_PREPARATION_STARTED");
      const generated = await prepareIranKetabCovers({ adminId: input.adminId, sessionId: input.sessionId, extraction: persisted.session.extraction as never, draft });
      await transitionImportSession(input.sessionId, input.adminId, "IMPORTING_REFERENCES", { preparedCovers: [generated.preparedDraft], extractionFingerprint: generated.fingerprint }, "COVER_PREPARATION_COMPLETED");
      await transitionImportSession(input.sessionId, input.adminId, "READY_TO_COMMIT", { preparedCovers: [generated.preparedDraft], extractionFingerprint: generated.fingerprint }, "CONTRIBUTOR_STEP_COMPLETED");
      prepared = preparedDraftSchema.safeParse(generated.preparedDraft);
    }
    if (!prepared.success)
      throw new IranKetabCommitServiceError("SESSION_NOT_READY", "رسانه‌های این نشست آماده نیستند؛ دوباره آماده‌سازی کنید.");

    // Discovery-linked sessions use the explicit approval guard. Normal manual
    // importer sessions return null and retain their established behavior.
    if (input.autoApproveDiscovery) await approveDiscoveryCandidateForAutoImport(input.sessionId);
    discoveryCommitStarted = Boolean(await beginApprovedDiscoveryCommit(input.sessionId));
    const repaired = await reprepareMissingIranKetabMedia({
      adminId: input.adminId,
      sessionId: input.sessionId,
      extraction: persisted.session.extraction as never,
      prepared: prepared.data,
    });
    await persistPreparedImportDraft(input.sessionId, input.adminId, {
      draft: repaired.draft,
      extraction: persisted.session.extraction,
      preparedCovers: [repaired],
      fingerprint: repaired.fingerprint,
    });
    await transitionImportSession(input.sessionId, input.adminId, "COMMITTING", {}, "COMMIT_STARTED");
    const result = await commitIranKetabImport({
      adminId: input.adminId,
      sessionId: input.sessionId,
      extraction: persisted.session.extraction as never,
      prepared: repaired,
    });
    if (discoveryCommitStarted) await completeDiscoveryCommit(input.sessionId, result.catalog.id);
    const summary = {
      catalogAction: result.catalog.action,
      catalogTitle: result.catalog.title,
      editions: result.editions.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.action]: (acc[item.action] ?? 0) + 1 }), {}),
      entities: { created: result.entities.created.length, reused: result.entities.reused.length },
      warnings: result.warnings,
    };
    await transitionImportSession(input.sessionId, input.adminId, "SUCCESS", {
      catalogId: result.catalog.id, resultSummary: summary, completedAt: new Date(), retryable: false, errorCode: null, errorMessage: null,
    }, "COMMIT_COMPLETED", summary);
    return { result, summary };
  } catch (error) {
    const normalizedError = error instanceof IranKetabDiscoveryCandidateError
      ? new IranKetabCommitServiceError("DISCOVERY_IMPORT_NOT_APPROVED", "این نامزد برای ثبت نهایی تأیید نشده است")
      : error;
    const code = normalizedError instanceof IranKetabCommitError
      ? normalizedError.code
      : normalizedError instanceof IranKetabCommitServiceError
        ? normalizedError.code
        : "IMPORT_FAILED";
    const message = normalizedError instanceof Error ? normalizedError.message : "ثبت نهایی کتاب ناموفق بود";
    await transitionImportSession(input.sessionId, input.adminId, "FAILED", {
      errorCode: code,
      errorMessage: message,
      retryable: classifyRetryable(code), completedAt: new Date(),
    }, "COMMIT_FAILED", { code }).catch(() => undefined);
    if (discoveryCommitStarted || input.autoApproveDiscovery)
      await failDiscoveryCommit(input.sessionId, code, message);
    throw normalizedError;
  }
}

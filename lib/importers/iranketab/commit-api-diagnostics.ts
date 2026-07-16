import { IranKetabCommitError } from "./commit-errors";
import {
  findInErrorChain,
  lastCheckpointInChain,
  serializeErrorChain,
} from "./error-diagnostics";
import { StorageError } from "@/lib/server/s3";

export function diagnosticFor(error: unknown, body: { draft?: unknown }) {
  const prepared = body.draft as { draft?: { catalog?: { authors?: unknown[] }; editions?: Array<{ translators?: unknown[]; publisher?: unknown; action?: string }> }; fingerprint?: string; preparedCovers?: Array<{ objectKey?: string; extractedEditionIndex?: number }>; preparedReferenceImages?: Array<{ objectKey?: string }> } | undefined;
  const draft = prepared?.draft;
  const editions = draft?.editions ?? [];
  const storageError = findInErrorChain(
    error,
    (value): value is StorageError => value instanceof StorageError,
  );
  const storage = storageError?.diagnostic;
  const serializedChain = serializeErrorChain(error);
  const nestedDiagnostic = serializedChain
    .map((item) => item.diagnostic)
    .find((item): item is Record<string, unknown> => Boolean(item));
  const operation = storage ?? nestedDiagnostic;
  const promotionFailure = serializedChain.some(
    (item) => item.functionName === "promoteMedia",
  );
  const preparedCovers = prepared?.preparedCovers ?? [];
  const fingerprint = prepared?.fingerprint;
  return {
    internalErrorCode: error instanceof IranKetabCommitError ? error.code : "IMPORT_FAILED",
    commitStage: storageError || promotionFailure ? "media_promotion" : "final_commit",
    serverMessage: error instanceof Error ? error.message : "ثبت نهایی کتاب ناموفق بود",
    contributorCounts: { authors: draft?.catalog?.authors?.length ?? 0, translators: editions.reduce((n, e) => n + (e.action === "EXCLUDE" ? 0 : e.translators?.length ?? 0), 0), publishers: editions.filter((e) => e.action !== "EXCLUDE" && Boolean(e.publisher)).length },
    relationCounts: { authors: draft?.catalog?.authors?.length ?? 0, translators: editions.reduce((n, e) => n + (e.action === "EXCLUDE" ? 0 : e.translators?.length ?? 0), 0), publishers: editions.filter((e) => e.action !== "EXCLUDE" && Boolean(e.publisher)).length },
    sourceMediaKey: [...(prepared?.preparedCovers ?? []), ...(prepared?.preparedReferenceImages ?? [])].map((x) => x.objectKey).filter(Boolean),
    destinationMediaKey: operation?.destinationKey ?? (fingerprint && preparedCovers[0]?.extractedEditionIndex !== undefined ? `covers/iranketab-${fingerprint.slice(0, 20)}-${preparedCovers[0].extractedEditionIndex}.webp` : null),
    copyObject: operation?.copyObject ?? null,
    fallbackGetObject: operation?.fallbackGetObject ?? null,
    fallbackPutObject: operation?.fallbackPutObject ?? null,
    headObject: operation?.headObject ?? null,
    providerErrorCode: operation?.finalProviderErrorCode ?? operation?.providerErrorCode ?? null,
    requestId: operation?.requestId ?? null,
    failedGuard: operation?.failedGuard ?? null,
    lastCheckpoint: lastCheckpointInChain(error) ?? null,
  };
}

export function developmentErrorPayload(
  error: unknown,
  body: { draft?: unknown },
  enabled: boolean,
) {
  if (!enabled)
    return {
      diagnostic: undefined,
      errorChain: undefined,
      lastCheckpoint: undefined,
    };
  return {
    diagnostic: diagnosticFor(error, body),
    errorChain: serializeErrorChain(error),
    lastCheckpoint: lastCheckpointInChain(error),
  };
}

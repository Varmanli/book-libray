import { createHash } from "node:crypto";
import type { IranKetabExtractionEnvelope } from "@ghafaseh/iranketab-extractor";
import { saveImageUpload, deleteImageUpload } from "@/lib/server/upload-storage";
import { iranKetabImportDraftSchema, type IranKetabImportDraft, validateIranKetabDraft } from "./draft";
import { assertExtractionCollectionLimits, formatIranKetabSchemaIssues } from "./collection-limits";
import { fetchIranKetabCoverSecurely, IranKetabCoverFetchError, validateIranKetabCoverUrl } from "./cover-fetch";
import { IranKetabCoverProcessingError, processIranKetabCover } from "./cover-processing";
import type { PreparedCoverResult, PreparedDraft } from "./cover-contract";
import { prepareIranKetabReferenceImage } from "./reference-image-preparation";

/** Server-produced only: Phase 6 must bind this fingerprint and these keys to its final commit. */
export type IranKetabImportDraftWithPreparedCovers = PreparedDraft;
export function draftFingerprint(draft: IranKetabImportDraft) { return createHash("sha256").update(JSON.stringify({ canonicalUrl: draft.source.canonicalUrl, draftVersion: draft.draftVersion, catalog: draft.catalog.action === "REUSE_EXISTING" ? draft.catalog.catalogId : "new", editions: draft.editions.map(e => e.action === "CREATE_NEW" ? [e.extractedEditionIndex, e.fields.sourceEditionCode, e.coverAction] : [e.extractedEditionIndex, e.action]) })).digest("hex"); }
export function temporaryCoverPrefix(adminId: string, fingerprint: string) { return `tmp/iranketab-imports/${adminId}/${fingerprint}/`; }
export function isOwnedTemporaryCoverKey(key: string, adminId: string, fingerprint: string) { return key.startsWith(temporaryCoverPrefix(adminId, fingerprint)) && /^tmp\/iranketab-imports\/[\w-]+\/[a-f0-9]{64}\/[a-z0-9-]+\.webp$/i.test(key); }

export async function prepareIranKetabCovers(params: { adminId: string; extraction: IranKetabExtractionEnvelope; draft: IranKetabImportDraft }): Promise<{ fingerprint: string; results: PreparedCoverResult[]; preparedDraft: IranKetabImportDraftWithPreparedCovers }> {
  assertExtractionCollectionLimits(params.extraction);
  const parsed = iranKetabImportDraftSchema.safeParse(params.draft); if (!parsed.success) throw new Error(formatIranKetabSchemaIssues(parsed.error).join(" ")); if (params.extraction.contractVersion !== params.draft.source.contractVersion || params.extraction.source.canonicalUrl !== params.draft.source.canonicalUrl || params.extraction.source.editionCode !== params.draft.source.selectedEditionCode) throw new Error("INVALID_DRAFT");
  const allowed = new Set(Object.values(params.extraction.diagnostics.coverCandidatesByEdition).flat().map(candidate => candidate.url)); const validation = validateIranKetabDraft(params.draft, allowed); if (!validation.valid) throw new Error("INVALID_DRAFT");
  const fingerprint = draftFingerprint(params.draft); const prefix = temporaryCoverPrefix(params.adminId, fingerprint); const results: PreparedCoverResult[] = []; const preparedReferenceImages: NonNullable<PreparedDraft["preparedReferenceImages"]> = [];
  for (const decision of params.draft.editions) { const source = params.extraction.editions[decision.extractedEditionIndex]; if (!source) throw new Error("INVALID_DRAFT"); if (decision.action === "EXCLUDE" || decision.coverAction.action === "SKIP") { results.push({ extractedEditionIndex: decision.extractedEditionIndex, sourceEditionCode: source.sourceEditionCode, status: "SKIPPED" }); continue; } if (decision.coverAction.action === "KEEP_EXISTING") { results.push({ extractedEditionIndex: decision.extractedEditionIndex, sourceEditionCode: source.sourceEditionCode, status: "KEPT_EXISTING" }); continue; } const url = decision.coverAction.candidateUrl; if (!allowed.has(url) || !params.draft.source.approvedCoverCandidateUrls.includes(url) || !params.extraction.diagnostics.coverCandidatesByEdition[source.sourceEditionCode]?.some(candidate => candidate.url === url)) { results.push({ extractedEditionIndex: decision.extractedEditionIndex, sourceEditionCode: source.sourceEditionCode, status: "FAILED", error: { code: "INVALID_COVER_PROVENANCE", message: "آدرس کاور با اطلاعات استخراج‌شده مطابقت ندارد.", retryable: false } }); continue; }
    try { validateIranKetabCoverUrl(url); const downloaded = await fetchIranKetabCoverSecurely(url); const processed = await processIranKetabCover(downloaded.buffer, downloaded.mime); const objectKey = `${prefix}${decision.extractedEditionIndex}-${source.sourceEditionCode.replace(/[^a-z0-9-]/gi, "-")}.webp`; const upload = await saveImageUpload({ buffer: processed.buffer, contentType: processed.mimeType, filename: "cover.webp", folder: "temp", objectKey, metadata: { "iranketab-admin": params.adminId, "iranketab-fingerprint": fingerprint, "iranketab-edition-index": String(decision.extractedEditionIndex), "iranketab-edition-code": source.sourceEditionCode } }); results.push({ extractedEditionIndex: decision.extractedEditionIndex, sourceEditionCode: source.sourceEditionCode, status: "PREPARED", action: "USE_PREPARED", objectKey: upload.key, url: upload.url, originalSourceUrl: url, mimeType: processed.mimeType, width: processed.width, height: processed.height, sizeBytes: processed.buffer.length, preparedAt: new Date().toISOString() }); } catch (error) { const known = error instanceof IranKetabCoverFetchError || error instanceof IranKetabCoverProcessingError; results.push({ extractedEditionIndex: decision.extractedEditionIndex, sourceEditionCode: source.sourceEditionCode, status: "FAILED", error: { code: known ? error.code : "COVER_UPLOAD_FAILED", message: known ? error.message : "انتقال کاور به فضای ذخیره‌سازی انجام نشد.", retryable: !known || error instanceof IranKetabCoverFetchError && error.retryable } }); }
  }
  for (const [entityIndex, entity] of params.draft.entities.entries()) {
    if ((entity.entityType !== "AUTHOR" && entity.entityType !== "TRANSLATOR" && entity.entityType !== "PUBLISHER") || (entity.action !== "CREATE_NEW" && entity.action !== "REUSE_EXISTING")) continue;
      const imageUrl = entity.profile?.imageUrl;
    if (!imageUrl) continue;
    for (const kind of ["PROFILE", "BANNER"] as const) {
      const action = kind === "PROFILE" ? entity.profileImageAction : entity.bannerImageAction;
      if (action === "preserve" || action === "remove") continue;
      const sourceUrl = kind === "PROFILE" ? imageUrl : entity.profile?.bannerImageUrl;
      if (!sourceUrl) continue;
      try {
        const entityToken = createHash("sha256").update(`${entity.entityType}:${entity.extractedName}:${entityIndex}`).digest("hex").slice(0, 16);
        const image = await prepareIranKetabReferenceImage({ sourceUrl, objectKey: `${prefix}reference-${entity.entityType.toLowerCase()}-${entityToken}-${kind.toLowerCase()}.webp` });
        preparedReferenceImages.push({ entityType: entity.entityType, extractedName: entity.extractedName, kind, status: "PREPARED", ...image });
      } catch (error) {
        preparedReferenceImages.push({ entityType: entity.entityType, extractedName: entity.extractedName, kind, status: "FAILED", sourceUrl, error: error instanceof Error ? error.message : "REFERENCE_IMAGE_FAILED" });
      }
    }
  }
  return { fingerprint, results, preparedDraft: { draft: params.draft, fingerprint, preparedCovers: results, preparedReferenceImages } };
}
export async function cleanupIranKetabCovers(adminId: string, fingerprint: string, keys: string[]) { return Promise.all(keys.slice(0, 200).map(async key => { if (!isOwnedTemporaryCoverKey(key, adminId, fingerprint)) return { key, deleted: false }; try { await deleteImageUpload(key); return { key, deleted: true }; } catch { return { key, deleted: false }; } })); }

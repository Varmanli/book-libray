import assert from "node:assert/strict";
import test from "node:test";
import { prepareCoversSuccessSchema, preparedDraftMatchesCurrent } from "./cover-contract";
import type { IranKetabImportDraft } from "./draft";

const draft = {
  draftVersion: 1, source: { contractVersion: 1, submittedUrl: "https://www.iranketab.ir/book/1-a", canonicalUrl: "https://www.iranketab.ir/book/1-a", selectedEditionCode: null, approvedCoverCandidateUrls: [] },
  catalog: { action: "CREATE_NEW", fields: { title: "کتاب", subtitle: null, originalTitle: null, description: null, language: "fa", firstPublishedYear: null }, authors: [{ action: "CREATE_NEW", entityType: "AUTHOR", extractedName: "الف", proposedName: "الف" }], genres: [], country: null },
  editions: [{ extractedEditionIndex: 0, action: "EXCLUDE", reason: "test" }], entities: [], unresolvedIssues: [], readiness: "INVALID_DRAFT",
} as IranKetabImportDraft;
const fingerprint = "a".repeat(64);
const prepared = { extractedEditionIndex: 0, sourceEditionCode: "1", status: "PREPARED", action: "USE_PREPARED", objectKey: `tmp/iranketab-imports/admin/${fingerprint}/0-1.webp`, url: "/uploads/test.webp", originalSourceUrl: "https://www.iranketab.ir/Images/ProductImages/a.jpg", mimeType: "image/webp", width: 600, height: 900, sizeBytes: 12345, preparedAt: "2026-07-14T12:00:00.000Z" } as const;

test("client accepts the exact top-level apiSuccess cover response", () => {
  const response = { ok: true, fingerprint, results: [prepared], preparedDraft: { draft, fingerprint, preparedCovers: [prepared] }, summary: { requested: 1, prepared: 1, skipped: 0, keptExisting: 0, failed: 0 } };
  const parsed = prepareCoversSuccessSchema.safeParse(response);
  assert.equal(parsed.success, true);
});

test("the obsolete data envelope is rejected at path ok", () => {
  const parsed = prepareCoversSuccessSchema.safeParse({ data: { results: [prepared] } });
  assert.equal(parsed.success, false);
  if (parsed.success) return;
  assert.equal(parsed.error.issues[0]?.path.join("."), "ok");
});

test("normalized duplicate cover URLs do not falsely invalidate prepared state", () => {
  const current = structuredClone(draft);
  current.source.approvedCoverCandidateUrls = [prepared.originalSourceUrl, prepared.originalSourceUrl];
  const normalized = structuredClone(draft);
  normalized.source.approvedCoverCandidateUrls = [prepared.originalSourceUrl];
  assert.equal(preparedDraftMatchesCurrent({ draft: normalized, fingerprint, preparedCovers: [prepared] }, current), true);
});

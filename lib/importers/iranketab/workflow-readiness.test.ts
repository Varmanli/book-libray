import assert from "node:assert/strict";
import test from "node:test";
import type { IranKetabImportDraft } from "./draft";
import { deriveImportWorkflowReadiness } from "./workflow-readiness";

const base = {
  draftVersion: 1, source: { contractVersion: 1, submittedUrl: "https://www.iranketab.ir/book/1-a", canonicalUrl: "https://www.iranketab.ir/book/1-a", selectedEditionCode: null, approvedCoverCandidateUrls: [] },
  catalog: { action: "CREATE_NEW", fields: { title: "کتاب", subtitle: null, originalTitle: null, description: null, language: "فارسی", firstPublishedYear: null }, authors: [], genres: [], country: null },
  editions: [{ extractedEditionIndex: 0, action: "EXCLUDE", reason: "test" }], entities: [], unresolvedIssues: [], readiness: "INVALID_DRAFT",
} as unknown as IranKetabImportDraft;
const state = (draft = base, extra: Partial<Parameters<typeof deriveImportWorkflowReadiness>[0]> = {}) => deriveImportWorkflowReadiness({ draft, validation: { valid: true, issues: [] }, coverResults: [], prepared: false, committing: false, success: false, ...extra });

test("unresolved catalog shows catalog action", () => assert.equal(state({ ...base, readiness: "REQUIRES_CATALOG_DECISION" }), "REQUIRES_CATALOG_DECISION"));
test("unresolved entity shows entity action", () => assert.equal(state({ ...base, entities: [{ action: "UNRESOLVED", entityType: "AUTHOR", extractedName: "نویسنده", reason: "test" }] }), "REQUIRES_ENTITY_RESOLUTION"));
test("unresolved edition shows edition action", () => assert.equal(state({ ...base, readiness: "REQUIRES_EDITION_RESOLUTION" }), "REQUIRES_EDITION_RESOLUTION"));
test("conflict shows conflict action", () => assert.equal(state({ ...base, unresolvedIssues: [{ id: "c", message: "conflict", blocking: true }] }), "BLOCKED_BY_CONFLICT"));
test("ready draft shows prepare-covers action", () => assert.equal(state(), "READY_FOR_COVER_IMPORT"));
test("prepared and restored drafts show final commit action", () => assert.equal(state(base, { prepared: true }), "READY_FOR_FINAL_IMPORT"));
test("fixing the final blocker updates the action immediately", () => { const blocked = { ...base, entities: [{ action: "UNRESOLVED", entityType: "AUTHOR", extractedName: "نویسنده", reason: "test" }] } as IranKetabImportDraft; assert.equal(state(blocked), "REQUIRES_ENTITY_RESOLUTION"); assert.equal(state({ ...blocked, entities: [{ action: "CREATE_NEW", entityType: "AUTHOR", extractedName: "نویسنده", proposedName: "نویسنده" }] }), "READY_FOR_COVER_IMPORT"); });
test("partial and failed cover preparation remain actionable", () => { assert.equal(state(base, { coverResults: [{ status: "PREPARED" }, { status: "FAILED" }] }), "COVER_PREPARATION_PARTIAL"); assert.equal(state(base, { coverResults: [{ status: "FAILED" }] }), "COVER_PREPARATION_FAILED"); });

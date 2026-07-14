import assert from "node:assert/strict";
import test from "node:test";
import { iranKetabImportDraftSchema } from "./draft";
import { formatIranKetabSchemaIssues, IRANKETAB_COLLECTION_LIMITS as LIMITS } from "./collection-limits";

const author = { action: "CREATE_NEW" as const, entityType: "AUTHOR" as const, extractedName: "نویسنده", proposedName: "نویسنده" };
function draftWithEditions(count: number) {
  return {
    draftVersion: 1 as const,
    source: { contractVersion: 1 as const, submittedUrl: "https://www.iranketab.ir/book/1-a", canonicalUrl: "https://www.iranketab.ir/book/1-a", selectedEditionCode: null, approvedCoverCandidateUrls: [] as string[] },
    catalog: { action: "CREATE_NEW" as const, fields: { title: "کتاب", subtitle: null, originalTitle: null, description: null, language: "fa", firstPublishedYear: null }, authors: [author], genres: [], country: null },
    editions: Array.from({ length: count }, (_, index) => ({ extractedEditionIndex: index, action: "EXCLUDE" as const, reason: "test" })),
    entities: [author], unresolvedIssues: [], readiness: "INVALID_DRAFT" as const,
  };
}

test("exactly 100 editions are accepted", () => assert.equal(iranKetabImportDraftSchema.safeParse(draftWithEditions(100)).success, true));
test("more than 100 editions within the new limit are accepted", () => assert.equal(iranKetabImportDraftSchema.safeParse(draftWithEditions(101)).success, true));
test("exactly the new edition maximum is accepted", () => assert.equal(iranKetabImportDraftSchema.safeParse(draftWithEditions(LIMITS.editions)).success, true));
test("over the edition maximum reports collection, actual count, maximum, and Zod path", () => {
  const parsed = iranKetabImportDraftSchema.safeParse(draftWithEditions(LIMITS.editions + 1));
  assert.equal(parsed.success, false);
  if (parsed.success) return;
  assert.equal(parsed.error.issues[0]?.path.join("."), "editions");
  assert.match(formatIranKetabSchemaIssues(parsed.error).join(" "), /نسخه‌های بررسی‌شده.*۵۰۱.*۵۰۰/);
});
test("unrelated author arrays retain their smaller independent limit", () => {
  const draft = draftWithEditions(1);
  draft.catalog.authors = Array.from({ length: LIMITS.authors + 1 }, (_, index) => ({ ...author, extractedName: `نویسنده ${index}`, proposedName: `نویسنده ${index}` }));
  const parsed = iranKetabImportDraftSchema.safeParse(draft);
  assert.equal(parsed.success, false);
  if (parsed.success) return;
  assert.match(formatIranKetabSchemaIssues(parsed.error).join(" "), /catalog\.authors.*نویسندگان.*۵۱.*۵۰/);
});
test("approved cover URLs report the former failing path and exact count in Persian", () => {
  const draft = draftWithEditions(1);
  draft.source.approvedCoverCandidateUrls = Array.from({ length: 501 }, (_, index) => `https://www.iranketab.ir/Images/ProductImages/${index}.jpg`);
  const parsed = iranKetabImportDraftSchema.safeParse(draft);
  assert.equal(parsed.success, false);
  if (parsed.success) return;
  assert.equal(parsed.error.issues[0]?.path.join("."), "source.approvedCoverCandidateUrls");
  assert.match(formatIranKetabSchemaIssues(parsed.error).join(" "), /نشانی‌های یکتای کاور.*۵۰۱.*۵۰۰/);
});
test("repeated approved cover URLs are normalized without dropping distinct URLs", () => {
  const draft = draftWithEditions(1);
  draft.source.approvedCoverCandidateUrls = Array.from({ length: 7_253 }, (_, index) => `https://www.iranketab.ir/Images/ProductImages/${index % 323}.jpg`);
  const parsed = iranKetabImportDraftSchema.safeParse(draft);
  assert.equal(parsed.success, true);
  if (!parsed.success) return;
  assert.equal(parsed.data.source.approvedCoverCandidateUrls.length, 323);
});

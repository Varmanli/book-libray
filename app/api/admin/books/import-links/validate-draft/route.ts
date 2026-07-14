import { NextRequest } from "next/server";
import { inArray } from "drizzle-orm";
import { assertAdminApi } from "@/lib/admin/permissions";
import { apiError, apiSuccess } from "@/lib/api/response";
import { iranKetabImportDraftSchema, validateIranKetabDraft } from "@/lib/importers/iranketab/draft";
import { db } from "@/db";
import { BookEdition, CatalogBook, ReferenceItem } from "@/db/schema";
import { formatIranKetabSchemaIssues } from "@/lib/importers/iranketab/collection-limits";

/** Read-only freshness check; Phase 4 deliberately performs no mutations. */
export async function POST(req: NextRequest) {
  const gate = await assertAdminApi(); if ("error" in gate) return gate.error;
  let raw: unknown; try { raw = await req.json(); } catch { return apiError("پیش‌نویس معتبر نیست", 400, "INVALID_DRAFT"); }
  const parsed = iranKetabImportDraftSchema.safeParse(raw); if (!parsed.success) return apiError(formatIranKetabSchemaIssues(parsed.error).join(" "), 422, "INVALID_DRAFT");
  const draft = parsed.data; const local = validateIranKetabDraft(draft, new Set(draft.source.approvedCoverCandidateUrls));
  const catalogIds = draft.catalog.action === "REUSE_EXISTING" ? [draft.catalog.catalogId] : [];
  const editionIds = draft.editions.flatMap(item => item.action === "REUSE_EXISTING" ? [item.editionId] : []);
  const entityIds = draft.entities.flatMap(item => item.action === "REUSE_EXISTING" ? [item.entityId] : []);
  try {
    const [catalogs, editions, entities] = await Promise.all([catalogIds.length ? db.select({ id: CatalogBook.id }).from(CatalogBook).where(inArray(CatalogBook.id, catalogIds)) : [], editionIds.length ? db.select({ id: BookEdition.id, catalogBookId: BookEdition.catalogBookId }).from(BookEdition).where(inArray(BookEdition.id, editionIds)) : [], entityIds.length ? db.select({ id: ReferenceItem.id }).from(ReferenceItem).where(inArray(ReferenceItem.id, entityIds)) : []]);
    const issues = [...local.issues];
    if (catalogIds.some(id => !catalogs.some(row => row.id === id))) issues.push("کتاب انتخاب‌شده دیگر وجود ندارد.");
    if (editionIds.some(id => !editions.some(row => row.id === id))) issues.push("یکی از نسخه‌های انتخاب‌شده دیگر وجود ندارد.");
    if (entityIds.some(id => !entities.some(row => row.id === id))) issues.push("یکی از مراجع انتخاب‌شده دیگر وجود ندارد.");
    for (const edition of draft.editions) if (edition.action === "REUSE_EXISTING" && draft.catalog.action === "REUSE_EXISTING") { const row = editions.find(item => item.id === edition.editionId); if (row && row.catalogBookId !== draft.catalog.catalogId) issues.push("نسخه انتخاب‌شده به کتاب انتخاب‌شده تعلق ندارد."); }
    return apiSuccess({ valid: !issues.length, issues: [...new Set(issues)], readiness: issues.length ? "INVALID_DRAFT" : "READY_FOR_COVER_IMPORT" });
  } catch (error) { console.error("iranketab draft validation failed", error); return apiError("اعتبارسنجی وضعیت فعلی داده‌ها ناموفق بود", 500, "DRAFT_VALIDATION_FAILED"); }
}

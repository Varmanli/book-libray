import type { IranKetabImportDraft } from "./draft";

export type ImportWorkflowReadiness =
  | "REQUIRES_CATALOG_DECISION"
  | "REQUIRES_ENTITY_RESOLUTION"
  | "REQUIRES_EDITION_RESOLUTION"
  | "BLOCKED_BY_CONFLICT"
  | "INVALID_DRAFT"
  | "READY_FOR_COVER_IMPORT"
  | "COVER_PREPARATION_PARTIAL"
  | "COVER_PREPARATION_FAILED"
  | "READY_FOR_FINAL_IMPORT"
  | "COMMITTING"
  | "SUCCESS";

type CoverResult = { status: string; error?: { message?: string } };

export function deriveImportWorkflowReadiness(input: {
  draft: IranKetabImportDraft;
  validation: { valid: boolean; issues: string[] };
  coverResults: CoverResult[];
  prepared: boolean;
  committing: boolean;
  success: boolean;
}): ImportWorkflowReadiness {
  if (input.success) return "SUCCESS";
  if (input.committing) return "COMMITTING";

  const failedCovers = input.coverResults.filter((item) => item.status === "FAILED");
  if (failedCovers.length) {
    return input.coverResults.some((item) => item.status === "PREPARED")
      ? "COVER_PREPARATION_PARTIAL"
      : "COVER_PREPARATION_FAILED";
  }
  if (input.prepared) return "READY_FOR_FINAL_IMPORT";
  if (input.draft.unresolvedIssues.some((item) => item.blocking))
    return "BLOCKED_BY_CONFLICT";
  if (input.draft.entities.some((item) => item.action === "UNRESOLVED"))
    return "REQUIRES_ENTITY_RESOLUTION";
  if (input.draft.readiness === "REQUIRES_CATALOG_DECISION")
    return "REQUIRES_CATALOG_DECISION";
  if (input.draft.readiness === "REQUIRES_EDITION_RESOLUTION")
    return "REQUIRES_EDITION_RESOLUTION";
  if (!input.validation.valid) return "INVALID_DRAFT";
  return "READY_FOR_COVER_IMPORT";
}

export function workflowReadinessLabel(state: ImportWorkflowReadiness) {
  return {
    REQUIRES_CATALOG_DECISION: "نیازمند انتخاب کتاب",
    REQUIRES_ENTITY_RESOLUTION: "نیازمند حل مراجع",
    REQUIRES_EDITION_RESOLUTION: "نیازمند تصمیم نسخه‌ها",
    BLOCKED_BY_CONFLICT: "مسدود به‌دلیل تعارض",
    INVALID_DRAFT: "پیش‌نویس نامعتبر",
    READY_FOR_COVER_IMPORT: "آماده آماده‌سازی کاورها",
    COVER_PREPARATION_PARTIAL: "آماده‌سازی ناقص کاورها",
    COVER_PREPARATION_FAILED: "آماده‌سازی کاورها ناموفق",
    READY_FOR_FINAL_IMPORT: "آماده ثبت نهایی",
    COMMITTING: "در حال ثبت نهایی",
    SUCCESS: "ثبت موفق",
  }[state];
}

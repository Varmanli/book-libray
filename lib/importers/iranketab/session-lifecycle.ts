export const IMPORT_STATUSES = [
  "CREATED",
  "EXTRACTING",
  "PREVIEW_READY",
  "DRAFT_REVIEW",
  "COVER_PREPARATION",
  "READY_TO_COMMIT",
  "COMMITTING",
  "SUCCESS",
  "FAILED",
  "CANCELLED",
] as const;
export type ImportStatus = (typeof IMPORT_STATUSES)[number];
const transitions: Record<ImportStatus, ImportStatus[]> = {
  CREATED: ["EXTRACTING", "CANCELLED"],
  EXTRACTING: ["PREVIEW_READY", "FAILED"],
  PREVIEW_READY: ["DRAFT_REVIEW", "COVER_PREPARATION", "CANCELLED", "FAILED"],
  DRAFT_REVIEW: ["DRAFT_REVIEW", "COVER_PREPARATION", "CANCELLED", "FAILED"],
  COVER_PREPARATION: ["READY_TO_COMMIT", "DRAFT_REVIEW", "FAILED"],
  READY_TO_COMMIT: ["COMMITTING", "DRAFT_REVIEW", "CANCELLED", "FAILED"],
  COMMITTING: ["SUCCESS", "FAILED"],
  SUCCESS: [],
  FAILED: ["DRAFT_REVIEW", "COVER_PREPARATION", "COMMITTING", "CANCELLED"],
  CANCELLED: [],
};
export function canTransition(from: ImportStatus, to: ImportStatus) {
  return transitions[from].includes(to);
}
export function assertTransition(from: ImportStatus, to: ImportStatus) {
  if (!canTransition(from, to))
    throw new Error(`INVALID_SESSION_TRANSITION:${from}:${to}`);
}
export function classifyRetryable(code: string) {
  return [
    "FETCH_TIMEOUT",
    "FETCH_FAILED",
    "HTTP_ERROR",
    "COVER_PREPARATION_FAILED",
    "COVER_PROMOTION_FAILED",
    "DATABASE_TRANSACTION_FAILED",
    "CONCURRENT_IMPORT_CONFLICT",
    "PREVIEW_FAILED",
  ].includes(code);
}
const forbidden =
  /(?:html|password|secret|credential|stack|imageBytes|buffer)/i;
export function safeAuditJson(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const clean = (input: unknown, depth = 0): unknown => {
    if (
      depth > 8 ||
      input == null ||
      typeof input === "boolean" ||
      typeof input === "number"
    )
      return input;
    if (typeof input === "string") return input.slice(0, 10_000);
    if (Array.isArray(input))
      return input.slice(0, 200).map((item) => clean(item, depth + 1));
    if (typeof input === "object")
      return Object.fromEntries(
        Object.entries(input as Record<string, unknown>)
          .filter(([key]) => !forbidden.test(key))
          .map(([key, item]) => [key, clean(item, depth + 1)]),
      );
    return undefined;
  };
  return clean(value) as Record<string, unknown>;
}

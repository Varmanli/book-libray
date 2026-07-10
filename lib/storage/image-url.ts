/** Local upload paths are legacy data only and must never be newly persisted. */
export function isLocalUploadPath(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().replace(/\\/g, "/").toLowerCase();
  return (
    normalized.startsWith("/uploads/") ||
    normalized.startsWith("uploads/") ||
    normalized.startsWith("public/uploads/") ||
    normalized.startsWith("/public/uploads/") ||
    normalized.startsWith("/app/public/uploads/")
  );
}

export function isAllowedPersistedImageUrl(value: string | null | undefined): boolean {
  return !isLocalUploadPath(value);
}

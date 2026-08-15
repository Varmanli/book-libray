/** Local upload paths are served only by the development runtime. */
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
  // Local files are valid during `next dev`, where `public/uploads` is served
  // by Next.js. Production must never persist a runtime-local path because its
  // filesystem is not durable across deploys.
  return process.env.NODE_ENV !== "production" || !isLocalUploadPath(value);
}

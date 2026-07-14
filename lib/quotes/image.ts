export function normalizeQuoteText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeQuoteImageKey(value: unknown): string | null {
  if (value === null || value === "") return null;
  return typeof value === "string" ? value.trim() || null : null;
}

export function isOwnedQuoteImageKey(key: string, userId: string): boolean {
  const prefix = `quotes/${userId}/`;
  return (
    key.startsWith(prefix) &&
    key.length > prefix.length &&
    !key.includes("..") &&
    !key.includes("\\") &&
    /^[a-zA-Z0-9/_\-.]+$/.test(key)
  );
}

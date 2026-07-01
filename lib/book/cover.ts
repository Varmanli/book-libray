function normalizePath(path: string) {
  return path.replace(/^\/+/, "");
}

export function normalizeCoverImage(input?: string | null): string | null {
  const raw = input?.trim();
  if (!raw || raw === "null" || raw === "undefined") return null;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, "");
  if (publicBase) {
    return `${publicBase}/${normalizePath(raw)}`;
  }

  return `/${normalizePath(raw)}`;
}

export function coalesceCoverImage(
  ...candidates: Array<string | null | undefined>
): string | null {
  for (const candidate of candidates) {
    const normalized = normalizeCoverImage(candidate);
    if (normalized) return normalized;
  }
  return null;
}

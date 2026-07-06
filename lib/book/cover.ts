function normalizePath(path: string) {
  return path.replace(/^\/+/, "");
}

export type EditionCoverLike = {
  coverImage?: string | null;
  coverUrl?: string | null;
};

export function normalizeCoverImage(input?: string | null): string | null {
  const raw = input?.trim();
  if (!raw || raw === "null" || raw === "undefined") return null;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("uploads/")) return `/${normalizePath(raw)}`;

  return null;
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

export function getEditionCoverSrc(
  edition?: EditionCoverLike | null,
  ...fallbacks: Array<string | null | undefined>
): string | null {
  return (
    coalesceCoverImage(edition?.coverImage, edition?.coverUrl) ??
    coalesceCoverImage(...fallbacks)
  );
}

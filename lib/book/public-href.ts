export function getPublicBookHref(book: {
  id?: string | number | null;
  slug?: string | null;
  catalogBookId?: string | number | null;
  editionId?: string | number | null;
}) {
  const slug = typeof book.slug === "string" ? book.slug.trim() : "";
  if (!slug) return null;
  const editionId = book.editionId == null ? "" : String(book.editionId).trim();
  return `/book/${encodeURIComponent(slug)}${
    editionId ? `?edition=${encodeURIComponent(editionId)}` : ""
  }`;
}

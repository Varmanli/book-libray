export function getPublicBookHref(book: {
  id?: string | number | null;
  slug?: string | null;
  catalogBookId?: string | number | null;
}) {
  const slug = typeof book.slug === "string" ? book.slug.trim() : "";
  if (!slug) return null;
  return `/book/${encodeURIComponent(slug)}`;
}

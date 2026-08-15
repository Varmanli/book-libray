export function getPublicGenreHref(genre: { slug?: string | null }) {
  const slug = genre.slug?.trim();
  return slug ? `/genres/${encodeURIComponent(slug)}` : null;
}

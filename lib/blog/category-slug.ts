import { slugify } from "@/lib/book/slug";

/**
 * Route params are normally already decoded by Next.js, but this also accepts
 * an encoded path segment from callers without ever throwing on malformed URLs.
 */
export function decodeBlogCategorySlug(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/**
 * Produces the canonical lookup key used for blog-category URLs.
 *
 * Persian text is often entered with Arabic ي/ك or with directional and
 * half-space characters. Category creation and public-route lookup must use
 * the same representation so those harmless variations resolve identically.
 */
export function normalizeBlogCategorySlug(value: string): string {
  const decoded = decodeBlogCategorySlug(value)
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک");

  return slugify(decoded);
}

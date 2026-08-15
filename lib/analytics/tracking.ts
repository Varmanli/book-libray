const BOT_USER_AGENT = /bot|crawler|spider|slurp|facebookexternalhit|preview|prerender|lighthouse|pagespeed|headless/i;
const ASSET_PATH = /\.(?:avif|css|gif|ico|jpe?g|js|map|mp3|mp4|png|svg|webp|woff2?)$/i;

export const ANALYTICS_VISITOR_COOKIE = "ghafaseh_visitor";

export type AnalyticsContent = {
  path: string;
  contentKind: "book" | "author" | "blog" | "translator" | "publisher" | null;
  contentSlug: string | null;
};

/** Accept only real public document paths and discard any query/hash data. */
export function normalizeAnalyticsPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > 500) return null;
  let pathname: string;
  try {
    pathname = new URL(value, "https://ghafaseh.local").pathname;
  } catch {
    return null;
  }
  if (!pathname.startsWith("/") || pathname.includes("\\")) return null;
  pathname = pathname.replace(/\/{2,}/g, "/");
  if (pathname.length > 1) pathname = pathname.replace(/\/$/, "");
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/wishlist" ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    /^\/book\/[^/]+\/my(?:\/|$)/.test(pathname) ||
    ASSET_PATH.test(pathname)
  ) return null;
  return pathname;
}

export function isAnalyticsBot(userAgent: string | null): boolean {
  return Boolean(userAgent && BOT_USER_AGENT.test(userAgent));
}

export function describeAnalyticsContent(path: string): AnalyticsContent {
  let parts: string[];
  try {
    parts = path.split("/").filter(Boolean).map(decodeURIComponent);
  } catch {
    return { path, contentKind: null, contentSlug: null };
  }
  const [section, slug] = parts;
  if (parts.length === 2 && section === "book") return { path, contentKind: "book", contentSlug: slug || null };
  if (parts.length === 2 && section === "authors") return { path, contentKind: "author", contentSlug: slug || null };
  if (parts.length === 2 && section === "blog") return { path, contentKind: "blog", contentSlug: slug || null };
  if (parts.length === 2 && section === "translators") return { path, contentKind: "translator", contentSlug: slug || null };
  if (parts.length === 2 && section === "publishers") return { path, contentKind: "publisher", contentSlug: slug || null };
  return { path, contentKind: null, contentSlug: null };
}

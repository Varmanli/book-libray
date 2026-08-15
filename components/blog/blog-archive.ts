export function buildBlogArchiveHref({ q = "", category = "", page = 1 }: { q?: string; category?: string; page?: number }) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (category.trim()) params.set("category", category.trim());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}

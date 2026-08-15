import { sanitizeRichTextHtml } from "@/lib/content/rich-text";

const BOOK_EMBED_RE = /<div\s+[^>]*data-blog-book-id=["']([a-zA-Z0-9-]{1,100})["'][^>]*><\/div>/gi;

export type BlogContentPart =
  | { type: "html"; html: string }
  | { type: "bookEmbed"; bookId: string };

/** Extracts only semantic book references from already-sanitized blog HTML. */
export function extractBlogBookEmbedIds(content: string): string[] {
  const ids = new Set<string>();
  for (const match of sanitizeRichTextHtml(content).matchAll(BOOK_EMBED_RE)) {
    ids.add(match[1]);
  }
  return [...ids];
}

/** Splits sanitized HTML into text fragments and stable book-reference blocks. */
export function splitBlogContentByEmbeds(content: string): BlogContentPart[] {
  const html = sanitizeRichTextHtml(content);
  const parts: BlogContentPart[] = [];
  let cursor = 0;

  for (const match of html.matchAll(BOOK_EMBED_RE)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ type: "html", html: html.slice(cursor, index) });
    parts.push({ type: "bookEmbed", bookId: match[1] });
    cursor = index + match[0].length;
  }
  if (cursor < html.length) parts.push({ type: "html", html: html.slice(cursor) });
  return parts;
}

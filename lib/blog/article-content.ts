import { sanitizeRichTextHtml } from "@/lib/content/rich-text";

export type ArticleHeading = { id: string; text: string; level: 2 | 3 };

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function headingId(text: string, index: number) {
  const normalized = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return `section-${normalized || "heading"}-${index + 1}`;
}

/** Returns stable H2/H3 anchors without changing the persisted HTML. */
export function prepareArticleContent(content: string): { html: string; headings: ArticleHeading[] } {
  const headings: ArticleHeading[] = [];
  const html = sanitizeRichTextHtml(content).replace(
    /<h([23])>([\s\S]*?)<\/h\1>/gi,
    (full, rawLevel: string, inner: string) => {
      const text = plainText(inner);
      if (!text) return full;
      const level = Number(rawLevel) as 2 | 3;
      const id = headingId(text, headings.length);
      headings.push({ id, text, level });
      return `<h${level} id="${id}">${inner}</h${level}>`;
    },
  );
  return { html, headings };
}

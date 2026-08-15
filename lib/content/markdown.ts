import MarkdownIt from "markdown-it";

import { sanitizeRichTextHtml } from "@/lib/content/rich-text";

const markdown = new MarkdownIt({ html: false, breaks: false, linkify: false });

/** Only Markdown with clear syntax takes the Markdown-specific paste path. */
export function looksLikeMarkdown(value: string) {
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (!text) return false;
  return /^(#{1,6}\s+|[-*_]{3,}\s*$|\s*>\s+|\s*(?:[-+*])\s+|\s*\d+[.)]\s+)/m.test(text)
    || /(?:\*\*|__)[^\n]+?(?:\*\*|__)|\[[^\]]+\]\([^\s)]+\)/.test(text);
}

function preserveMetadataParagraphs(value: string) {
  return value.replace(
    /^(\s*\*\*[^*\n]+:\*\*[^\n]*)\n(?=\s*\*\*[^*\n]+:\*\*[^\n]*)/gm,
    "$1\n\n",
  );
}

/** Converts a Markdown paste to the canonical sanitized HTML storage form. */
export function markdownToRichTextHtml(value: string) {
  const normalized = preserveMetadataParagraphs(value.replace(/\r\n?/g, "\n"));
  // The article title is the page H1, so body H1s become the highest body level.
  const html = markdown.render(normalized).replace(/<\/?h1>/gi, (tag) => tag.replace("h1", "h2"));
  return sanitizeRichTextHtml(html);
}

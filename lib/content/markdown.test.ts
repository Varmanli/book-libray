import assert from "node:assert/strict";
import test from "node:test";

import { looksLikeMarkdown, markdownToRichTextHtml } from "./markdown";

test("Markdown detection leaves ordinary Persian prose on the native paste path", () => {
  assert.equal(looksLikeMarkdown("این یک متن عادی با چند نماد است."), false);
  assert.equal(looksLikeMarkdown("# یک تیتر"), true);
});

test("Markdown paste creates separate semantic blocks and downgrades body H1", () => {
  const html = markdownToRichTextHtml("# عنوان\n\n## بخش\n\nپاراگراف اول.\n\nپاراگراف دوم.");
  assert.match(html, /<h2>عنوان<\/h2>\s*<h2>بخش<\/h2>/);
  assert.match(html, /<p>پاراگراف اول\.<\/p>\s*<p>پاراگراف دوم\.<\/p>/);
  assert.doesNotMatch(html, /<h1/);
});

test("Markdown metadata, rules, lists, quotes, and links retain structure", () => {
  const html = markdownToRichTextHtml("**نویسنده:** نام\n**انتشار:** ۱۸۶۶\n\n---\n\n- یکی\n- دو\n\n> نقل قول\n\n[پیوند](https://example.com)");
  assert.match(html, /<p><strong>نویسنده:<\/strong> نام<\/p>\s*<p><strong>انتشار:<\/strong> ۱۸۶۶<\/p>/);
  assert.match(html, /<hr\s*\/?/);
  assert.match(html, /<ul>\s*<li>یکی<\/li>\s*<li>دو<\/li>\s*<\/ul>/);
  assert.match(html, /<blockquote>\s*<p>نقل قول<\/p>\s*<\/blockquote>/);
  assert.match(html, /<a href="https:\/\/example\.com">پیوند<\/a>/);
});

test("long Markdown input does not flatten later sections", () => {
  const source = Array.from({ length: 80 }, (_, index) => `## بخش ${index + 1}\n\nپاراگراف ${index + 1}.`).join("\n\n");
  const html = markdownToRichTextHtml(source);
  assert.equal((html.match(/<h2>/g) ?? []).length, 80);
  assert.match(html, /<h2>بخش 80<\/h2>\s*<p>پاراگراف 80\.<\/p>/);
});

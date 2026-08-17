import assert from "node:assert/strict";
import test from "node:test";

import {
  extractBlogBookEmbedIds,
  splitBlogContentByEmbeds,
} from "./book-embed-content";
import { sanitizeRichTextHtml } from "@/lib/content/rich-text";

const BOOK_A = "11111111-1111-1111-1111-111111111111";
const BOOK_B = "22222222-2222-2222-2222-222222222222";

test("book embeds retain only their stable catalog identifier during parsing", () => {
  const content = `<p>پیش از کتاب</p><div data-blog-book-id="${BOOK_A}"></div><p>پس از کتاب</p>`;

  assert.deepEqual(extractBlogBookEmbedIds(content), [BOOK_A]);
  assert.deepEqual(splitBlogContentByEmbeds(content), [
    { type: "html", html: "<p>پیش از کتاب</p>" },
    { type: "bookEmbed", bookId: BOOK_A },
    { type: "html", html: "<p>پس از کتاب</p>" },
  ]);
});

test("legacy articles without embeds preserve their normal HTML content", () => {
  const content = "<p>یک نوشته‌ی قدیمی</p><h2>تیتر</h2>";
  assert.deepEqual(extractBlogBookEmbedIds(content), []);
  assert.deepEqual(splitBlogContentByEmbeds(content), [
    { type: "html", html: content },
  ]);
});

test("multiple embeds retain article order while batch IDs are deduplicated", () => {
  const content = `<div data-blog-book-id="${BOOK_A}"></div><p>میان متن</p><div data-blog-book-id="${BOOK_B}"></div><div data-blog-book-id="${BOOK_A}"></div>`;
  const parts = splitBlogContentByEmbeds(content);

  assert.deepEqual(
    parts
      .filter((part) => part.type === "bookEmbed")
      .map((part) => part.bookId),
    [BOOK_A, BOOK_B, BOOK_A],
  );
  assert.deepEqual(extractBlogBookEmbedIds(content), [BOOK_A, BOOK_B]);
});

test("unsafe placeholder attributes are removed rather than rendered as embeds", () => {
  const content = `<div data-blog-book-id="${BOOK_A}" onclick="alert(1)"></div><script>alert(1)</script>`;
  assert.deepEqual(extractBlogBookEmbedIds(content), [BOOK_A]);
  assert.doesNotMatch(sanitizeRichTextHtml(content), /onclick|script/);
  const [part] = splitBlogContentByEmbeds(content);
  assert.equal(part.type, "bookEmbed");
});

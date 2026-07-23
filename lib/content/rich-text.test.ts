import assert from "node:assert/strict";
import { test } from "node:test";

import { richTextToPlainText, sanitizeRichTextHtml } from "@/lib/content/rich-text";
import {
  createNoteSchema,
  NOTE_MAX_STORED_CHARACTERS,
  updateNoteSchema,
} from "@/lib/validations/notes";

test("rich notes keep supported structure and remove unsafe markup", () => {
  const html = sanitizeRichTextHtml(
    '<p><strong>یادداشت</strong></p><ul><li>نکته اول</li></ul><script>alert(1)</script>',
  );

  assert.match(html, /<strong>یادداشت<\/strong>/);
  assert.match(html, /<ul><li>نکته اول<\/li><\/ul>/);
  assert.doesNotMatch(html, /<script|alert\(1\)/);
});

test("plain-text conversion supports legacy text and structured Persian notes", () => {
  assert.equal(richTextToPlainText("خط اول\n\nخط دوم"), "خط اول\nخط دوم");
  assert.equal(
    richTextToPlainText("<blockquote>نقل‌قول</blockquote><ol><li>یک</li><li>دو</li></ol>"),
    "نقل‌قول\n• یک\n• دو",
  );
});

test("note validation rejects empty editor markup and measures visible text", () => {
  assert.equal(updateNoteSchema.safeParse({ content: "<p></p>" }).success, false);
  assert.equal(
    createNoteSchema.safeParse({
      catalogBookId: "book-1",
      bookEditionId: null,
      scope: "book",
      content: "<p><strong>یک یادداشت معتبر</strong></p>",
    }).success,
    true,
  );
});

test("book and edition notes accept long-form content on create and update", () => {
  const longContent = `<p>${"یادداشت پژوهشی ".repeat(550)}</p>`;

  assert.ok(longContent.length > 5_000);
  assert.equal(
    createNoteSchema.safeParse({
      catalogBookId: "book-1",
      scope: "book",
      bookEditionId: null,
      content: longContent,
    }).success,
    true,
  );
  assert.equal(
    createNoteSchema.safeParse({
      catalogBookId: "book-1",
      scope: "edition",
      bookEditionId: "edition-1",
      content: longContent,
    }).success,
    true,
  );
  assert.equal(updateNoteSchema.safeParse({ content: longContent }).success, true);
});

test("note validation retains a bounded payload limit", () => {
  assert.equal(
    updateNoteSchema.safeParse({ content: "الف".repeat(NOTE_MAX_STORED_CHARACTERS + 1) }).success,
    false,
  );
});

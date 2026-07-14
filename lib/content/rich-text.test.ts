import assert from "node:assert/strict";
import { test } from "node:test";

import { richTextToPlainText, sanitizeRichTextHtml } from "@/lib/content/rich-text";
import { createNoteSchema, updateNoteSchema } from "@/lib/validations/notes";

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

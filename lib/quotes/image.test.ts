import assert from "node:assert/strict";
import test from "node:test";

import { isOwnedQuoteImageKey, normalizeQuoteImageKey, normalizeQuoteText } from "./image";
import { QUOTE_MAX_UPLOAD_BYTES, validateImageFile } from "../upload";

test("quote content accepts text-only, image-only, and combined states", () => {
  assert.equal(normalizeQuoteText("  متن تکه  "), "متن تکه");
  assert.equal(normalizeQuoteImageKey("quotes/u1/a.webp"), "quotes/u1/a.webp");
  assert.equal(normalizeQuoteImageKey(""), null);
});

test("quote image ownership rejects other prefixes and unsafe paths", () => {
  assert.equal(isOwnedQuoteImageKey("quotes/u1/a.webp", "u1"), true);
  assert.equal(isOwnedQuoteImageKey("quotes/u2/a.webp", "u1"), false);
  assert.equal(isOwnedQuoteImageKey("quotes/u1/../u2/a.webp", "u1"), false);
  assert.equal(isOwnedQuoteImageKey("quotes/u1\\a.webp", "u1"), false);
});

test("quote uploads use the 8 MB policy and supported MIME types", () => {
  assert.equal(validateImageFile({ type: "image/jpeg", size: QUOTE_MAX_UPLOAD_BYTES }, QUOTE_MAX_UPLOAD_BYTES), null);
  assert.match(validateImageFile({ type: "image/heic", size: 100 }, QUOTE_MAX_UPLOAD_BYTES) ?? "", /JPG/);
  assert.match(validateImageFile({ type: "image/png", size: QUOTE_MAX_UPLOAD_BYTES + 1 }, QUOTE_MAX_UPLOAD_BYTES) ?? "", /حجم/);
});

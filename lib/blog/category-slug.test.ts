import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeBlogCategorySlug,
  normalizeBlogCategorySlug,
} from "./category-slug";

test("normalizes encoded Persian category path segments", () => {
  assert.equal(
    normalizeBlogCategorySlug("%D9%81%D8%B1%D8%A7%D9%86%D8%B3%D9%87"),
    "فرانسه",
  );
  assert.equal(normalizeBlogCategorySlug("فرانسه"), "فرانسه");
  assert.equal(decodeBlogCategorySlug("%E0%A4%A"), "%E0%A4%A");
});

test("normalizes common Persian input variations", () => {
  assert.equal(normalizeBlogCategorySlug("كتاب‌ خوانی"), "کتاب-خوانی");
  assert.equal(normalizeBlogCategorySlug("Reading Guide"), "reading-guide");
});

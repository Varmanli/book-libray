import assert from "node:assert/strict";
import test from "node:test";

import { detectIranKetabNextPageUrl, normalizeIranKetabPaginationUrl } from "./pagination";

test("detects a rel=next pagination URL and normalizes tracking parameters", () => {
  const next = detectIranKetabNextPageUrl(
    '<link rel="next" href="?page=2&utm_source=test#fragment">',
    "https://www.iranketab.ir/list/1001-books",
  );
  assert.equal(next, "https://www.iranketab.ir/list/1001-books?page=2");
});

test("detects common pagination navigation links", () => {
  const next = detectIranKetabNextPageUrl(
    '<nav class="pagination"><a href="/tag/fiction/page/2">بعدی</a></nav>',
    "https://www.iranketab.ir/tag/fiction",
  );
  assert.equal(next, "https://www.iranketab.ir/tag/fiction/page/2");
});

test("detects IranKetab button pagination and retains the page query parameter", () => {
  const next = detectIranKetabNextPageUrl(
    '<button data-page-index="1" class="paging-item active" disabled>1</button><button data-page-index="2" class="paging-item next">2</button><button data-page-index="24" class="paging-item last">24</button>',
    "https://www.iranketab.ir/tag/730-1001-books-you-must-read-before-you-die",
  );
  assert.equal(next, "https://www.iranketab.ir/tag/730-1001-books-you-must-read-before-you-die?page=2");
});

test("rejects untrusted pagination destinations", () => {
  assert.equal(normalizeIranKetabPaginationUrl("https://example.com/?page=2", "https://www.iranketab.ir/list/books"), null);
});

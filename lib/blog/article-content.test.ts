import assert from "node:assert/strict";
import test from "node:test";

import { prepareArticleContent } from "./article-content";

test("article headings receive stable ids while body H1 is never produced", () => {
  const result = prepareArticleContent("<h1>نباید بماند</h1><h2>شروع</h2><h3>جزئیات</h3><h2>پایان</h2>");
  assert.equal(result.headings.length, 3);
  assert.match(result.html, /<h2 id="section-شروع-1">/);
  assert.match(result.html, /<h3 id="section-جزئیات-2">/);
  assert.doesNotMatch(result.html, /<h1/);
});

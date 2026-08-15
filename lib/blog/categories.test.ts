import assert from "node:assert/strict";
import test from "node:test";

import { getMagazineCategory, MAGAZINE_CATEGORIES } from "./categories";

test("Phase 1 magazine category slugs resolve from one source of truth", () => {
  assert.equal(MAGAZINE_CATEGORIES.length, 6);
  assert.equal(getMagazineCategory("reading-guide")?.name, "راهنمای مطالعه");
  assert.equal(getMagazineCategory("not-a-category"), null);
});

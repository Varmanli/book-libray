import assert from "node:assert/strict";
import { test } from "node:test";

import { getPublicBookHref } from "@/lib/book/public-href";

test("edition-originated links preserve the active edition", () => {
  assert.equal(
    getPublicBookHref({ slug: "the-little-prince", editionId: "edition-b" }),
    "/book/the-little-prince?edition=edition-b",
  );
});

test("general links remain canonical and do not add an edition query", () => {
  assert.equal(
    getPublicBookHref({ slug: "the-little-prince" }),
    "/book/the-little-prince",
  );
});

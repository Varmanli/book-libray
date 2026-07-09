import assert from "node:assert/strict";
import { test } from "node:test";

import {
  compareEditionSets,
  validatePrimaryEditionResponse,
} from "@/lib/admin/edition-set-invariants";

const rows = (ids: string[]) => ids.map((id) => ({ id }));

test("same ids in a different order are valid", () => {
  const result = compareEditionSets(rows(["b", "a", "c"]), rows(["c", "b", "a"]));

  assert.equal(result.ok, true);
  assert.deepEqual(result.missingIds, []);
  assert.deepEqual(result.addedIds, []);
  assert.deepEqual(result.duplicateIds, []);
});

test("missing selected id fails the invariant", () => {
  const result = compareEditionSets(rows(["a", "b", "c"]), rows(["a", "c"]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.missingIds, ["b"]);
});

test("duplicate ids fail the invariant", () => {
  const result = compareEditionSets(rows(["a", "b"]), rows(["a", "b", "b"]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.duplicateIds, ["b"]);
});

test("extra ids fail the invariant", () => {
  const result = compareEditionSets(rows(["a", "b"]), rows(["a", "b", "c"]));

  assert.equal(result.ok, false);
  assert.deepEqual(result.addedIds, ["c"]);
});

test("cross-book editions in a primary-edition response are rejected", () => {
  const result = validatePrimaryEditionResponse("book-a", {
    catalogBook: { id: "book-a" },
    primaryEditionId: "edition-a",
    editions: [
      { id: "edition-a", catalogBookId: "book-a" },
      { id: "edition-b", catalogBookId: "book-b" },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.crossBookEditionIds, ["edition-b"]);
});

test("duplicate ids and an unknown primary are rejected", () => {
  const result = validatePrimaryEditionResponse("book-a", {
    catalogBook: { id: "book-a" },
    primaryEditionId: "missing",
    editions: [
      { id: "edition-a", catalogBookId: "book-a" },
      { id: "edition-a", catalogBookId: "book-a" },
    ],
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.duplicateIds, ["edition-a"]);
  assert.equal(result.primaryExists, false);
});

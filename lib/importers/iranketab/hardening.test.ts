import assert from "node:assert/strict";
import test from "node:test";
import {
  applyRelationDiff,
  diffRelations,
  editionFieldPatch,
  isValidIsbn,
} from "./hardening";
import {
  advisoryLockKey,
  canonicalIranKetabSourceIdentity,
} from "./server-hardening";

test("canonical URL variants share an advisory lock while other books do not", () => {
  const a = canonicalIranKetabSourceIdentity(
    "https://iranketab.ir/book/123-test",
  );
  const b = canonicalIranKetabSourceIdentity(
    "https://www.iranketab.ir/book/123-test#abc",
  );
  assert.equal(a, b);
  assert.equal(advisoryLockKey(a), advisoryLockKey(b));
  assert.notEqual(
    advisoryLockKey(a),
    advisoryLockKey(
      canonicalIranKetabSourceIdentity("https://iranketab.ir/book/124-test"),
    ),
  );
});

test("relation diff preserves unrelated values and removes only explicit values", () => {
  const diff = diffRelations(["a", "b"], ["b", "c", "c"], ["b"]);
  assert.deepEqual(diff, { add: ["c"], remove: ["b"], keep: ["a"] });
  assert.deepEqual(applyRelationDiff(diff, { requireOne: true }), ["a", "c"]);
  assert.throws(() =>
    applyRelationDiff(diffRelations(["a"], [], ["a"]), { requireOne: true }),
  );
});

test("edition actions preserve curated fields and validate custom ISBN", () => {
  const current = {
    titleOverride: "curated",
    publisher: "old",
    translators: "a، b",
    isbn10: null,
    isbn13: null,
    publishedYear: 1400,
    pageCount: 100,
    editionDescription: "safe",
  };
  const source = {
    ...current,
    titleOverride: "source",
    publisher: "new",
    publishedYear: 1401,
  };
  assert.deepEqual(
    editionFieldPatch(current, source, [
      { field: "titleOverride", action: "KEEP_EXISTING" },
      { field: "publisher", action: "FILL_IF_EMPTY" },
      { field: "publishedYear", action: "USE_SOURCE" },
    ]),
    { publishedYear: 1401 },
  );
  assert.throws(() =>
    editionFieldPatch(current, source, [
      { field: "isbn13", action: "USE_CUSTOM", customValue: "9780000000000" },
    ]),
  );
});

test("ISBN normalization handles Persian digits, hyphens, and checksum", () => {
  assert.equal(isValidIsbn("۹۷۸-۰-۳۰۶-۴۰۶۱۵-۷"), true);
  assert.equal(isValidIsbn("978-0-306-40615-8"), false);
});

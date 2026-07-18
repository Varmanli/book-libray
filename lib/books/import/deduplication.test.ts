import assert from "node:assert/strict";
import test from "node:test";

import { normalizeBookGroupingKey, normalizeBookTitle } from "./title-normalization";

test("identical normalized titles share the physical-variant grouping key", () => {
  assert.equal(normalizeBookGroupingKey("  کتاب  "), normalizeBookGroupingKey("کتاب"));
});

test("similar Harry Potter titles remain different", () => {
  assert.notEqual(
    normalizeBookTitle("هری پاتر و تالار اسرار"),
    normalizeBookTitle("هری پاتر و سنگ جادو"),
  );
});

test("publisher and translator cannot make different titles equal", () => {
  assert.notEqual(normalizeBookTitle("کتاب اول"), normalizeBookTitle("کتاب دوم"));
});

test("safe whitespace, invisible characters, and Arabic/Persian variants match", () => {
  assert.equal(
    normalizeBookTitle("\u200f  هري   پاتر و كودك نفرين‌شده  "),
    normalizeBookTitle("هری پاتر و کودک نفرین‌شده"),
  );
});

test("volumes, subtitles, and sequels remain meaningful title content", () => {
  const base = normalizeBookTitle("هری پاتر");
  assert.notEqual(base, normalizeBookTitle("هری پاتر جلد ۲"));
  assert.notEqual(base, normalizeBookTitle("هری پاتر: تالار اسرار"));
  assert.notEqual(base, normalizeBookTitle("هری پاتر و تالار اسرار"));
});

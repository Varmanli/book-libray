import assert from "node:assert/strict";
import { test } from "node:test";

import {
  normalizeQuoteBackground,
  type QuoteBackground,
} from "@/lib/quotes/backgrounds";

test("quote background normalization preserves supported variants", () => {
  const variants: QuoteBackground[] = [
    "default",
    "bg-1",
    "bg-2",
    "bg-3",
    "bg-4",
    "bg-5",
    "bg-6",
    "bg-7",
    "bg-8",
    "bg-9",
    "bg-10",
  ];

  for (const variant of variants) {
    assert.equal(normalizeQuoteBackground(variant), variant);
  }
});

test("quote background normalization rejects legacy and unknown values", () => {
  assert.equal(normalizeQuoteBackground("paper"), "default");
  assert.equal(normalizeQuoteBackground("grid"), "default");
  assert.equal(normalizeQuoteBackground("editorial"), "default");
  assert.equal(normalizeQuoteBackground(""), "default");
  assert.equal(normalizeQuoteBackground(null), "default");
});

import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveBookPresentation } from "@/lib/book/presentation";

const book = {
  title: "The Little Prince",
  author: "Antoine de Saint-Exupéry",
  coverImage: "https://cdn.example/primary.jpg",
  primaryEdition: {
    id: "primary",
    coverImage: "https://cdn.example/primary.jpg",
    publisher: "Primary Publisher",
  },
};

test("primary edition is a visual fallback and keeps general links canonical", () => {
  const result = resolveBookPresentation(book);
  assert.equal(result.coverImage, "https://cdn.example/primary.jpg");
  assert.equal(result.publisher, "Primary Publisher");
  assert.equal(result.linkEditionId, null);
});

test("an explicit display edition controls metadata and navigation context", () => {
  const result = resolveBookPresentation(book, {
    id: "edition-b",
    titleOverride: "The Little Prince — Ghazi translation",
    coverImage: "https://cdn.example/ghazi.jpg",
    translator: "Mohammad Ghazi",
    publisher: "Ney",
    editionLabel: "Second edition",
  });

  assert.equal(result.title, "The Little Prince — Ghazi translation");
  assert.equal(result.coverImage, "https://cdn.example/ghazi.jpg");
  assert.equal(result.publisher, "Ney");
  assert.equal(result.linkEditionId, "edition-b");
});

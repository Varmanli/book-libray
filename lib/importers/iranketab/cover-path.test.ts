import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCoverImage } from "@/lib/book/cover";
import {
  finalIranKetabCoverValue,
  finalIranKetabReferenceMediaValue,
  repairVerifiedIranKetabCoverPaths,
} from "./repair-cover-paths";

const key = "covers/iranketab-abcdef0123456789abcd-0.webp";

test("promoted IranKetab cover persists as a canonical covers object key", () => {
  assert.equal(finalIranKetabCoverValue(key), key);
  assert.doesNotMatch(finalIranKetabCoverValue(key), /^\/uploads\//);
});

for (const [label, referenceKey] of [
  ["author avatar", "references/iranketab-author-abcdef0123456789abcd-profile.webp"],
  ["translator avatar", "references/iranketab-translator-abcdef0123456789abcd-profile.webp"],
  ["publisher logo", "references/iranketab-publisher-abcdef0123456789abcd-profile.webp"],
] as const) {
  test(`final ${label} persists as canonical reference media`, () => {
    assert.equal(finalIranKetabReferenceMediaValue(referenceKey), referenceKey);
  });
}

test("reference keys remain rejected by the book-cover validator", () => {
  assert.throws(
    () => finalIranKetabCoverValue("references/iranketab-author-abcdef0123456789abcd-profile.webp"),
    /کاور ایران‌کتاب معتبر نیست/,
  );
});

test("entity-specific managed reference keys are accepted", () => {
  const keyWithEntityToken = "references/iranketab-translator-abcdef0123456789abcd-0123456789abcdef-profile.webp";
  assert.equal(finalIranKetabReferenceMediaValue(keyWithEntityToken), keyWithEntityToken);
});

test("temporary and malformed reference keys are rejected", () => {
  for (const invalid of [
    "tmp/iranketab-imports/admin/fingerprint/reference-author.webp",
    "references/iranketab-genre-abcdef0123456789abcd-profile.webp",
    "references/iranketab-author-too-short-profile.webp",
    "references/iranketab-author-abcdef0123456789abcd-profile.jpg",
    "/references/iranketab-author-abcdef0123456789abcd-profile.webp",
  ]) {
    assert.throws(
      () => finalIranKetabReferenceMediaValue(invalid),
      /تصویر مرجع ایران‌کتاب معتبر نیست/,
    );
  }
});

test("cover object key resolves to the configured Arvan public URL", () => {
  const old = process.env.S3_PUBLIC_BASE_URL;
  process.env.S3_PUBLIC_BASE_URL = "https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir";
  assert.equal(normalizeCoverImage(key), `https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir/${key}`);
  if (old === undefined) delete process.env.S3_PUBLIC_BASE_URL; else process.env.S3_PUBLIC_BASE_URL = old;
});

test("existing real local uploads remain local", () => {
  assert.equal(normalizeCoverImage("/uploads/books/local.webp"), "/uploads/books/local.webp");
});

test("legacy IranKetab local-looking value resolves through Arvan", () => {
  assert.equal(normalizeCoverImage(`/uploads/${key}`), `https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir/${key}`);
});

test("repair updates only verified affected rows and never uploads", async () => {
  const updated: Array<[string, string]> = [];
  let verificationCalls = 0;
  const result = await repairVerifiedIranKetabCoverPaths({
    rows: [
      { id: "verified", coverImage: `/uploads/${key}` },
      { id: "missing", coverImage: "/uploads/covers/iranketab-missing-0.webp" },
      { id: "local", coverImage: "/uploads/books/local.webp" },
    ],
    objectExists: async (candidate) => { verificationCalls++; return candidate === key; },
    updateCoverImage: async (id, value) => { updated.push([id, value]); },
  });
  assert.deepEqual(updated, [["verified", key]]);
  assert.equal(verificationCalls, 2);
  assert.equal(result.repaired.length, 1);
  assert.equal(result.skipped.length, 2);
});

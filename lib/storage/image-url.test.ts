import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isAllowedPersistedImageUrl,
  isLocalUploadPath,
} from "@/lib/storage/image-url";
import { normalizeMediaUrl } from "@/lib/book/cover";

test("recognizes all supported legacy local upload path forms", () => {
  for (const value of [
    "/uploads/books/a.jpg",
    "uploads/books/a.jpg",
    "public/uploads/books/a.jpg",
    "/app/public/uploads/books/a.jpg",
    "\\uploads\\books\\a.jpg",
  ]) {
    assert.equal(isLocalUploadPath(value), true, value);
    assert.equal(isAllowedPersistedImageUrl(value), false, value);
  }
});

test("allows public S3 and external image URLs", () => {
  assert.equal(
    isAllowedPersistedImageUrl("https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir/covers/a.jpg"),
    true,
  );
  assert.equal(isAllowedPersistedImageUrl("https://example.com/cover.jpg"), true);
  assert.equal(isAllowedPersistedImageUrl(null), true);
});

test("normalizes contributor media keys and preserves full URLs", () => {
  const old = process.env.S3_PUBLIC_BASE_URL;
  process.env.S3_PUBLIC_BASE_URL =
    "https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir";

  assert.equal(
    normalizeMediaUrl(
      "references/iranketab-author-abcdef0123456789abcd-profile.webp",
    ),
    "https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir/references/iranketab-author-abcdef0123456789abcd-profile.webp",
  );
  assert.equal(
    normalizeMediaUrl(
      "https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir/references/profile.webp",
    ),
    "https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir/references/profile.webp",
  );
  assert.equal(normalizeMediaUrl(null), null);

  if (old === undefined) delete process.env.S3_PUBLIC_BASE_URL;
  else process.env.S3_PUBLIC_BASE_URL = old;
});

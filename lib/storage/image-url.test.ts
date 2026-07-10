import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isAllowedPersistedImageUrl,
  isLocalUploadPath,
} from "@/lib/storage/image-url";

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

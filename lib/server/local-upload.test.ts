import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { test } from "node:test";

import { deleteImageFromLocal, UPLOAD_ROOT, uploadImageToLocal } from "@/lib/server/local-upload";

test("local upload creates its nested directory and returns a Next.js public URL", async () => {
  const key = `blog/test-${crypto.randomUUID()}.png`;
  const result = await uploadImageToLocal({
    buffer: Buffer.from("test-image"),
    contentType: "image/png",
    filename: "ignored.png",
    folder: "blog",
    objectKey: key,
  });

  try {
    assert.equal(result.key, key);
    assert.equal(result.url, `/uploads/${key}`);
    await access(`${UPLOAD_ROOT}\\${key.replaceAll("/", "\\")}`);
  } finally {
    await deleteImageFromLocal(key);
  }
});

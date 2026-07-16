import assert from "node:assert/strict";
import test from "node:test";
import { buildCopySource } from "./s3";

test("Arvan path-style CopySource encodes the key but preserves path separators", () => {
  assert.equal(buildCopySource("/tmp/iranketab-imports/admin/abc/avatar é.webp", "bucket"), "bucket/tmp/iranketab-imports/admin/abc/avatar%20%C3%A9.webp");
});

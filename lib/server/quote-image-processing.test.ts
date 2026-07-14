import assert from "node:assert/strict";
import test from "node:test";
import sharp from "sharp";

import { processQuoteImage, QuoteImageProcessingError } from "./quote-image-processing";

test("quote image processing emits contained metadata-free WebP", async () => {
  const source = await sharp({ create: { width: 2400, height: 1200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().withMetadata({ orientation: 6 }).toBuffer();
  const result = await processQuoteImage({ buffer: source, declaredMime: "image/png", filename: "mobile-photo.png" });
  const metadata = await sharp(result.buffer).metadata();
  assert.equal(result.contentType, "image/webp");
  assert.equal(result.filename, "mobile-photo.webp");
  assert.equal(metadata.format, "webp");
  assert.ok((metadata.width ?? 0) <= 2000);
  assert.ok((metadata.height ?? 0) <= 2000);
  assert.equal(metadata.orientation, undefined);
});

test("quote image processing rejects disguised and corrupt files", async () => {
  const png = await sharp({ create: { width: 10, height: 10, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(() => processQuoteImage({ buffer: png, declaredMime: "image/jpeg", filename: "fake.jpg" }), QuoteImageProcessingError);
  await assert.rejects(() => processQuoteImage({ buffer: Buffer.from("not an image"), declaredMime: "image/png", filename: "bad.png" }), QuoteImageProcessingError);
});

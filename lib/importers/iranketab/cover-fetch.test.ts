import assert from "node:assert/strict";
import test from "node:test";
import { fetchIranKetabCoverSecurely, validateIranKetabCoverUrl } from "./cover-fetch";

test("cover URL accepts only trusted IranKetab HTTPS image paths", () => {
  assert.equal(validateIranKetabCoverUrl("https://img.iranketab.ir/Images/ProductImages/a.jpg").hostname, "img.iranketab.ir");
  assert.throws(() => validateIranKetabCoverUrl("http://img.iranketab.ir/Images/ProductImages/a.jpg"));
  assert.throws(() => validateIranKetabCoverUrl("https://evil.example/Images/ProductImages/a.jpg"));
  assert.throws(() => validateIranKetabCoverUrl("https://img.iranketab.ir/other/a.jpg"));
});
test("cover fetch rejects oversized and non-image responses before decoding", async () => {
  await assert.rejects(() => fetchIranKetabCoverSecurely("https://img.iranketab.ir/Images/ProductImages/a.jpg", { lookup: async () => [{ address: "8.8.8.8" }], fetch: async () => new Response("x", { headers: { "content-type": "text/html" } }) }), { code: "INVALID_COVER_CONTENT_TYPE" });
  await assert.rejects(() => fetchIranKetabCoverSecurely("https://img.iranketab.ir/Images/ProductImages/a.jpg", { lookup: async () => [{ address: "8.8.8.8" }], fetch: async () => new Response("x", { headers: { "content-type": "image/jpeg", "content-length": String(11 * 1024 * 1024) } }) }), { code: "COVER_TOO_LARGE" });
});

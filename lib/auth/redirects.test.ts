import assert from "node:assert/strict";
import { test } from "node:test";

import { getPublicAppOrigin, resolveInternalRedirect } from "@/lib/auth/redirects";

test("uses localhost as the development redirect origin", () => {
  assert.equal(getPublicAppOrigin({ NODE_ENV: "development" }), "http://localhost:3000");
});

test("uses the configured public production origin", () => {
  assert.equal(getPublicAppOrigin({ NODE_ENV: "production", NEXT_PUBLIC_APP_URL: "https://qafasehman.ir/" }), "https://qafasehman.ir");
});

test("resolves /books against the public production origin", () => {
  assert.equal(resolveInternalRedirect("/books", "/books", { NODE_ENV: "production", APP_URL: "https://qafasehman.ir" }).toString(), "https://qafasehman.ir/books");
});

test("rejects malicious external redirect attempts", () => {
  const env = { NODE_ENV: "production", APP_URL: "https://qafasehman.ir" };
  assert.equal(resolveInternalRedirect("https://evil.example", "/books", env).toString(), "https://qafasehman.ir/books");
  assert.equal(resolveInternalRedirect("//evil.example", "/books", env).toString(), "https://qafasehman.ir/books");
});

import assert from "node:assert/strict";
import test from "node:test";

import {
  describeAnalyticsContent,
  isAnalyticsBot,
  normalizeAnalyticsPath,
} from "./tracking";

test("analytics normalizes public paths and drops query strings", () => {
  assert.equal(normalizeAnalyticsPath("/authors/ursula?from=feed#books"), "/authors/ursula");
  assert.equal(normalizeAnalyticsPath("https://ghafaseh.ir/blog/hello/?utm=x"), "/blog/hello");
});

test("analytics refuses internal routes and static assets", () => {
  for (const value of ["/api/books", "/admin/stats", "/auth/login", "/dashboard", "/book/private-id/my", "/_next/static/app.js", "/icons/pwa-512.png"]) {
    assert.equal(normalizeAnalyticsPath(value), null, value);
  }
});

test("analytics classifies only supported public content routes", () => {
  assert.deepEqual(describeAnalyticsContent("/authors/octavia-butler"), {
    path: "/authors/octavia-butler",
    contentKind: "author",
    contentSlug: "octavia-butler",
  });
  assert.deepEqual(describeAnalyticsContent("/book/a-book-id"), {
    path: "/book/a-book-id",
    contentKind: "book",
    contentSlug: "a-book-id",
  });
  assert.equal(describeAnalyticsContent("/explore").contentKind, null);
});

test("analytics filters common automated user agents", () => {
  assert.equal(isAnalyticsBot("Mozilla/5.0 (compatible; Googlebot/2.1)"), true);
  assert.equal(isAnalyticsBot("Mozilla/5.0 Safari/605.1"), false);
});

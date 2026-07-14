import assert from "node:assert/strict";
import test from "node:test";
import { parseImportHistoryQuery } from "./history-query";
test("history query parses filters, pagination and search", () => {
  const query = parseImportHistoryQuery(
    new URLSearchParams({
      page: "3",
      status: "FAILED",
      adminId: " admin ",
      q: " book/123 ",
      from: "2026-01-01",
    }),
  );
  assert.equal(query.page, 3);
  assert.equal(query.status, "FAILED");
  assert.equal(query.adminId, "admin");
  assert.equal(query.q, "book/123");
  assert.ok(query.from instanceof Date);
});
test("history query rejects invalid values", () => {
  const query = parseImportHistoryQuery(
    new URLSearchParams({ page: "-2", status: "ROOT", from: "bad" }),
  );
  assert.equal(query.page, 1);
  assert.equal(query.status, undefined);
  assert.equal(query.from, undefined);
});

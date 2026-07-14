import assert from "node:assert/strict";
import test from "node:test";
import {
  assertTransition,
  canTransition,
  classifyRetryable,
  safeAuditJson,
} from "./session-lifecycle";
test("session lifecycle allows forward and retry transitions", () => {
  assert.equal(canTransition("CREATED", "EXTRACTING"), true);
  assert.equal(canTransition("FAILED", "COMMITTING"), true);
  assert.equal(canTransition("SUCCESS", "EXTRACTING"), false);
  assert.throws(() => assertTransition("CANCELLED", "DRAFT_REVIEW"));
});
test("retry classification separates temporary and data conflicts", () => {
  assert.equal(classifyRetryable("FETCH_TIMEOUT"), true);
  assert.equal(classifyRetryable("ISBN_CONFLICT"), false);
});
test("audit metadata strips sensitive fields", () => {
  assert.deepEqual(
    safeAuditJson({
      code: "x",
      rawHtml: "secret",
      stack: "path",
      nested: { password: "x", safe: true },
    }),
    { code: "x", nested: { safe: true } },
  );
});

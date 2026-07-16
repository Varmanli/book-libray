import assert from "node:assert/strict";
import test from "node:test";
import { isOwnedTemporaryCoverKey, temporaryCoverPrefix } from "./cover-preparation";

const admin = "admin-1";
const fingerprint = "a".repeat(64);
const sessionA = "session-a";
const sessionB = "session-b";
const keyA = `${temporaryCoverPrefix(admin, fingerprint, sessionA)}reference-author-a-profile-1.webp`;

test("staged media keys are exact-session scoped and cannot be reused by a newer session", () => {
  assert.ok(isOwnedTemporaryCoverKey(keyA, admin, fingerprint, sessionA));
  assert.equal(isOwnedTemporaryCoverKey(keyA, admin, fingerprint, sessionB), false);
});

test("cleanup ownership cannot include another active session's files", () => {
  const keyB = `${temporaryCoverPrefix(admin, fingerprint, sessionB)}reference-translator-b-profile-1.webp`;
  const requested = [keyA, keyB];
  const deletable = requested.filter((key) => isOwnedTemporaryCoverKey(key, admin, fingerprint, sessionA));
  assert.deepEqual(deletable, [keyA]);
});

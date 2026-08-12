import assert from "node:assert/strict";
import test from "node:test";

import { executeIranKetabDiscoveryRunRequest } from "./run-request";

test("manual discovery endpoint workflow sends the requested source to the runner", async () => {
  const calls: string[] = [];
  const result = await executeIranKetabDiscoveryRunRequest(
    { sourceId: "source-123" },
    {
      runManualDiscoverySource: async (sourceId) => {
        calls.push(sourceId);
        return { sourceId, status: "SUCCEEDED" };
      },
      runScheduledDiscovery: async () => {
        throw new Error("scheduler should not be called for a source-specific request");
      },
    },
  );

  assert.equal(result.ok, true);
  assert.deepEqual(calls, ["source-123"]);
  if (result.ok) {
    assert.equal(result.manual, true);
    assert.deepEqual(result.result, { sourceId: "source-123", status: "SUCCEEDED" });
  }
});

test("run request rejects an invalid source id before execution", async () => {
  const result = await executeIranKetabDiscoveryRunRequest(
    { sourceId: "" },
    {
      runManualDiscoverySource: async () => { throw new Error("must not run"); },
      runScheduledDiscovery: async () => { throw new Error("must not run"); },
    },
  );
  assert.deepEqual(result, { ok: false, code: "VALIDATION_ERROR" });
});

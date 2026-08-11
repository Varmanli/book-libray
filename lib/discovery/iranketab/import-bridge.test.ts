import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const bridgePath = path.join(process.cwd(), "lib/discovery/iranketab/import-bridge.ts");

test("approved candidate starts the shared importer preview and records its linked session", async () => {
  const bridge = await readFile(bridgePath, "utf8");
  assert.match(bridge, /export async function startDiscoveryImport\(discoveryItemId: string, actorId: string\)/);
  assert.match(bridge, /eq\(IranKetabDiscoveryItem\.status, "QUEUED"\)/);
  assert.match(bridge, /createIranKetabPreviewPost/);
  assert.match(bridge, /importSessionId: session\.id/);
  assert.match(bridge, /status: "IMPORTING"/);
});

test("bridge reuses an active linked import instead of creating a duplicate session", async () => {
  const bridge = await readFile(bridgePath, "utf8");
  assert.match(bridge, /item\.importSessionId && item\.status === "IMPORTING"/);
  assert.match(bridge, /getImportSession\(item\.importSessionId\)/);
  assert.match(bridge, /reused: true/);
  assert.match(bridge, /DISCOVERY_IMPORT_ALREADY_RUNNING/);
});

test("preview failures persist failure state and retry information on the discovery item", async () => {
  const bridge = await readFile(bridgePath, "utf8");
  assert.match(bridge, /markDiscoveryItemFailed\(item\.id, code, message, createdSessionId\)/);
  assert.match(bridge, /status: "FAILED"/);
  assert.match(bridge, /retryCount: sql`\$\{IranKetabDiscoveryItem\.retryCount\} \+ 1`/);
});

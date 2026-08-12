import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();
const candidate = path.join(root, "lib/discovery/iranketab/candidate-service.ts");
const commitService = path.join(root, "lib/importers/iranketab/commit-service.ts");
const start = path.join(root, "app/api/admin/iranketab-discovery/items/[id]/start-import/route.ts");

test("NEEDS_REVIEW approval requires an existing PREVIEW_READY session", async () => {
  const source = await readFile(candidate, "utf8");
  assert.match(source, /if \(item\.status !== "NEEDS_REVIEW"\)/);
  assert.match(source, /session\.session\.status !== "PREVIEW_READY"/);
  assert.match(source, /status: "APPROVED"/);
  assert.match(source, /DISCOVERY_INVALID_TRANSITION/);
});

test("only an approved discovery candidate can enter the existing importer commit", async () => {
  const source = await readFile(candidate, "utf8");
  const service = await readFile(commitService, "utf8");
  assert.match(source, /eq\(IranKetabDiscoveryItem\.status, "APPROVED"\)/);
  assert.match(source, /status: "IMPORTING"/);
  assert.match(service, /await beginApprovedDiscoveryCommit\(input\.sessionId\)/);
  assert.match(service, /await completeDiscoveryCommit\(input\.sessionId, result\.catalog\.id\)/);
});

test("a rejected or duplicate discovery commit never creates a catalog book", async () => {
  const candidate = await readFile(path.join(root, "lib/discovery/iranketab/candidate-service.ts"), "utf8");
  const service = await readFile(commitService, "utf8");
  assert.match(service, /error instanceof IranKetabDiscoveryCandidateError/);
  assert.match(candidate, /DISCOVERY_IMPORT_NOT_APPROVED/);
  assert.match(service, /await failDiscoveryCommit\(/);
});

test("start-import only opens the existing human review workflow after approval", async () => {
  const source = await readFile(start, "utf8");
  assert.match(source, /item\.status !== "APPROVED"/);
  assert.match(source, /session\.session\.adminId !== gate\.user\.id/);
  assert.match(source, /reviewUrl: "\/admin\/books\/import-links"/);
});

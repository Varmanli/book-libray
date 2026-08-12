import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

test("manual route delegates all commit business logic to the shared service", async () => {
  const [route, service] = await Promise.all([
    readFile(path.join(process.cwd(), "app/api/admin/books/import-links/commit/route.ts"), "utf8"),
    readFile(path.join(process.cwd(), "lib/importers/iranketab/commit-service.ts"), "utf8"),
  ]);
  assert.match(route, /commitIranKetabImportSession/);
  assert.match(service, /reprepareMissingIranKetabMedia/);
  assert.match(service, /saveImportDraft/);
  assert.match(service, /commitIranKetabImport\(/);
  assert.match(service, /IMPORT_ALREADY_COMPLETED|COMMIT_STARTED/);
  assert.match(service, /persistPreparedImportDraft/);
  assert.match(service, /persisted\.session\.status !== "PREVIEW_READY"/);
  assert.match(service, /summary\?\.readiness !== "READY_FOR_REVIEW"/);
  assert.match(service, /AUTO_IMPORT_REVIEW_REQUIRED/);
  assert.match(service, /"COVER_PREPARATION"/);
  assert.match(service, /"READY_TO_COMMIT"/);
});

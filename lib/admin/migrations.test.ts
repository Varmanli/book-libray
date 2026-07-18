import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("drizzle/0027_admin_content_timestamps.sql", "utf8");
const importerMigration = readFileSync(
  "drizzle/0028_iranketab_import_sessions.sql",
  "utf8",
);
const journal = JSON.parse(
  readFileSync("drizzle/meta/_journal.json", "utf8"),
) as { entries: Array<{ idx: number; tag: string }> };

test("quote timestamp and owner migration backfills before NOT NULL", () => {
  const update = migration.indexOf('UPDATE "Quote"');
  assert.ok(update > migration.indexOf('ADD COLUMN IF NOT EXISTS "created_at"'));
  assert.ok(migration.indexOf('ALTER COLUMN "created_at" SET NOT NULL') > update);
  assert.ok(migration.indexOf('ALTER COLUMN "user_id" SET NOT NULL') > migration.indexOf('SET "user_id" = b."user_id"'));
});

test("quote migration is additive and carries query indexes", () => {
  assert.doesNotMatch(migration, /DROP TABLE|TRUNCATE|DELETE FROM/i);
  assert.match(migration, /Quote_user_id_idx/);
  assert.match(migration, /Quote_created_at_idx/);
  assert.match(migration, /PublishedBookNote_updated_at_idx/);
});

test("IranKetab session migration follows the journal without a duplicate sequence", () => {
  const indexes = journal.entries.map((entry) => entry.idx);
  const tags = journal.entries.map((entry) => entry.tag);
  assert.equal(new Set(indexes).size, indexes.length);
  assert.equal(new Set(tags).size, tags.length);
  assert.deepEqual(indexes, indexes.map((_, index) => index));
  assert.equal(tags[indexes.indexOf(28)], "0028_iranketab_import_sessions");
  assert.ok(tags.indexOf("0028_iranketab_import_sessions") >= 0);
});

test("IranKetab session migration is additive and defines recovery indexes", () => {
  assert.doesNotMatch(importerMigration, /DROP\s|TRUNCATE\s|DELETE\s+FROM/i);
  assert.match(importerMigration, /IranKetabImportSession_admin_idx/);
  assert.match(importerMigration, /IranKetabImportSession_canonical_idx/);
  assert.match(importerMigration, /IranKetabImportEvent_session_idx/);
});

test("IranKetab preview-operation migration is journaled and has durable identity indexes", () => {
  const previewMigration = readFileSync("drizzle/0033_iranketab_preview_operations.sql", "utf8");
  assert.ok(journal.entries.some((entry) => entry.tag === "0033_iranketab_preview_operations"));
  assert.match(previewMigration, /IranKetabPreviewOperation_source_identity_unique/);
  assert.match(previewMigration, /IranKetabPreviewOperation_reclaim_idx/);
  assert.doesNotMatch(previewMigration, /DROP\s|TRUNCATE\s|DELETE\s+FROM/i);
});

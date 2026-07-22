import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { PRODUCTION_MIGRATION_BASELINE, assertUnchangedTargetFingerprint, validatePreflight } from "../../scripts/migration-preflight.mjs";

const migration = readFileSync("drizzle/0027_admin_content_timestamps.sql", "utf8");
const importerMigration = readFileSync(
  "drizzle/0028_iranketab_import_sessions.sql",
  "utf8",
);
const journal = JSON.parse(
  readFileSync("drizzle/meta/_journal.json", "utf8"),
) as { entries: Array<{ idx: number; tag: string; when: number }> };

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

test("every committed SQL migration is represented exactly once in the Drizzle journal", () => {
  const tags = journal.entries.map((entry) => entry.tag);
  assert.equal(new Set(tags).size, tags.length);
  for (const tag of tags) {
    assert.ok(existsSync(`drizzle/${tag}.sql`), `missing SQL file for ${tag}`);
  }

  const sqlMigrationTags = readdirSync("drizzle")
    .filter((name) => /^\d+_.+\.sql$/.test(name))
    .map((name) => name.slice(0, -".sql".length));
  assert.deepEqual(sqlMigrationTags.sort(), [...tags].sort());
});

test("production image backs up, migrates, verifies, then starts Next.js", () => {
  const dockerfile = readFileSync("Dockerfile", "utf8");
  const entrypoint = readFileSync("docker-entrypoint.sh", "utf8");

  assert.match(entrypoint, /set -eu/);
  assert.match(entrypoint, /DATABASE_URL is required/);
  assert.match(entrypoint, /JWT_SECRET is required/);
  assert.match(entrypoint, /run-production-migrations\.mjs preflight/);
  assert.match(entrypoint, /backup-production-db\.mjs/);
  assert.match(entrypoint, /npm run db:migrate/);
  assert.match(entrypoint, /run-production-migrations\.mjs postflight/);
  assert.match(entrypoint, /RUN_MIGRATION_BASELINE/);
  assert.match(entrypoint, /baseline-production-migrations\.mjs/);
  assert.match(entrypoint, /exec "\$@"/);
  const normalPreflight = entrypoint.lastIndexOf("preflight");
  const normalBackup = entrypoint.lastIndexOf("backup-production-db");
  assert.ok(normalPreflight < normalBackup);
  assert.ok(normalBackup < entrypoint.indexOf("npm run db:migrate"));
  assert.ok(entrypoint.indexOf("npm run db:migrate") < entrypoint.indexOf("postflight"));
  assert.ok(entrypoint.indexOf("postflight") < entrypoint.indexOf('exec "$@"'));
  assert.match(dockerfile, /http:\/\/127\.0\.0\.1:3000\//);
  assert.match(dockerfile, /\/app\/scripts\/run-production-migrations\.mjs/);
  assert.match(dockerfile, /\/app\/drizzle/);
  assert.match(dockerfile, /postgresql-client/);
  assert.match(dockerfile, /\/app\/node_modules/);
  assert.doesNotMatch(entrypoint, /db:push/);
  assert.match(dockerfile, /migration-manifest/);
});

function preflightFixture(overrides: Partial<{ ledgerRows: Array<{ id: number; hash: string; created_at: number }> }> = {}) {
  const entries = journal.entries.map((entry) => ({ ...entry, hash: `hash-${entry.idx}` }));
  return {
    journalEntries: entries,
    ledgerRows: entries.slice(0, journal.entries.findIndex((entry) => entry.tag === PRODUCTION_MIGRATION_BASELINE) + 1).map((entry, index) => ({ id: index + 1, hash: entry.hash, created_at: entry.when })),
    canonicalTablesExist: true,
    ...overrides,
  };
}

test("production preflight permits only migrations newer than the production baseline", () => {
  const result = validatePreflight(preflightFixture());
  assert.equal(result.latestEntry.tag, PRODUCTION_MIGRATION_BASELINE);
  assert.deepEqual(result.pending.map((entry: { tag: string }) => entry.tag), ["0034_reading_progress", "0035_personal_book_notes", "0036_reading_history", "0037_public_book_thoughts"]);
});

test("production preflight refuses empty or incomplete historical ledgers", () => {
  assert.throws(() => validatePreflight(preflightFixture({ ledgerRows: [] })), /ledger is empty/);
  assert.throws(() => validatePreflight(preflightFixture({ ledgerRows: preflightFixture().ledgerRows.slice(0, 1) })), /historical migration is unexpectedly pending/);
});

test("production preflight refuses historical hash mismatches and a missing baseline", () => {
  const mismatch = preflightFixture();
  mismatch.ledgerRows[0].hash = "wrong";
  assert.throws(() => validatePreflight(mismatch), /not an exact runtime migration match/);
  const noBaseline = preflightFixture();
  noBaseline.journalEntries = noBaseline.journalEntries.filter((entry) => entry.tag !== PRODUCTION_MIGRATION_BASELINE);
  assert.throws(() => validatePreflight(noBaseline), /0033_iranketab_preview_operations is missing/);
});

test("production preflight refuses a database target that changes before execution", () => {
  assert.doesNotThrow(() => assertUnchangedTargetFingerprint("same", "same"));
  assert.throws(() => assertUnchangedTargetFingerprint("first", "second"), /DATABASE_URL changed/);
});

test("migration-history inspection derives the same hash and timestamp semantics as Drizzle", () => {
  const inspector = readFileSync("scripts/inspect-drizzle-migration-history.mjs", "utf8");
  const drizzleMigrator = readFileSync("node_modules/drizzle-orm/migrator.js", "utf8");
  const pgDialect = readFileSync("node_modules/drizzle-orm/pg-core/dialect.js", "utf8");

  assert.match(inspector, /createHash\("sha256"\)\.update\(sql\)\.digest\("hex"\)/);
  assert.match(inspector, /BEGIN READ ONLY/);
  assert.match(inspector, /safeToMarkApplied: false/);
  assert.match(drizzleMigrator, /createHash\("sha256"\)\.update\(query\)\.digest\("hex"\)/);
  assert.match(pgDialect, /order by created_at desc limit 1/);
  assert.match(pgDialect, /lastDbMigration\.created_at\) < migration\.folderMillis/);
});

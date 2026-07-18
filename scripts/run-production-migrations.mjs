import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import pg from "pg";

import { NEXT_MIGRATION_TAG, assertUnchangedTargetFingerprint, validatePreflight } from "./migration-preflight.mjs";

const MIGRATION_LOCK_NAME = "ghafaseh:drizzle:migrations";
const DEFAULT_LOCK_TIMEOUT_MS = 90_000;
const LOCK_RETRY_MS = 1_000;
const hash = (value) => createHash("sha256").update(value).digest("hex");

function getLockTimeoutMs() {
  const value = Number.parseInt(process.env.DATABASE_MIGRATION_LOCK_TIMEOUT_MS ?? "", 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 300_000) : DEFAULT_LOCK_TIMEOUT_MS;
}

function targetDetails(databaseUrl) {
  const parsed = new URL(databaseUrl);
  if (!/^postgres(ql)?:$/.test(parsed.protocol) || !parsed.hostname || !parsed.pathname.replace(/^\/+/, "")) {
    throw new Error("DATABASE_URL must positively identify a PostgreSQL host and database.");
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  const sslmode = parsed.searchParams.get("sslmode") ?? (parsed.searchParams.get("ssl") === "true" ? "require" : "unspecified");
  return { host: parsed.hostname, port: parsed.port || "5432", database, sslmode, fingerprint: hash(databaseUrl), sanitized: `${parsed.hostname}:${parsed.port || "5432"}/${database}?sslmode=${sslmode}` };
}

async function readArtifacts(migrationRoot) {
  const drizzle = join(migrationRoot, "drizzle");
  const journalPath = join(drizzle, "meta", "_journal.json");
  const manifestPath = join(migrationRoot, "migration-manifest.json");
  await Promise.all([access(journalPath), access(join(migrationRoot, "drizzle.config.ts")), access(join(migrationRoot, "db", "schema.ts")), access(manifestPath)]);
  const [journalBytes, manifestBytes] = await Promise.all([readFile(journalPath), readFile(manifestPath)]);
  const journal = JSON.parse(journalBytes);
  const manifest = JSON.parse(manifestBytes);
  if (!Array.isArray(journal.entries)) throw new Error("Migration journal has no entries.");
  const entries = await Promise.all(journal.entries.map(async (entry) => {
    const bytes = await readFile(join(drizzle, `${entry.tag}.sql`));
    return { ...entry, hash: hash(bytes) };
  }));
  const latest = entries.at(-1);
  if (!latest || latest.tag !== NEXT_MIGRATION_TAG) throw new Error(`Runtime journal must end with ${NEXT_MIGRATION_TAG}.`);
  if (manifest.journalEntries !== entries.length || manifest.latestMigration !== latest.tag || manifest.journalSha256 !== hash(journalBytes) || manifest.latestMigrationSha256 !== latest.hash) {
    throw new Error("Runtime migration manifest does not match journal artifacts.");
  }
  const expectedCommit = process.env.EXPECTED_RELEASE_SHA ?? process.env.RELEASE_COMMIT_SHA;
  if (expectedCommit && manifest.releaseCommit !== "unknown" && manifest.releaseCommit !== expectedCommit) {
    throw new Error("Runtime release commit does not match EXPECTED_RELEASE_SHA.");
  }
  return { entries, manifest };
}

function runMigrations(migrationRoot, databaseUrl) {
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  return new Promise((resolvePromise, reject) => {
    const child = spawn(npm, ["run", "db:migrate"], { cwd: migrationRoot, env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => code === 0 ? resolvePromise() : reject(new Error(`npm run db:migrate exited with ${signal ? `signal ${signal}` : `code ${code ?? "unknown"}`}.`)));
  });
}

const delay = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
async function acquireMigrationLock(client, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  do {
    const result = await client.query("SELECT pg_try_advisory_lock(hashtext($1)) AS acquired", [MIGRATION_LOCK_NAME]);
    if (result.rows[0]?.acquired) return;
    await delay(LOCK_RETRY_MS);
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting ${timeoutMs}ms for the production migration lock.`);
}

async function readPreflight(client, entries) {
  await client.query("BEGIN READ ONLY");
  try {
    const [identity, ledger, canonical] = await Promise.all([
      client.query("select current_database(), current_user, version()"),
      client.query("select id, hash, created_at from drizzle.__drizzle_migrations order by created_at"),
      client.query("select exists(select 1 from information_schema.tables where table_schema='public' and table_name in ('Book','User','BookEdition','CatalogBook')) as exists"),
    ]);
    await client.query("ROLLBACK");
    return { identity: identity.rows[0], ledgerRows: ledger.rows, canonicalTablesExist: canonical.rows[0].exists, ...validatePreflight({ journalEntries: entries, ledgerRows: ledger.rows, canonicalTablesExist: canonical.rows[0].exists }) };
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
}

async function readPostflight(client, beforeLedgerRows, pending, nextEntry, bookFormatColumns) {
  const [ledger, objects, bookFormat] = await Promise.all([
    client.query("select id, hash, created_at from drizzle.__drizzle_migrations order by created_at"),
    client.query("select to_regtype('public.\"IranKetabPreviewOperationStatus\"') as enum_type, to_regclass('public.\"IranKetabPreviewOperation\"') as table_name, exists(select 1 from pg_constraint where conname='IranKetabPreviewOperation_source_identity_unique') as unique_constraint, exists(select 1 from pg_indexes where schemaname='public' and indexname='IranKetabPreviewOperation_reclaim_idx') as reclaim_index"),
    client.query("select c.relname as table_name, a.attname as column_name, t.typname as type_name from pg_depend d join pg_type t on t.oid=d.refobjid join pg_class c on c.oid=d.objid join pg_attribute a on a.attrelid=c.oid and a.attnum=d.objsubid where t.typname='BookFormat' and c.relname in ('Book','BookEdition') order by c.relname,a.attname"),
  ]);
  const expectedRows = beforeLedgerRows.length + (pending.length ? 1 : 0);
  if (ledger.rows.length !== expectedRows || !ledger.rows.some((row) => Number(row.created_at) === Number(nextEntry.when) && row.hash === nextEntry.hash)) throw new Error("Post-migration verification failed: ledger did not record exactly 0033.");
  const result = objects.rows[0];
  if (!result.enum_type || !result.table_name || !result.unique_constraint || !result.reclaim_index) throw new Error("Post-migration verification failed: 0033 objects are incomplete.");
  if (JSON.stringify(bookFormat.rows) !== JSON.stringify(bookFormatColumns)) throw new Error("Post-migration verification failed: BookFormat dependents changed.");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required before production migrations can run.");
  const target = targetDetails(databaseUrl);
  const migrationRoot = resolve(process.env.MIGRATION_WORKDIR ?? process.cwd());
  const artifacts = await readArtifacts(migrationRoot);
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  let locked = false;
  try {
    await acquireMigrationLock(client, getLockTimeoutMs()); locked = true;
    const bookFormat = await client.query("select c.relname as table_name, a.attname as column_name, t.typname as type_name from pg_depend d join pg_type t on t.oid=d.refobjid join pg_class c on c.oid=d.objid join pg_attribute a on a.attrelid=c.oid and a.attnum=d.objsubid where t.typname='BookFormat' and c.relname in ('Book','BookEdition') order by c.relname,a.attname");
    const preflight = await readPreflight(client, artifacts.entries);
    if (preflight.identity.current_database !== target.database) throw new Error("Migration refused: configured DATABASE_URL database does not match connected database.");
    console.log(`[migrations] release_commit=${artifacts.manifest.releaseCommit}`);
    console.log(`[migrations] build_id=${artifacts.manifest.buildId}`);
    console.log(`[migrations] database_target=${target.sanitized}`);
    console.log(`[migrations] database_fingerprint=${target.fingerprint}`);
    console.log(`[migrations] ledger_rows=${preflight.ledgerRows.length}`);
    console.log(`[migrations] latest_recorded=${preflight.latestEntry.tag}`);
    console.log(`[migrations] journal_rows=${artifacts.entries.length}`);
    console.log(`[migrations] latest_journal=${artifacts.entries.at(-1).tag}`);
    console.log(`[migrations] pending=${preflight.pending.map((entry) => entry.tag).join(",") || "none"}`);
    console.log("[migrations] historical_hashes=verified");
    assertUnchangedTargetFingerprint(target.fingerprint, targetDetails(databaseUrl).fingerprint);
    await runMigrations(migrationRoot, databaseUrl);
    await readPostflight(client, preflight.ledgerRows, preflight.pending, artifacts.entries.find((entry) => entry.tag === NEXT_MIGRATION_TAG), bookFormat.rows);
    console.log("[migrations] postflight=verified");
  } finally { if (locked) await client.query("SELECT pg_advisory_unlock(hashtext($1))", [MIGRATION_LOCK_NAME]); await client.end(); }
}

void main().catch((error) => { console.error(`[migrations] failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });

/**
 * Deliberate recovery for a database whose schema predates Drizzle's ledger.
 * It writes only drizzle.__drizzle_migrations; it never executes migration SQL.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const LOCK_NAME = "ghafaseh:drizzle:ledger-repair";

function refuse(message) { throw new Error(`Ledger repair refused: ${message}`); }
function target(url) {
  const parsed = new URL(url);
  if (!/^postgres(ql)?:$/.test(parsed.protocol) || !parsed.hostname || !parsed.pathname.slice(1)) refuse("DATABASE_URL must identify a PostgreSQL database");
  const sslmode = parsed.searchParams.get("sslmode") ?? (parsed.searchParams.get("ssl") === "true" ? "require" : "unspecified");
  return { fingerprint: digest(url), sanitized: `${parsed.hostname}:${parsed.port || "5432"}/${decodeURIComponent(parsed.pathname.slice(1))}?sslmode=${sslmode}` };
}

async function journalEntries(root) {
  const journal = JSON.parse(await readFile(join(root, "drizzle", "meta", "_journal.json"), "utf8"));
  if (!Array.isArray(journal.entries) || !journal.entries.length) refuse("migration journal is empty");
  const entries = await Promise.all(journal.entries.map(async (entry) => ({ ...entry, hash: digest(await readFile(join(root, "drizzle", `${entry.tag}.sql`))) })));
  if (new Set(entries.map((entry) => entry.tag)).size !== entries.length || new Set(entries.map((entry) => Number(entry.when))).size !== entries.length) refuse("migration journal contains duplicate tags or timestamps");
  return entries;
}

export function validateRepairPreconditions({ journalEntries, ledgerRows, canonicalTablesExist }) {
  if (!Array.isArray(journalEntries) || !journalEntries.length) refuse("migration journal is empty");
  if (!Array.isArray(ledgerRows)) refuse("Drizzle ledger could not be read");
  if (ledgerRows.length) refuse("Drizzle ledger is not empty");
  if (!canonicalTablesExist) refuse("canonical application tables are absent; ledger repair is forbidden on a new or incomplete database");
}

async function createBackup(root) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [join(root, "scripts", "backup-production-db.mjs")], { stdio: "inherit", env: process.env });
    child.once("error", (error) => reject(new Error(`backup could not start: ${error.message}`)));
    child.once("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`backup failed with exit code ${code ?? "unknown"}`)));
  });
}

async function ledgerRows(client) {
  const exists = await client.query("select to_regclass('drizzle.__drizzle_migrations') as name");
  if (!exists.rows[0]?.name) refuse("Drizzle ledger drizzle.__drizzle_migrations is absent; this repair never creates it");
  const columns = await client.query("select column_name, data_type from information_schema.columns where table_schema='drizzle' and table_name='__drizzle_migrations'");
  const actual = new Map(columns.rows.map((row) => [row.column_name, row.data_type]));
  if (actual.get("id") !== "integer" || actual.get("hash") !== "text" || actual.get("created_at") !== "bigint") refuse("Drizzle ledger does not match the installed id/hash/created_at format");
  return (await client.query("select id, hash, created_at from drizzle.__drizzle_migrations order by created_at, id")).rows;
}

async function canonicalTablesExist(client) {
  const result = await client.query("select count(*)::int as count from information_schema.tables where table_schema='public' and table_name in ('User','Book','CatalogBook','BookEdition')");
  return result.rows[0]?.count === 4;
}

async function main() {
  if (process.env.ALLOW_MIGRATION_LEDGER_REPAIR !== "true" || process.env.RUN_MIGRATION_LEDGER_REPAIR !== "true") refuse("set ALLOW_MIGRATION_LEDGER_REPAIR=true and RUN_MIGRATION_LEDGER_REPAIR=true");
  const databaseUrl = process.env.DATABASE_URL; if (!databaseUrl) refuse("DATABASE_URL is required");
  const dbTarget = target(databaseUrl);
  if (!process.env.EXPECTED_DATABASE_TARGET || !process.env.EXPECTED_DATABASE_FINGERPRINT) refuse("EXPECTED_DATABASE_TARGET and EXPECTED_DATABASE_FINGERPRINT are required");
  if (process.env.EXPECTED_DATABASE_TARGET !== dbTarget.sanitized) refuse("database target does not match EXPECTED_DATABASE_TARGET");
  if (process.env.EXPECTED_DATABASE_FINGERPRINT !== dbTarget.fingerprint) refuse("database fingerprint does not match EXPECTED_DATABASE_FINGERPRINT");
  const root = resolve(process.env.MIGRATION_WORKDIR ?? process.cwd());
  const entries = await journalEntries(root);
  const client = new pg.Client({ connectionString: databaseUrl }); await client.connect();
  try {
    validateRepairPreconditions({ journalEntries: entries, ledgerRows: await ledgerRows(client), canonicalTablesExist: await canonicalTablesExist(client) });
    console.log(`[ledger-repair] target=${dbTarget.sanitized} fingerprint=${dbTarget.fingerprint}`);
    console.log("[ledger-repair] preconditions passed; creating database backup before ledger-only repair...");
    await createBackup(root);
    const lock = await client.query("select pg_try_advisory_lock(hashtext($1)) as locked", [LOCK_NAME]);
    if (!lock.rows[0]?.locked) refuse("another migration or ledger repair process is active");
    await client.query("BEGIN");
    try {
      validateRepairPreconditions({ journalEntries: entries, ledgerRows: await ledgerRows(client), canonicalTablesExist: await canonicalTablesExist(client) });
      for (const entry of entries) await client.query("insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)", [entry.hash, entry.when]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
    console.log(`[ledger-repair] inserted=${entries.length} through=${entries.at(-1).tag}; historical SQL was not executed.`);
  } finally {
    await client.query("select pg_advisory_unlock(hashtext($1))", [LOCK_NAME]).catch(() => {});
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) void main().catch((error) => { console.error(`[ledger-repair] failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });

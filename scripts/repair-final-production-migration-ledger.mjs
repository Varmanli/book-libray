/**
 * Final audited legacy-ledger repair. Records only 0000..0037 so Drizzle can
 * execute 0038_production_schema_reconciliation normally afterwards.
 */
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import pg from "pg";

const LEGACY_FINAL_TAG = "0037_public_book_thoughts";
const LOCK_NAME = "ghafaseh:drizzle:final-ledger-repair";
const digest = (value) => createHash("sha256").update(value).digest("hex");
function refuse(message) { throw new Error(`Final ledger repair refused: ${message}`); }
function target(url) {
  const parsed = new URL(url);
  if (!/^postgres(ql)?:$/.test(parsed.protocol) || !parsed.hostname || !parsed.pathname.slice(1)) refuse("DATABASE_URL must identify a PostgreSQL database");
  const sslmode = parsed.searchParams.get("sslmode") ?? (parsed.searchParams.get("ssl") === "true" ? "require" : "unspecified");
  return { fingerprint: digest(url), sanitized: `${parsed.hostname}:${parsed.port || "5432"}/${decodeURIComponent(parsed.pathname.slice(1))}?sslmode=${sslmode}` };
}
async function legacyEntries(root) {
  const journal = JSON.parse(await readFile(join(root, "drizzle", "meta", "_journal.json"), "utf8"));
  if (!Array.isArray(journal.entries)) refuse("migration journal is malformed");
  const last = journal.entries.findIndex((entry) => entry.tag === LEGACY_FINAL_TAG);
  if (last !== 37 || journal.entries.length <= last || journal.entries[last + 1]?.tag !== "0038_production_schema_reconciliation") refuse(`journal must contain ${LEGACY_FINAL_TAG} followed by 0038_production_schema_reconciliation`);
  const entries = await Promise.all(journal.entries.slice(0, last + 1).map(async (entry) => ({ ...entry, hash: digest(await readFile(join(root, "drizzle", `${entry.tag}.sql`))) })));
  if (new Set(entries.map((entry) => entry.tag)).size !== entries.length || new Set(entries.map((entry) => Number(entry.when))).size !== entries.length) refuse("legacy journal contains duplicate tags or timestamps");
  return entries;
}
export function validateFinalRepairPreconditions({ entries, ledgerRows, canonicalTablesExist }) {
  if (!Array.isArray(entries) || entries.length !== 38 || entries.at(-1)?.tag !== LEGACY_FINAL_TAG) refuse("expected exactly the audited 0000 through 0037 legacy journal range");
  if (!Array.isArray(ledgerRows)) refuse("Drizzle ledger could not be read");
  if (ledgerRows.length) refuse("Drizzle ledger is not empty");
  if (!canonicalTablesExist) refuse("canonical application tables are absent; final repair is forbidden");
}
async function backup(root) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [join(root, "scripts", "backup-production-db.mjs")], { stdio: "inherit", env: process.env });
    child.once("error", (error) => reject(new Error(`backup could not start: ${error.message}`)));
    child.once("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`backup failed with exit code ${code ?? "unknown"}`)));
  });
}
async function ledgerRows(client) {
  const table = await client.query("select to_regclass('drizzle.__drizzle_migrations') as name");
  if (!table.rows[0]?.name) refuse("Drizzle ledger drizzle.__drizzle_migrations is absent; this repair never creates it");
  const columns = await client.query("select column_name, data_type from information_schema.columns where table_schema='drizzle' and table_name='__drizzle_migrations'");
  const shape = new Map(columns.rows.map((row) => [row.column_name, row.data_type]));
  if (shape.get("id") !== "integer" || shape.get("hash") !== "text" || shape.get("created_at") !== "bigint") refuse("Drizzle ledger does not match the installed id/hash/created_at format");
  return (await client.query("select id, hash, created_at from drizzle.__drizzle_migrations order by created_at, id")).rows;
}
async function canonicalTablesExist(client) {
  const result = await client.query("select count(*)::int as count from information_schema.tables where table_schema='public' and table_name in ('User','Book','CatalogBook','BookEdition')");
  return result.rows[0]?.count === 4;
}
async function main() {
  if (process.env.ALLOW_MIGRATION_LEDGER_FINAL_REPAIR !== "true" || process.env.RUN_MIGRATION_LEDGER_FINAL_REPAIR !== "true") refuse("set ALLOW_MIGRATION_LEDGER_FINAL_REPAIR=true and RUN_MIGRATION_LEDGER_FINAL_REPAIR=true");
  const databaseUrl = process.env.DATABASE_URL; if (!databaseUrl) refuse("DATABASE_URL is required");
  const dbTarget = target(databaseUrl);
  if (!process.env.EXPECTED_DATABASE_TARGET || !process.env.EXPECTED_DATABASE_FINGERPRINT) refuse("EXPECTED_DATABASE_TARGET and EXPECTED_DATABASE_FINGERPRINT are required");
  if (process.env.EXPECTED_DATABASE_TARGET !== dbTarget.sanitized || process.env.EXPECTED_DATABASE_FINGERPRINT !== dbTarget.fingerprint) refuse("database target or fingerprint does not match the expected production identity");
  const root = resolve(process.env.MIGRATION_WORKDIR ?? process.cwd());
  const entries = await legacyEntries(root);
  const client = new pg.Client({ connectionString: databaseUrl }); await client.connect();
  try {
    validateFinalRepairPreconditions({ entries, ledgerRows: await ledgerRows(client), canonicalTablesExist: await canonicalTablesExist(client) });
    console.log(`[final-ledger-repair] target=${dbTarget.sanitized}`);
    console.log("[final-ledger-repair] creating backup before transactionally recording 0000 through 0037...");
    await backup(root);
    const lock = await client.query("select pg_try_advisory_lock(hashtext($1)) as locked", [LOCK_NAME]);
    if (!lock.rows[0]?.locked) refuse("another migration or repair process is active");
    await client.query("BEGIN");
    try {
      validateFinalRepairPreconditions({ entries, ledgerRows: await ledgerRows(client), canonicalTablesExist: await canonicalTablesExist(client) });
      for (const entry of entries) await client.query("insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)", [entry.hash, entry.when]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
    console.log(`[final-ledger-repair] inserted=${entries.length} through=${LEGACY_FINAL_TAG}; historical SQL was not executed; 0038 remains pending.`);
  } finally { await client.query("select pg_advisory_unlock(hashtext($1))", [LOCK_NAME]).catch(() => {}); await client.end(); }
}
if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) void main().catch((error) => { console.error(`[final-ledger-repair] failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });

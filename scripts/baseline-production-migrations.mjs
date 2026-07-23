import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import pg from "pg";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const LEDGER_SCHEMA = "drizzle";
const LEDGER_TABLE = "__drizzle_migrations";
const LOCK_NAME = "ghafaseh:drizzle:baseline";
const skipIfLedgerPopulated = process.argv.includes("--if-needed");

function fail(message) { throw new Error(`Baseline refused: ${message}`); }
function target(url) {
  const value = new URL(url);
  if (!/^postgres(ql)?:$/.test(value.protocol) || !value.hostname || !value.pathname.slice(1)) fail("DATABASE_URL must identify a PostgreSQL database");
  const sslmode = value.searchParams.get("sslmode") ?? (value.searchParams.get("ssl") === "true" ? "require" : "unspecified");
  return { fingerprint: hash(url), sanitized: `${value.hostname}:${value.port || "5432"}/${decodeURIComponent(value.pathname.slice(1))}?sslmode=${sslmode}` };
}
function expectedObjects(sql) {
  const types = [...sql.matchAll(/(?:CREATE\s+TYPE|ALTER\s+TYPE)\s+(?:"public"\.)?"?([A-Za-z0-9_]+)"?[\s\S]*?(?:AS\s+ENUM\s*\(([^;]+)\)|ADD\s+VALUE(?:\s+IF\s+NOT\s+EXISTS)?\s+'([^']+)')/gi)].map((m) => ({ name: m[1], labels: m[2] ? [...m[2].matchAll(/'([^']+)'/g)].map((v) => v[1]) : [m[3]] }));
  const tables = [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.)?"?([A-Za-z0-9_]+)"?/gi)].map((m) => m[1]);
  const indexes = [...sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([A-Za-z0-9_]+)"?/gi)].map((m) => m[1]);
  const constraints = [...sql.matchAll(/CONSTRAINT\s+"?([A-Za-z0-9_]+)"?/gi)].map((m) => m[1]);
  const columns = [...sql.matchAll(/ALTER\s+TABLE\s+"?([A-Za-z0-9_]+)"?\s+ADD\s+COLUMN(?:\s+IF\s+NOT\s+EXISTS)?\s+"?([A-Za-z0-9_]+)"?/gi)].map((m) => `${m[1]}.${m[2]}`);
  return { types, tables, indexes, constraints, columns };
}
async function journalEntries(root) {
  const journal = JSON.parse(await readFile(join(root, "drizzle", "meta", "_journal.json")));
  return Promise.all(journal.entries.map(async (entry) => ({ ...entry, hash: hash(await readFile(join(root, "drizzle", `${entry.tag}.sql`))), evidence: expectedObjects(await readFile(join(root, "drizzle", `${entry.tag}.sql`), "utf8")) })));
}
async function schemaSnapshot(client) {
  const [tables, columns, enums, indexes, constraints] = await Promise.all([
    client.query("select table_name from information_schema.tables where table_schema='public'"),
    client.query("select table_name, column_name from information_schema.columns where table_schema='public'"),
    client.query("select t.typname, e.enumlabel from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid where n.nspname='public'"),
    client.query("select indexname from pg_indexes where schemaname='public'"),
    client.query("select conname from pg_constraint"),
  ]);
  const enumMap = new Map(); for (const row of enums.rows) enumMap.set(row.typname, [...(enumMap.get(row.typname) ?? []), row.enumlabel]);
  return { tables: new Set(tables.rows.map((r) => r.table_name)), columns: new Set(columns.rows.map((r) => `${r.table_name}.${r.column_name}`)), enums: enumMap, indexes: new Set(indexes.rows.map((r) => r.indexname)), constraints: new Set(constraints.rows.map((r) => r.conname)) };
}
function verifyEntry(entry, snapshot) {
  const missing = [
    ...entry.evidence.tables.filter((v) => !snapshot.tables.has(v)).map((v) => `table:${v}`),
    ...entry.evidence.columns.filter((v) => !snapshot.columns.has(v)).map((v) => `column:${v}`),
    ...entry.evidence.indexes.filter((v) => !snapshot.indexes.has(v)).map((v) => `index:${v}`),
    ...entry.evidence.constraints.filter((v) => !snapshot.constraints.has(v)).map((v) => `constraint:${v}`),
    ...entry.evidence.types.flatMap(({ name, labels }) => labels.filter((label) => !snapshot.enums.get(name)?.includes(label)).map((label) => `enum:${name}.${label}`)),
  ];
  return { tag: entry.tag, missing, safe: missing.length === 0 };
}
async function dataEvidence(client, tag) {
  const checks = {
    "0013_home_content_catalog": "select not exists(select 1 from \"HomeFeaturedBook\" hf join \"Book\" b on b.id=hf.book_id where hf.catalog_book_id is null and b.catalog_book_id is not null) and not exists(select 1 from \"HomeHeroSlideBook\" hs join \"Book\" b on b.id=hs.book_id where hs.catalog_book_id is null and b.catalog_book_id is not null) as ok",
    "0024_quote_catalog_edition_sync": "select not exists(select 1 from \"Quote\" q join \"Book\" b on b.id=q.book_id where (q.catalog_book_id is null and b.catalog_book_id is not null) or (q.book_edition_id is null and b.edition_id is not null)) as ok",
    "0027_admin_content_timestamps": "select not exists(select 1 from \"Quote\" where created_at is null or updated_at is null or user_id is null) as ok",
  };
  if (!checks[tag]) return true;
  return Boolean((await client.query(checks[tag])).rows[0]?.ok);
}
async function main() {
  if (process.env.ALLOW_MIGRATION_BASELINE !== "true") fail("set ALLOW_MIGRATION_BASELINE=true for this one-time operation");
  const databaseUrl = process.env.DATABASE_URL; if (!databaseUrl) fail("DATABASE_URL is required");
  const dbTarget = target(databaseUrl);
  if (process.env.EXPECTED_DATABASE_TARGET && process.env.EXPECTED_DATABASE_TARGET !== dbTarget.sanitized) fail("database target does not match EXPECTED_DATABASE_TARGET");
  if (process.env.EXPECTED_DATABASE_FINGERPRINT && process.env.EXPECTED_DATABASE_FINGERPRINT !== dbTarget.fingerprint) fail("database fingerprint does not match EXPECTED_DATABASE_FINGERPRINT");
  const entries = await journalEntries(resolve(process.env.MIGRATION_WORKDIR ?? process.cwd()));
  const client = new pg.Client({ connectionString: databaseUrl }); await client.connect();
  try {
    const ledger = await client.query("select to_regclass('drizzle.__drizzle_migrations') as name");
    if (!ledger.rows[0]?.name) fail("Drizzle ledger drizzle.__drizzle_migrations is absent; this script never creates ledger schema or tables");
    const columns = await client.query("select column_name, data_type from information_schema.columns where table_schema='drizzle' and table_name='__drizzle_migrations'");
    const actualColumns = new Map(columns.rows.map((row) => [row.column_name, row.data_type]));
    if (actualColumns.get("id") !== "integer" || actualColumns.get("hash") !== "text" || actualColumns.get("created_at") !== "bigint") fail("Drizzle ledger does not match installed Drizzle's id/hash/created_at format");
    const existing = await client.query("select id from drizzle.__drizzle_migrations limit 1");
    if (existing.rowCount) {
      if (!skipIfLedgerPopulated) fail("Drizzle ledger is not empty");
      console.warn("[baseline] skipped: ledger is already populated; normal preflight will verify its exact journal state.");
      return;
    }
    const lock = await client.query("select pg_try_advisory_lock(hashtext($1)) as locked", [LOCK_NAME]);
    if (!lock.rows[0]?.locked) fail("another migration or baseline process is active");
    const snapshot = await schemaSnapshot(client);
    if (snapshot.tables.size === 0) fail("database is empty/new; baselining is forbidden");
    const evidence = []; for (const entry of entries) { const structural = verifyEntry(entry, snapshot); evidence.push({ ...structural, dataOk: structural.safe ? await dataEvidence(client, entry.tag) : false }); }
    const firstPending = evidence.findIndex((entry) => !entry.safe || !entry.dataOk);
    const baselineCount = firstPending === -1 ? entries.length : firstPending;
    if (baselineCount === 0) fail(`first migration has insufficient schema evidence: ${JSON.stringify(evidence[0])}`);
    const inconsistent = evidence.slice(baselineCount).find((entry) => entry.safe && entry.dataOk);
    if (inconsistent) fail(`migration state is non-contiguous; ${inconsistent.tag} appears applied after an earlier missing migration`);
    await client.query("BEGIN");
    try {
      const recheck = await client.query("select count(*)::int as count from drizzle.__drizzle_migrations"); if (recheck.rows[0].count !== 0) fail("ledger changed during baseline");
      for (const entry of entries.slice(0, baselineCount)) await client.query("insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)", [entry.hash, entry.when]);
      await client.query("COMMIT");
    } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; }
    console.log(`[baseline] target=${dbTarget.sanitized} fingerprint=${dbTarget.fingerprint}`);
    console.log(`[baseline] ledger=drizzle.__drizzle_migrations inserted=${baselineCount} through=${entries[baselineCount - 1].tag} pending=${entries.slice(baselineCount).map((entry) => entry.tag).join(",") || "none"}`);
  } finally { await client.query("select pg_advisory_unlock(hashtext($1))", [LOCK_NAME]).catch(() => {}); await client.end(); }
}
void main().catch((error) => { console.error(`[baseline] failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });

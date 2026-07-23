/**
 * Read-only diagnostic for an existing PostgreSQL schema with an empty Drizzle
 * ledger.  This deliberately does not share the baseline writer: an audit must
 * remain impossible to turn into a schema or ledger mutation by accident.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import pg from "pg";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const outputArgument = process.argv.find((argument) => argument.startsWith("--output="));
const outputPath = outputArgument?.slice("--output=".length);

function databaseTarget(url) {
  const value = new URL(url);
  if (!/^postgres(ql)?:$/.test(value.protocol) || !value.hostname || !value.pathname.slice(1)) throw new Error("DATABASE_URL must identify a PostgreSQL database");
  const sslmode = value.searchParams.get("sslmode") ?? (value.searchParams.get("ssl") === "true" ? "require" : "unspecified");
  return { fingerprint: hash(url), sanitized: `${value.hostname}:${value.port || "5432"}/${decodeURIComponent(value.pathname.slice(1))}?sslmode=${sslmode}` };
}

function addCreateTableEvidence(sql, result) {
  const matcher = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.)?"?([A-Za-z0-9_]+)"?\s*\(([\s\S]*?)\)(?:\s*;|\s*-->)/gi;
  for (const match of sql.matchAll(matcher)) {
    const table = match[1];
    result.tables.add(table);
    for (const line of match[2].split(/,\s*(?:\r?\n)?/)) {
      const column = line.match(/^\s*"?([A-Za-z][A-Za-z0-9_]*)"?\s+(?:varchar|text|integer|boolean|timestamp|jsonb|"[A-Za-z0-9_]+")\b/i)?.[1];
      if (column) result.columns.add(`${table}.${column}`);
    }
  }
}

export function expectedEvidence(sql) {
  const result = { tables: new Set(), columns: new Set(), indexes: new Set(), constraints: new Set(), enums: new Map(), functions: new Set(), triggers: new Set() };
  addCreateTableEvidence(sql, result);
  for (const match of sql.matchAll(/ALTER\s+TABLE\s+(?:"public"\.)?"?([A-Za-z0-9_]+)"?([\s\S]*?)(?=;|-->|$)/gi)) {
    const table = match[1];
    for (const column of match[2].matchAll(/ADD\s+COLUMN(?:\s+IF\s+NOT\s+EXISTS)?\s+"?([A-Za-z0-9_]+)"?/gi)) result.columns.add(`${table}.${column[1]}`);
  }
  for (const match of sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([A-Za-z0-9_]+)"?/gi)) result.indexes.add(match[1]);
  for (const match of sql.matchAll(/CONSTRAINT\s+"?([A-Za-z0-9_]+)"?/gi)) result.constraints.add(match[1]);
  for (const match of sql.matchAll(/(?:CREATE\s+TYPE|ALTER\s+TYPE)\s+(?:"public"\.)?"?([A-Za-z0-9_]+)"?\s*([\s\S]*?)(?=;|-->|$)/gi)) {
    const name = match[1];
    const labels = [...match[2].matchAll(/'([^']+)'/g)].map((label) => label[1]);
    if (labels.length) result.enums.set(name, [...new Set([...(result.enums.get(name) ?? []), ...labels])]);
  }
  for (const match of sql.matchAll(/CREATE\s+OR\s+REPLACE\s+FUNCTION\s+(?:public\.)?"?([A-Za-z0-9_]+)"?/gi)) result.functions.add(match[1]);
  for (const match of sql.matchAll(/CREATE\s+(?:CONSTRAINT\s+)?TRIGGER\s+"?([A-Za-z0-9_]+)"?/gi)) result.triggers.add(match[1]);
  return result;
}

function evidenceLabels(evidence) {
  return [
    ...[...evidence.tables].map((value) => `table:${value}`), ...[...evidence.columns].map((value) => `column:${value}`),
    ...[...evidence.indexes].map((value) => `index:${value}`), ...[...evidence.constraints].map((value) => `constraint:${value}`),
    ...[...evidence.enums].flatMap(([name, labels]) => labels.map((label) => `enum:${name}.${label}`)),
    ...[...evidence.functions].map((value) => `function:${value}`), ...[...evidence.triggers].map((value) => `trigger:${value}`),
  ];
}

async function journalEntries(root) {
  const journal = JSON.parse(await readFile(join(root, "drizzle", "meta", "_journal.json"), "utf8"));
  return Promise.all(journal.entries.map(async (entry) => {
    const sql = await readFile(join(root, "drizzle", `${entry.tag}.sql`), "utf8");
    return { ...entry, sql, hash: hash(sql), evidence: expectedEvidence(sql) };
  }));
}

async function snapshot(client) {
  const [tables, columns, enums, indexes, constraints, functions, triggers, ledger] = await Promise.all([
    client.query("select table_name from information_schema.tables where table_schema='public'"),
    client.query("select table_name, column_name, data_type, udt_name, is_nullable, column_default from information_schema.columns where table_schema='public'"),
    client.query("select t.typname, e.enumlabel from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid where n.nspname='public'"),
    client.query("select indexname, indexdef from pg_indexes where schemaname='public'"),
    client.query("select conname, pg_get_constraintdef(oid) as definition from pg_constraint where connamespace='public'::regnamespace"),
    client.query("select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'"),
    client.query("select t.tgname from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal"),
    client.query("select to_regclass('drizzle.__drizzle_migrations') as name"),
  ]);
  const enumMap = new Map(); for (const row of enums.rows) enumMap.set(row.typname, [...(enumMap.get(row.typname) ?? []), row.enumlabel]);
  let ledgerRows = null;
  if (ledger.rows[0]?.name) ledgerRows = (await client.query("select id, hash, created_at from drizzle.__drizzle_migrations order by created_at, id")).rows;
  return {
    tables: new Set(tables.rows.map((row) => row.table_name)), columns: new Map(columns.rows.map((row) => [`${row.table_name}.${row.column_name}`, row])),
    enums: enumMap, indexes: new Map(indexes.rows.map((row) => [row.indexname, row.indexdef])), constraints: new Map(constraints.rows.map((row) => [row.conname, row.definition])),
    functions: new Set(functions.rows.map((row) => row.proname)), triggers: new Set(triggers.rows.map((row) => row.tgname)), ledgerRows,
  };
}

function missingEvidence(evidence, state) {
  return [
    ...[...evidence.tables].filter((value) => !state.tables.has(value)).map((value) => `table:${value}`),
    ...[...evidence.columns].filter((value) => !state.columns.has(value)).map((value) => `column:${value}`),
    ...[...evidence.indexes].filter((value) => !state.indexes.has(value)).map((value) => `index:${value}`),
    ...[...evidence.constraints].filter((value) => !state.constraints.has(value)).map((value) => `constraint:${value}`),
    ...[...evidence.enums].flatMap(([name, labels]) => labels.filter((label) => !state.enums.get(name)?.includes(label)).map((label) => `enum:${name}.${label}`)),
    ...[...evidence.functions].filter((value) => !state.functions.has(value)).map((value) => `function:${value}`),
    ...[...evidence.triggers].filter((value) => !state.triggers.has(value)).map((value) => `trigger:${value}`),
  ];
}

// A missing object is only superseded when a later journaled migration names it
// in an explicit replacement operation. Merely finding a similarly named object
// is intentionally not sufficient proof.
function explicitReplacement(label, laterEntries) {
  const [, value] = label.split(":", 2);
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const replacement = new RegExp(`(?:DROP|RENAME|ALTER)\\s+(?:TABLE|INDEX|TYPE|TRIGGER|FUNCTION|COLUMN)[\\s\\S]{0,200}${escaped}|${escaped}[\\s\\S]{0,200}(?:RENAME|DROP|ALTER)`, "i");
  const entry = laterEntries.find((candidate) => replacement.test(candidate.sql));
  return entry ? { migration: entry.tag, proof: `later SQL explicitly references ${label}` } : null;
}

export function classifyMigration(entry, state, laterEntries) {
  const checked = evidenceLabels(entry.evidence);
  const missing = missingEvidence(entry.evidence, state);
  const superseded = missing.map((item) => ({ item, replacement: explicitReplacement(item, laterEntries) })).filter((item) => item.replacement);
  const unresolved = missing.filter((item) => !superseded.some((candidate) => candidate.item === item));
  if (!checked.length) return { status: "unverifiable", checked, missing: [], superseded: [], reason: "no durable schema evidence is derivable from this migration SQL" };
  if (!missing.length) return { status: "applied", checked, missing: [], superseded: [], reason: null };
  if (!unresolved.length) return { status: "superseded", checked, missing: [], superseded, reason: "every missing artifact has an explicit later replacement in journaled SQL" };
  return { status: "missing", checked, missing: unresolved, superseded, reason: `current schema lacks ${unresolved.join(", ")}` };
}

function finalSchemaReport(entries, state) {
  const expected = entries.reduce((all, entry) => {
    for (const key of ["tables", "columns", "indexes", "constraints", "functions", "triggers"]) for (const value of entry.evidence[key]) all[key].add(value);
    for (const [type, labels] of entry.evidence.enums) all.enums.set(type, [...new Set([...(all.enums.get(type) ?? []), ...labels])]);
    return all;
  }, { tables: new Set(), columns: new Set(), indexes: new Set(), constraints: new Set(), enums: new Map(), functions: new Set(), triggers: new Set() });
  return { checked: evidenceLabels(expected), missing: missingEvidence(expected, state) };
}

function print(report) {
  console.log(`[baseline-audit] target=${report.target.sanitized} fingerprint=${report.target.fingerprint}`);
  console.log(`[baseline-audit] ledger=${report.ledgerState} canonical_tables=${report.finalSchema.checked.filter((value) => value.startsWith("table:")).length} final_missing=${report.finalSchema.missing.length}`);
  for (const item of report.migrations) {
    console.log(`[baseline-audit] ${String(item.index).padStart(2, "0")} ${item.tag} status=${item.status} checked=${item.checked.join("|") || "none"}${item.reason ? ` reason=${item.reason}` : ""}`);
    for (const replacement of item.superseded) console.log(`[baseline-audit]   superseded ${replacement.item} by=${replacement.replacement.migration} proof=${replacement.replacement.proof}`);
  }
  if (report.finalSchema.missing.length) console.log(`[baseline-audit] final-schema-missing=${report.finalSchema.missing.join(",")}`);
  console.log("[baseline-audit] read-only: no schema, application data, or migration ledger rows were modified.");
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL; if (!databaseUrl) throw new Error("DATABASE_URL is required");
  const target = databaseTarget(databaseUrl);
  if (process.env.EXPECTED_DATABASE_TARGET && process.env.EXPECTED_DATABASE_TARGET !== target.sanitized) throw new Error("database target does not match EXPECTED_DATABASE_TARGET");
  if (process.env.EXPECTED_DATABASE_FINGERPRINT && process.env.EXPECTED_DATABASE_FINGERPRINT !== target.fingerprint) throw new Error("database fingerprint does not match EXPECTED_DATABASE_FINGERPRINT");
  const entries = await journalEntries(resolve(process.env.MIGRATION_WORKDIR ?? process.cwd()));
  const client = new pg.Client({ connectionString: databaseUrl }); await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const state = await snapshot(client);
    const migrations = entries.map((entry, index) => ({ index, tag: entry.tag, ...classifyMigration(entry, state, entries.slice(index + 1)) }));
    const report = { target, ledgerState: state.ledgerRows === null ? "absent" : state.ledgerRows.length ? `populated:${state.ledgerRows.length}` : "empty", migrations, finalSchema: finalSchemaReport(entries, state) };
    print(report);
    if (outputPath) {
      await mkdir(dirname(resolve(outputPath)), { recursive: true });
      await writeFile(resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
      console.log(`[baseline-audit] report saved: ${resolve(outputPath)}`);
    }
    if (process.argv.includes("--json")) console.log(JSON.stringify(report));
    await client.query("ROLLBACK");
  } finally { await client.end(); }
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) void main().catch((error) => { console.error(`[baseline-audit] failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });

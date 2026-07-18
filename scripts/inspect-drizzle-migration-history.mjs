import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import pg from "pg";

function parseArgs(argv) {
  const output = argv.find((argument) => argument.startsWith("--output="));
  if (argv.some((argument) => argument === "--apply" || argument === "--confirm-production-baseline")) {
    throw new Error("This inspection tool is read-only and never reconciles migration history.");
  }
  return { outputPath: output?.slice("--output=".length) };
}

function sanitizedTarget(databaseUrl) {
  const parsed = new URL(databaseUrl);
  if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
    throw new Error("DATABASE_URL must be a PostgreSQL URL.");
  }
  return `${parsed.hostname}:${parsed.port || "5432"}/${parsed.pathname.replace(/^\/+/, "") || "(default)"}`;
}

function expectedObjects(sql) {
  const types = [...sql.matchAll(/CREATE\s+TYPE\s+(?:"public"\.)?"?([A-Za-z0-9_]+)"?\s+AS\s+ENUM\s*\(([^;]+)\)/gi)]
    .map((match) => ({ name: match[1], labels: [...match[2].matchAll(/'([^']+)'/g)].map((label) => label[1]) }));
  const tables = [...sql.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.)?"?([A-Za-z0-9_]+)"?/gi)]
    .map((match) => match[1]);
  const indexes = [...sql.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?"?([A-Za-z0-9_]+)"?/gi)]
    .map((match) => match[1]);
  const constraints = [...sql.matchAll(/ADD\s+CONSTRAINT\s+"?([A-Za-z0-9_]+)"?/gi)]
    .map((match) => match[1]);
  return { types, tables, indexes, constraints };
}

async function readMigrations(migrationDirectory) {
  const journal = JSON.parse(await readFile(join(migrationDirectory, "meta", "_journal.json"), "utf8"));
  return Promise.all(journal.entries.map(async (entry) => {
    const sql = await readFile(join(migrationDirectory, `${entry.tag}.sql`), "utf8");
    return {
      index: entry.idx,
      name: entry.tag,
      journalTimestamp: entry.when,
      hash: createHash("sha256").update(sql).digest("hex"),
      expectedObjects: expectedObjects(sql),
      hasDataOrUnboundedAlteration: /\b(UPDATE|DELETE|INSERT|DROP|ALTER\s+TABLE|ALTER\s+TYPE|CREATE\s+OR\s+REPLACE|TRIGGER|DO\s+\$\$)\b/i.test(sql),
    };
  }));
}

async function inspectDatabase(client, migration) {
  const { types, tables, indexes, constraints } = migration.expectedObjects;
  const [history, enumRows, tableRows, indexRows, constraintRows] = await Promise.all([
    client.query('SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at, id'),
    client.query("SELECT t.typname, e.enumlabel, e.enumsortorder FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace JOIN pg_enum e ON e.enumtypid=t.oid WHERE n.nspname='public' ORDER BY t.typname, e.enumsortorder"),
    client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"),
    client.query("SELECT indexname FROM pg_indexes WHERE schemaname='public'"),
    client.query("SELECT conname FROM pg_constraint"),
  ]);
  const historyByTimestamp = new Map(history.rows.map((row) => [Number(row.created_at), row]));
  const enumLabels = new Map();
  for (const row of enumRows.rows) {
    enumLabels.set(row.typname, [...(enumLabels.get(row.typname) ?? []), row.enumlabel]);
  }
  const tableNames = new Set(tableRows.rows.map((row) => row.table_name));
  const indexNames = new Set(indexRows.rows.map((row) => row.indexname));
  const constraintNames = new Set(constraintRows.rows.map((row) => row.conname));
  const matches = {
    types: types.map((type) => ({ name: type.name, expectedLabels: type.labels, actualLabels: enumLabels.get(type.name) ?? null, matches: JSON.stringify(type.labels) === JSON.stringify(enumLabels.get(type.name) ?? null) })),
    tables: tables.map((name) => ({ name, exists: tableNames.has(name) })),
    indexes: indexes.map((name) => ({ name, exists: indexNames.has(name) })),
    constraints: constraints.map((name) => ({ name, exists: constraintNames.has(name) })),
  };
  const missing = [
    ...matches.types.filter((value) => !value.matches).map((value) => `enum:${value.name}`),
    ...matches.tables.filter((value) => !value.exists).map((value) => `table:${value.name}`),
    ...matches.indexes.filter((value) => !value.exists).map((value) => `index:${value.name}`),
    ...matches.constraints.filter((value) => !value.exists).map((value) => `constraint:${value.name}`),
  ];
  const historyRow = historyByTimestamp.get(migration.journalTimestamp) ?? null;
  return {
    ...migration,
    historyRow,
    existingMatchingObjects: matches,
    missingObjects: missing,
    // Existence alone is never adequate proof for a baseline. Migrations with
    // data changes, ALTERs, functions, or triggers require a reviewed schema
    // diff and data-integrity evidence before any history row may be inserted.
    classification: historyRow ? "recorded-needs-hash-review" : missing.length ? "genuinely-missing-or-partial" : "unrecorded-needs-full-schema-proof",
    safeToMarkApplied: false,
  };
}

async function main() {
  const { outputPath } = parseArgs(process.argv.slice(2));
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for read-only inspection.");
  const migrationDirectory = resolve(process.env.MIGRATION_DIR ?? "drizzle");
  const migrations = await readMigrations(migrationDirectory);
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const report = {
      target: sanitizedTarget(process.env.DATABASE_URL),
      generatedAt: new Date().toISOString(),
      drizzleCompatibility: {
        table: "drizzle.__drizzle_migrations",
        columns: ["id", "hash", "created_at"],
        hash: "sha256 of the exact committed SQL file bytes",
        ordering: "Drizzle applies migrations whose journal timestamp is greater than the latest created_at row; it does not compare previous hashes.",
      },
      migrations: await Promise.all(migrations.map((migration) => inspectDatabase(client, migration))),
    };
    await client.query("ROLLBACK");
    const serialized = `${JSON.stringify(report, null, 2)}\n`;
    if (outputPath) {
      // Output is intentionally optional and must name a local report file.
      await (await import("node:fs/promises")).writeFile(resolve(outputPath), serialized, { flag: "wx" });
    } else {
      process.stdout.write(serialized);
    }
  } finally {
    await client.end();
  }
}

void main().catch((error) => {
  console.error(`[migration-history-inspection] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

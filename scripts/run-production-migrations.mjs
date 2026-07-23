import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import pg from "pg";
import { PRODUCTION_MIGRATION_BASELINE, assertUnchangedTargetFingerprint, validatePreflight } from "./migration-preflight.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const mode = process.argv[2];

function targetDetails(databaseUrl) {
  const parsed = new URL(databaseUrl);
  if (!/^postgres(ql)?:$/.test(parsed.protocol) || !parsed.hostname || !parsed.pathname.replace(/^\/+/, "")) {
    throw new Error("DATABASE_URL must positively identify a PostgreSQL host and database.");
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  const sslmode = parsed.searchParams.get("sslmode") ?? (parsed.searchParams.get("ssl") === "true" ? "require" : "unspecified");
  return { fingerprint: hash(databaseUrl), sanitized: `${parsed.hostname}:${parsed.port || "5432"}/${database}?sslmode=${sslmode}` };
}

function assertExpectedTarget(target) {
  if (process.env.EXPECTED_DATABASE_TARGET && process.env.EXPECTED_DATABASE_TARGET !== target.sanitized) {
    throw new Error("Migration refused: database target does not match EXPECTED_DATABASE_TARGET.");
  }
  if (process.env.EXPECTED_DATABASE_FINGERPRINT && process.env.EXPECTED_DATABASE_FINGERPRINT !== target.fingerprint) {
    throw new Error("Migration refused: database fingerprint does not match EXPECTED_DATABASE_FINGERPRINT.");
  }
}

async function readArtifacts(root) {
  const drizzle = join(root, "drizzle");
  const journalPath = join(drizzle, "meta", "_journal.json");
  const manifestPath = join(root, "migration-manifest.json");
  await Promise.all([access(journalPath), access(manifestPath), access(join(root, "drizzle.config.ts"))]);
  const [journalBytes, manifestBytes] = await Promise.all([readFile(journalPath), readFile(manifestPath)]);
  const journal = JSON.parse(journalBytes);
  const manifest = JSON.parse(manifestBytes);
  if (!Array.isArray(journal.entries) || !Array.isArray(manifest.migrations)) throw new Error("Runtime migration artifacts are malformed.");
  const entries = await Promise.all(journal.entries.map(async (entry) => ({ ...entry, hash: hash(await readFile(join(drizzle, `${entry.tag}.sql`)))})));
  const filesHash = hash(entries.map((entry) => `${entry.tag}:${entry.hash}`).join("\n"));
  const exactManifest = manifest.journalEntries === entries.length
    && manifest.migrationFiles === entries.length
    && manifest.journalSha256 === hash(journalBytes)
    && manifest.migrationFilesSha256 === filesHash
    && manifest.latestMigration === entries.at(-1)?.tag
    && manifest.latestMigrationSha256 === entries.at(-1)?.hash
    && JSON.stringify(manifest.migrations) === JSON.stringify(entries.map(({ idx, tag, when, hash: sha256 }) => ({ index: idx, tag, when, sha256 })));
  if (!exactManifest) throw new Error("Runtime migration manifest does not exactly match the journal and SQL artifacts.");
  const expectedCommit = process.env.EXPECTED_RELEASE_SHA ?? process.env.RELEASE_COMMIT_SHA;
  if (expectedCommit && manifest.releaseCommit !== "unknown" && manifest.releaseCommit !== expectedCommit) throw new Error("Runtime release commit does not match the expected release.");
  return { entries, manifest };
}

async function ledgerRows(client) {
  const exists = await client.query("select to_regclass('drizzle.__drizzle_migrations') as table_name");
  if (!exists.rows[0]?.table_name) return [];
  return (await client.query("select id, hash, created_at from drizzle.__drizzle_migrations order by created_at, id")).rows;
}

async function canonicalTablesExist(client) {
  const result = await client.query("select exists(select 1 from information_schema.tables where table_schema='public' and table_name in ('Book','User','BookEdition','CatalogBook')) as exists");
  return result.rows[0].exists;
}

const REQUIRED_FOREIGN_KEYS = [
  { table: "PersonalBookNote", columns: ["book_id"], referencedTable: "Book", referencedColumns: ["id"], onDelete: "c" },
  { table: "PersonalBookNote", columns: ["user_id"], referencedTable: "User", referencedColumns: ["id"], onDelete: "c" },
  { table: "ReadingEvent", columns: ["user_id"], referencedTable: "User", referencedColumns: ["id"], onDelete: "c" },
  { table: "ReadingEvent", columns: ["book_id"], referencedTable: "Book", referencedColumns: ["id"], onDelete: "c" },
  { table: "PublicBookThought", columns: ["catalog_book_id"], referencedTable: "CatalogBook", referencedColumns: ["id"], onDelete: "c" },
  { table: "PublicBookThought", columns: ["user_id"], referencedTable: "User", referencedColumns: ["id"], onDelete: "c" },
  { table: "PublicBookThought", columns: ["source_personal_note_id"], referencedTable: "PersonalBookNote", referencedColumns: ["id"], onDelete: "n" },
];

export function missingRequiredForeignKeys(foreignKeys) {
  return REQUIRED_FOREIGN_KEYS.filter((expected) => !foreignKeys.some((actual) => actual.table === expected.table
    && actual.referencedTable === expected.referencedTable
    && actual.onDelete === expected.onDelete
    && JSON.stringify(actual.columns) === JSON.stringify(expected.columns)
    && JSON.stringify(actual.referencedColumns) === JSON.stringify(expected.referencedColumns)));
}

async function verifyRequiredSchema(client) {
  const [columns, enumRows, indexes, constraints] = await Promise.all([
    client.query("select table_name, column_name, data_type from information_schema.columns where table_schema='public' and table_name in ('Book','PersonalBookNote','ReadingEvent','PublicBookThought','ReferenceItem')"),
    client.query("select t.typname, e.enumlabel from pg_type t join pg_namespace n on n.oid=t.typnamespace join pg_enum e on e.enumtypid=t.oid where n.nspname='public' and t.typname in ('BookStatus','ReadingEventType','PublicBookThoughtType') order by t.typname, e.enumsortorder"),
    client.query("select indexname from pg_indexes where schemaname='public' and tablename in ('PersonalBookNote','ReadingEvent','PublicBookThought')"),
    client.query(`
      select
        source.relname as table_name,
        array_agg(source_column.attname order by key_column.ordinality) as columns,
        target.relname as referenced_table,
        array_agg(target_column.attname order by key_column.ordinality) as referenced_columns,
        fk.confdeltype as on_delete
      from pg_constraint fk
      join pg_class source on source.oid = fk.conrelid
      join pg_namespace source_namespace on source_namespace.oid = source.relnamespace
      join pg_class target on target.oid = fk.confrelid
      join lateral unnest(fk.conkey) with ordinality as key_column(attnum, ordinality) on true
      join pg_attribute source_column on source_column.attrelid = fk.conrelid and source_column.attnum = key_column.attnum
      join pg_attribute target_column on target_column.attrelid = fk.confrelid and target_column.attnum = fk.confkey[key_column.ordinality]
      where fk.contype = 'f'
        and source_namespace.nspname = 'public'
        and source.relname in ('PersonalBookNote', 'ReadingEvent', 'PublicBookThought')
      group by fk.oid, source.relname, target.relname, fk.confdeltype
    `),
  ]);
  const columnSet = new Set(columns.rows.map((row) => `${row.table_name}.${row.column_name}:${row.data_type}`));
  const requiredColumns = ["Book.current_page:integer", "Book.reading_updated_at:timestamp without time zone", "Book.completed_at:timestamp without time zone", "PersonalBookNote.book_id:character varying", "PersonalBookNote.user_id:character varying", "PersonalBookNote.content:text", "PersonalBookNote.page_number:integer", "PersonalBookNote.created_at:timestamp without time zone", "PersonalBookNote.updated_at:timestamp without time zone", "ReadingEvent.user_id:character varying", "ReadingEvent.book_id:character varying", "ReadingEvent.type:USER-DEFINED", "ReadingEvent.created_at:timestamp without time zone", "PublicBookThought.catalog_book_id:character varying", "PublicBookThought.user_id:character varying", "PublicBookThought.source_personal_note_id:character varying", "PublicBookThought.content:text", "PublicBookThought.type:USER-DEFINED", "ReferenceItem.description:text", "ReferenceItem.short_description:text"];
  const missingColumns = requiredColumns.filter((value) => !columnSet.has(value));
  const labels = new Map();
  for (const row of enumRows.rows) labels.set(row.typname, [...(labels.get(row.typname) ?? []), row.enumlabel]);
  const expectedEnums = { BookStatus: ["UNREAD", "READING", "FINISHED", "PAUSED"], ReadingEventType: ["START", "PROGRESS", "FINISH"], PublicBookThoughtType: ["THOUGHT", "QUOTE", "REFLECTION"] };
  const enumFailures = Object.entries(expectedEnums).filter(([name, values]) => !values.every((value) => labels.get(name)?.includes(value))).map(([name]) => name);
  const indexSet = new Set(indexes.rows.map((row) => row.indexname));
  const requiredIndexes = ["PersonalBookNote_book_user_idx", "PersonalBookNote_created_at_idx", "ReadingEvent_user_book_created_idx", "PublicBookThought_source_note_unique", "PublicBookThought_book_created_idx", "PublicBookThought_user_idx"];
  const missingIndexes = requiredIndexes.filter((name) => !indexSet.has(name));
  const foreignKeys = constraints.rows.map((row) => ({ table: row.table_name, columns: row.columns, referencedTable: row.referenced_table, referencedColumns: row.referenced_columns, onDelete: row.on_delete }));
  const missingForeignKeys = missingRequiredForeignKeys(foreignKeys).map((foreignKey) => `foreign_key:${foreignKey.table}(${foreignKey.columns.join(",")})→${foreignKey.referencedTable}(${foreignKey.referencedColumns.join(",")}) on_delete=${foreignKey.onDelete}`);
  if (missingColumns.length || enumFailures.length || missingIndexes.length || missingForeignKeys.length) throw new Error(`Post-migration schema verification failed: ${[...missingColumns, ...enumFailures.map((value) => `enum:${value}`), ...missingIndexes, ...missingForeignKeys].join(", ")}`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const target = targetDetails(databaseUrl);
  assertExpectedTarget(target);
  const root = resolve(process.env.MIGRATION_WORKDIR ?? process.cwd());
  const artifacts = await readArtifacts(root);
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const currentTarget = targetDetails(databaseUrl);
    assertUnchangedTargetFingerprint(target.fingerprint, currentTarget.fingerprint);
    const ledger = await ledgerRows(client);
    if (mode === "preflight") {
      const result = validatePreflight({ journalEntries: artifacts.entries, ledgerRows: ledger, canonicalTablesExist: await canonicalTablesExist(client), baselineTag: process.env.MIGRATION_BASELINE_TAG ?? PRODUCTION_MIGRATION_BASELINE });
      console.log(`[migrations] phase=preflight target=${target.sanitized} fingerprint=${target.fingerprint}`);
      console.log(`[migrations] release_commit=${artifacts.manifest.releaseCommit} journal_rows=${artifacts.entries.length} latest=${artifacts.entries.at(-1).tag}`);
      console.log(`[migrations] ledger_rows=${ledger.length} pending=${result.pending.map((entry) => entry.tag).join(",") || "none"}`);
      return;
    }
    validatePreflight({ journalEntries: artifacts.entries, ledgerRows: ledger, canonicalTablesExist: await canonicalTablesExist(client), baselineTag: process.env.MIGRATION_BASELINE_TAG ?? PRODUCTION_MIGRATION_BASELINE });
    if (ledger.length !== artifacts.entries.length) throw new Error("Post-migration verification failed: migrations remain pending.");
    await verifyRequiredSchema(client);
    if (process.env.RUN_MIGRATION_LEDGER_FINAL_REPAIR === "true") {
      const finalEntry = artifacts.entries.at(-1);
      const recorded = finalEntry && ledger.some((row) => row.hash === finalEntry.hash && Number(row.created_at) === Number(finalEntry.when));
      if (finalEntry?.tag !== "0038_production_schema_reconciliation" || !recorded) throw new Error("Final recovery verification failed: 0038_production_schema_reconciliation was not recorded by Drizzle.");
      console.log("[migrations] final_recovery 0038_execution=applied");
    }
    console.log(`[migrations] phase=postflight target=${target.sanitized} ledger_rows=${ledger.length} schema=verified`);
  } finally { await client.end(); }
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  if (mode !== "preflight" && mode !== "postflight") {
    console.error("[migrations] failed: Usage: run-production-migrations.mjs <preflight|postflight>");
    process.exit(1);
  }
  void main().catch((error) => { console.error(`[migrations] failed: ${error instanceof Error ? error.message : String(error)}`); process.exit(1); });
}

import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import pg from "pg";

const MIGRATION_LOCK_NAME = "ghafaseh:drizzle:migrations";
const DEFAULT_LOCK_TIMEOUT_MS = 90_000;
const LOCK_RETRY_MS = 1_000;

function getLockTimeoutMs() {
  const configured = Number.parseInt(
    process.env.DATABASE_MIGRATION_LOCK_TIMEOUT_MS ?? "",
    10,
  );

  if (!Number.isFinite(configured) || configured <= 0) {
    return DEFAULT_LOCK_TIMEOUT_MS;
  }

  return Math.min(configured, 300_000);
}

function sanitizedDatabaseTarget(databaseUrl) {
  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (!/^postgres(ql)?:$/.test(parsed.protocol)) {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol.");
  }

  const database = parsed.pathname.replace(/^\/+/, "") || "(default)";
  const port = parsed.port || "5432";
  return `${parsed.hostname}:${port}/${database}`;
}

async function verifyMigrationArtifacts(migrationRoot) {
  const drizzleDirectory = join(migrationRoot, "drizzle");
  const journalPath = join(drizzleDirectory, "meta", "_journal.json");
  const configPath = join(migrationRoot, "drizzle.config.ts");
  const schemaPath = join(migrationRoot, "db", "schema.ts");

  await Promise.all(
    [drizzleDirectory, journalPath, configPath, schemaPath].map((path) => access(path)),
  );

  let journal;
  try {
    journal = JSON.parse(await readFile(journalPath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read Drizzle migration journal: ${error.message}`);
  }

  if (!Array.isArray(journal.entries) || journal.entries.length === 0) {
    throw new Error("Drizzle migration journal has no entries.");
  }

  for (const entry of journal.entries) {
    if (typeof entry?.tag !== "string" || entry.tag.length === 0) {
      throw new Error("Drizzle migration journal contains an invalid migration tag.");
    }
    await access(join(drizzleDirectory, `${entry.tag}.sql`));
  }

  await access(join(drizzleDirectory, "0033_iranketab_preview_operations.sql"));
  if (!journal.entries.some((entry) => entry.tag === "0033_iranketab_preview_operations")) {
    throw new Error("IranKetab preview-operation migration is missing from the Drizzle journal.");
  }
}

function runMigrations(migrationRoot) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  return new Promise((resolvePromise, reject) => {
    const child = spawn(npmCommand, ["run", "db:migrate"], {
      cwd: migrationRoot,
      env: { ...process.env },
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      reject(
        new Error(
          `npm run db:migrate exited with ${signal ? `signal ${signal}` : `code ${code ?? "unknown"}`}.`,
        ),
      );
    });
  });
}

function delay(milliseconds) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));
}

async function acquireMigrationLock(client, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  do {
    const result = await client.query(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
      [MIGRATION_LOCK_NAME],
    );
    if (result.rows[0]?.acquired === true) {
      return;
    }
    await delay(LOCK_RETRY_MS);
  } while (Date.now() < deadline);

  throw new Error(
    `Timed out waiting ${timeoutMs}ms for the production migration lock. Another instance may still be migrating.`,
  );
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required before production migrations can run.");
  }

  const migrationRoot = resolve(process.env.MIGRATION_WORKDIR ?? process.cwd());
  const target = sanitizedDatabaseTarget(databaseUrl);
  console.log(`[migrations] target=${target}`);
  await verifyMigrationArtifacts(migrationRoot);
  console.log("[migrations] migration artifacts verified.");

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  let locked = false;
  try {
    const timeoutMs = getLockTimeoutMs();
    console.log(`[migrations] waiting for advisory lock (up to ${timeoutMs}ms)...`);
    await acquireMigrationLock(client, timeoutMs);
    locked = true;
    console.log("[migrations] applying committed Drizzle migrations...");
    await runMigrations(migrationRoot);
    console.log("[migrations] completed.");
  } finally {
    if (locked) {
      await client.query("SELECT pg_advisory_unlock(hashtext($1))", [MIGRATION_LOCK_NAME]);
    }
    await client.end();
  }
}

void main().catch((error) => {
  console.error(`[migrations] failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});

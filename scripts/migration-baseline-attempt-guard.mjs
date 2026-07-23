/**
 * Suppresses repeated destructive-maintenance attempts after a guarded
 * baseline fails. DATABASE_BACKUP_DIR must be backed by the persistent Coolify
 * volume for this protection to survive a replacement container.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const mode = process.argv[2];
if (mode !== "preflight" && mode !== "record") throw new Error("Usage: migration-baseline-attempt-guard.mjs <preflight|record>");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const parsed = new URL(process.env.DATABASE_URL);
if (!/^postgres(ql)?:$/.test(parsed.protocol) || !parsed.hostname || !parsed.pathname.slice(1)) throw new Error("DATABASE_URL must identify a PostgreSQL database");
const fingerprint = createHash("sha256").update(process.env.DATABASE_URL).digest("hex");
const release = process.env.MIGRATION_RELEASE_ID ?? process.env.APP_RELEASE ?? "unknown-release";
const key = createHash("sha256").update(`${fingerprint}:${release}`).digest("hex");
const directory = resolve(process.env.DATABASE_BACKUP_DIR ?? "/app/backups");
const marker = join(directory, `.migration-baseline-failed-${key}.json`);

await mkdir(directory, { recursive: true });
if (mode === "preflight") {
  try {
    const previous = JSON.parse(await readFile(marker, "utf8"));
    console.error(`[baseline-guard] suppressed duplicate baseline attempt release=${previous.release} fingerprint=${fingerprint}; a previous baseline failure is recorded at ${marker}. Remove RUN_MIGRATION_BASELINE after reviewing the audit, or deploy a reviewed new release before retrying.`);
    process.exit(2);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") process.exit(0);
    if (error instanceof SyntaxError) throw new Error(`baseline failure marker is malformed: ${marker}`);
    throw error;
  }
}

const payload = JSON.stringify({ version: 1, release, fingerprint, failedAt: new Date().toISOString(), reason: "guarded baseline command failed before ledger insertion" });
const temporary = `${marker}.${process.pid}.tmp`;
await writeFile(temporary, payload, { mode: 0o600 });
await rename(temporary, marker);
console.error(`[baseline-guard] recorded baseline failure release=${release} fingerprint=${fingerprint}; future identical baseline restarts will stop before another backup.`);

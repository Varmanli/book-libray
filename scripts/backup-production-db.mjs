import { access, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required before creating a backup.");
const parsed = new URL(databaseUrl);
if (!/^postgres(ql)?:$/.test(parsed.protocol)) throw new Error("Production backup requires a PostgreSQL DATABASE_URL.");
const backupDirectory = resolve(process.env.DATABASE_BACKUP_DIR ?? "/app/backups");
await mkdir(backupDirectory, { recursive: true });
await access(backupDirectory);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, "")) || "database";
const filename = `qafaseh-${database.replace(/[^a-zA-Z0-9_-]/g, "_")}-${timestamp}.dump`;
const output = resolve(backupDirectory, filename);
if (!output.startsWith(`${backupDirectory}/`) && output !== backupDirectory) throw new Error("Backup path escaped DATABASE_BACKUP_DIR.");

await new Promise((resolvePromise, reject) => {
  const child = spawn("pg_dump", ["--format=custom", "--no-owner", "--no-privileges", `--file=${output}`, `--dbname=${databaseUrl}`], { stdio: ["ignore", "ignore", "pipe"] });
  let stderr = "";
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  child.once("error", (error) => reject(new Error(`Database backup could not start: ${error.message}`)));
  child.once("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`Database backup failed (pg_dump exit code ${code ?? "unknown"}): ${stderr.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, "[redacted]").trim() || "no details"}`)));
});
console.log(`[backup] completed path=${output}`);

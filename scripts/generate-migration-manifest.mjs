import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const drizzle = join(root, "drizzle");
const digest = (value) => createHash("sha256").update(value).digest("hex");
const journalBytes = await readFile(join(drizzle, "meta", "_journal.json"));
const journal = JSON.parse(journalBytes);

if (!Array.isArray(journal.entries) || journal.entries.length === 0) {
  throw new Error("Migration journal has no entries.");
}

const migrations = await Promise.all(journal.entries.map(async (entry) => {
  const bytes = await readFile(join(drizzle, `${entry.tag}.sql`));
  return { index: entry.idx, tag: entry.tag, when: entry.when, sha256: digest(bytes) };
}));
const latest = migrations.at(-1);
const output = resolve(process.argv[2] ?? ".runtime/migration-manifest.json");
const migrationFilesSha256 = digest(migrations.map((entry) => `${entry.tag}:${entry.sha256}`).join("\n"));

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  releaseCommit: process.env.GIT_COMMIT_SHA || process.env.RELEASE_COMMIT_SHA || "unknown",
  buildId: process.env.IMAGE_BUILD_ID || "unknown",
  journalEntries: migrations.length,
  journalSha256: digest(journalBytes),
  migrationFiles: migrations.length,
  migrationFilesSha256,
  latestMigration: latest.tag,
  latestMigrationSha256: latest.sha256,
  migrations,
}, null, 2)}\n`);

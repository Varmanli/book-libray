import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const root = resolve(process.cwd());
const drizzle = join(root, "drizzle");
const journalBytes = await readFile(join(drizzle, "meta", "_journal.json"));
const journal = JSON.parse(journalBytes);
const latest = journal.entries.at(-1);
if (!latest || latest.tag !== "0033_iranketab_preview_operations") {
  throw new Error("Migration manifest requires 0033_iranketab_preview_operations as the latest journal entry.");
}
const latestBytes = await readFile(join(drizzle, `${latest.tag}.sql`));
const digest = (value) => createHash("sha256").update(value).digest("hex");
const output = resolve(process.argv[2] ?? ".runtime/migration-manifest.json");
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  releaseCommit: process.env.GIT_COMMIT_SHA || process.env.RELEASE_COMMIT_SHA || "unknown",
  buildId: process.env.IMAGE_BUILD_ID || "unknown",
  journalEntries: journal.entries.length,
  latestMigration: latest.tag,
  journalSha256: digest(journalBytes),
  latestMigrationSha256: digest(latestBytes),
}, null, 2)}\n`);

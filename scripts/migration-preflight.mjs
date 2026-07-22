export const PRODUCTION_MIGRATION_BASELINE = "0033_iranketab_preview_operations";

function refuse(message) {
  throw new Error(`Migration refused: ${message}`);
}

export function assertUnchangedTargetFingerprint(before, after) {
  if (!before || !after || before !== after) {
    refuse("DATABASE_URL changed between preflight and execution");
  }
}

/**
 * A production database may be either a brand-new empty database or an
 * established database whose history is complete through the released
 * baseline.  Anything in between is unsafe to migrate automatically.
 */
export function validatePreflight({
  journalEntries,
  ledgerRows,
  canonicalTablesExist,
  baselineTag = PRODUCTION_MIGRATION_BASELINE,
}) {
  if (!Array.isArray(journalEntries) || journalEntries.length === 0) {
    refuse("migration journal is empty");
  }
  const tags = journalEntries.map((entry) => entry.tag);
  if (new Set(tags).size !== tags.length) refuse("migration journal contains duplicate tags");
  if (!tags.includes(baselineTag)) refuse(`${baselineTag} is missing from the runtime journal`);
  if (!Array.isArray(ledgerRows)) refuse("migration ledger could not be read");

  const journalByTimestamp = new Map(journalEntries.map((entry) => [Number(entry.when), entry]));
  const ledgerByTimestamp = new Map();
  for (const row of ledgerRows) {
    const timestamp = Number(row.created_at);
    if (ledgerByTimestamp.has(timestamp)) refuse(`migration ledger has duplicate timestamp ${timestamp}`);
    const entry = journalByTimestamp.get(timestamp);
    if (!entry || entry.hash !== row.hash) refuse(`ledger row ${row.id} is not an exact runtime migration match`);
    ledgerByTimestamp.set(timestamp, row);
  }

  if (ledgerRows.length === 0) {
    if (canonicalTablesExist) refuse("ledger is empty while canonical application tables exist");
    return { fresh: true, latestEntry: null, pending: journalEntries };
  }

  const baselineIndex = journalEntries.findIndex((entry) => entry.tag === baselineTag);
  for (const entry of journalEntries.slice(0, baselineIndex + 1)) {
    const recorded = ledgerByTimestamp.get(Number(entry.when));
    if (!recorded) refuse(`historical migration is unexpectedly pending: ${entry.tag}`);
  }

  const pending = journalEntries.filter((entry) => !ledgerByTimestamp.has(Number(entry.when)));
  const allowedPending = journalEntries.slice(baselineIndex + 1);
  if (pending.some((entry) => !allowedPending.includes(entry))) {
    refuse(`unexpected pending migrations: ${pending.map((entry) => entry.tag).join(", ")}`);
  }

  const latestEntry = [...ledgerRows]
    .map((row) => journalByTimestamp.get(Number(row.created_at)))
    .filter(Boolean)
    .sort((a, b) => Number(a.when) - Number(b.when))
    .at(-1);
  return { fresh: false, latestEntry, pending };
}

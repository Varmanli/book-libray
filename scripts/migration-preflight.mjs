export const REQUIRED_HISTORY_TAG = "0032_iranketab_edition_contributors";
export const NEXT_MIGRATION_TAG = "0033_iranketab_preview_operations";

export function assertUnchangedTargetFingerprint(before, after) {
  if (!before || !after || before !== after) {
    throw new Error("Migration refused: runtime database or artifact does not match the verified production migration state: DATABASE_URL changed between preflight and execution");
  }
}

function refuse(message) {
  throw new Error(`Migration refused: runtime database or artifact does not match the verified production migration state: ${message}`);
}

/**
 * Validate a ledger snapshot without mutating the database.  Kept separate
 * from the executable runner so its refusal rules can be unit tested.
 */
export function validatePreflight({ journalEntries, ledgerRows, canonicalTablesExist }) {
  if (!Array.isArray(journalEntries) || journalEntries.length === 0) {
    refuse("migration journal is empty");
  }
  const tags = journalEntries.map((entry) => entry.tag);
  if (!tags.includes(NEXT_MIGRATION_TAG)) {
    refuse(`${NEXT_MIGRATION_TAG} is missing from the runtime journal`);
  }
  if (!Array.isArray(ledgerRows) || ledgerRows.length === 0) {
    if (canonicalTablesExist) refuse("ledger is empty while canonical application tables exist");
    refuse("ledger is empty");
  }

  const byTimestamp = new Map(ledgerRows.map((row) => [Number(row.created_at), row]));
  const historyEnd = journalEntries.findIndex((entry) => entry.tag === REQUIRED_HISTORY_TAG);
  if (historyEnd < 0) refuse(`${REQUIRED_HISTORY_TAG} is missing from the runtime journal`);

  for (const entry of journalEntries.slice(0, historyEnd + 1)) {
    const recorded = byTimestamp.get(Number(entry.when));
    if (!recorded) refuse(`missing ledger row for ${entry.tag}`);
    if (recorded.hash !== entry.hash) refuse(`hash mismatch for ${entry.tag}`);
  }

  const journalByTimestamp = new Map(journalEntries.map((entry) => [Number(entry.when), entry]));
  const latest = [...ledgerRows].sort((a, b) => Number(a.created_at) - Number(b.created_at)).at(-1);
  const latestEntry = journalByTimestamp.get(Number(latest.created_at));
  if (!latestEntry) refuse(`latest ledger timestamp ${latest.created_at} is not in the runtime journal`);
  if (latestEntry.tag !== REQUIRED_HISTORY_TAG && latestEntry.tag !== NEXT_MIGRATION_TAG) {
    refuse(`latest recorded migration is ${latestEntry.tag}, expected ${REQUIRED_HISTORY_TAG} or ${NEXT_MIGRATION_TAG}`);
  }

  for (const row of ledgerRows) {
    const entry = journalByTimestamp.get(Number(row.created_at));
    if (!entry || entry.hash !== row.hash) refuse(`ledger row ${row.id} is not an exact runtime migration match`);
  }

  const pending = journalEntries.filter((entry) => !byTimestamp.has(Number(entry.when)));
  if (pending.some((entry) => entry.tag === "0000_groovy_black_bolt")) {
    refuse("migration 0000 would be pending");
  }
  if (pending.length > 1 || (pending.length === 1 && pending[0].tag !== NEXT_MIGRATION_TAG)) {
    refuse(`unexpected pending migrations: ${pending.map((entry) => entry.tag).join(", ") || "none"}`);
  }
  return { latestEntry, pending };
}

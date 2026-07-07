import { asc, eq, inArray } from "drizzle-orm";

import { loadScriptEnv } from "./load-script-env";

type FeaturedRow = {
  id: string;
  catalogBookId: string | null;
  bookId: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
};

type LegacyBookRow = {
  id: string;
  catalogBookId: string | null;
};

type RepairSummary = {
  mixedRefsFixed: number;
  duplicatesDeactivated: number;
  legacyRowsMigrated: number;
  warnings: string[];
  skipped: number;
  errors: string[];
};

const DRY_RUN = process.argv.includes("--dry-run");
const STRICT = process.env.FEATURED_REPAIR_STRICT === "true";

function log(message: string) {
  console.log(`[featured-repair] ${message}`);
}

async function main() {
  const { loadedFiles } = loadScriptEnv();

  if (!process.env.DATABASE_URL) {
    const loadedFilesText =
      loadedFiles.length > 0 ? loadedFiles.join(", ") : "none";
    const message =
      "DATABASE_URL is not set after loading env files. Checked .env.local, .env.production, and .env priority via Next env loading.";

    log(message);
    log(`Loaded env files: ${loadedFilesText}`);

    if (STRICT) {
      process.exit(1);
    }

    process.exit(0);
  }

  const [{ db }, { Book, HomeFeaturedBook }] = await Promise.all([
    import("@/db"),
    import("@/db/schema"),
  ]);

  async function loadFeaturedRows(): Promise<FeaturedRow[]> {
    return db
      .select({
        id: HomeFeaturedBook.id,
        catalogBookId: HomeFeaturedBook.catalogBookId,
        bookId: HomeFeaturedBook.bookId,
        sortOrder: HomeFeaturedBook.sortOrder,
        isActive: HomeFeaturedBook.isActive,
        createdAt: HomeFeaturedBook.createdAt,
      })
      .from(HomeFeaturedBook)
      .orderBy(asc(HomeFeaturedBook.sortOrder), asc(HomeFeaturedBook.createdAt));
  }

  async function loadLegacyBookMap(bookIds: string[]) {
    if (bookIds.length === 0) return new Map<string, LegacyBookRow>();

    const rows = await db
      .select({
        id: Book.id,
        catalogBookId: Book.catalogBookId,
      })
      .from(Book)
      .where(inArray(Book.id, bookIds));

    return new Map(rows.map((row) => [row.id, row]));
  }

  function resolveCanonicalCatalogBookId(
    row: FeaturedRow,
    legacyBookMap: Map<string, LegacyBookRow>,
  ) {
    if (row.catalogBookId) return row.catalogBookId;
    if (!row.bookId) return null;
    return legacyBookMap.get(row.bookId)?.catalogBookId ?? null;
  }

  async function maybeUpdateRow(
    id: string,
    set: Partial<typeof HomeFeaturedBook.$inferInsert>,
  ) {
    if (DRY_RUN) return;
    await db
      .update(HomeFeaturedBook)
      .set({ ...set, updatedAt: new Date() })
      .where(eq(HomeFeaturedBook.id, id));
  }

  const summary: RepairSummary = {
    mixedRefsFixed: 0,
    duplicatesDeactivated: 0,
    legacyRowsMigrated: 0,
    warnings: [],
    skipped: 0,
    errors: [],
  };

  const featuredRows = await loadFeaturedRows();
  const legacyBookIds = featuredRows
    .map((row) => row.bookId)
    .filter((value): value is string => Boolean(value));
  const legacyBookMap = await loadLegacyBookMap(legacyBookIds);

  for (const row of featuredRows) {
    if (row.catalogBookId && row.bookId) {
      await maybeUpdateRow(row.id, { bookId: null });
      summary.mixedRefsFixed += 1;
      log(`${DRY_RUN ? "would fix" : "fixed"} mixed refs for row ${row.id}`);
    }
  }

  const activeRows = featuredRows.filter((row) => row.isActive);
  const canonicalGroups = new Map<string, FeaturedRow[]>();

  for (const row of activeRows) {
    const canonicalCatalogBookId = resolveCanonicalCatalogBookId(
      row,
      legacyBookMap,
    );
    if (!canonicalCatalogBookId) continue;
    const group = canonicalGroups.get(canonicalCatalogBookId) ?? [];
    group.push(row);
    canonicalGroups.set(canonicalCatalogBookId, group);
  }

  for (const [canonicalCatalogBookId, rows] of canonicalGroups) {
    if (rows.length < 2) continue;

    const sorted = [...rows].sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
    const keeper = sorted[0];
    const duplicates = sorted.slice(1);

    if (!keeper.catalogBookId && keeper.bookId) {
      await maybeUpdateRow(keeper.id, {
        catalogBookId: canonicalCatalogBookId,
        bookId: null,
      });
      summary.legacyRowsMigrated += 1;
      log(
        `${DRY_RUN ? "would migrate" : "migrated"} keeper ${keeper.id} to catalog ${canonicalCatalogBookId}`,
      );
    }

    for (const duplicate of duplicates) {
      await maybeUpdateRow(duplicate.id, { isActive: false });
      summary.duplicatesDeactivated += 1;
      log(
        `${DRY_RUN ? "would deactivate" : "deactivated"} duplicate ${duplicate.id} for catalog ${canonicalCatalogBookId}`,
      );
    }
  }

  const postFixRows = await loadFeaturedRows();
  const postLegacyIds = postFixRows
    .map((row) => row.bookId)
    .filter((value): value is string => Boolean(value));
  const postLegacyMap = await loadLegacyBookMap(postLegacyIds);

  for (const row of postFixRows) {
    if (row.catalogBookId || !row.bookId) continue;
    const linkedCatalogBookId = postLegacyMap.get(row.bookId)?.catalogBookId ?? null;
    if (!linkedCatalogBookId) continue;

    const conflictingActive = postFixRows.find(
      (candidate) =>
        candidate.id !== row.id &&
        candidate.isActive &&
        resolveCanonicalCatalogBookId(candidate, postLegacyMap) ===
          linkedCatalogBookId,
    );

    if (conflictingActive) {
      summary.warnings.push(
        `legacy row ${row.id} resolves to catalog ${linkedCatalogBookId} but active row ${conflictingActive.id} already owns it`,
      );
      continue;
    }

    await maybeUpdateRow(row.id, {
      catalogBookId: linkedCatalogBookId,
      bookId: null,
    });
    summary.legacyRowsMigrated += 1;
    log(
      `${DRY_RUN ? "would migrate" : "migrated"} legacy row ${row.id} to catalog ${linkedCatalogBookId}`,
    );
  }

  log(
    JSON.stringify(
      {
        dryRun: DRY_RUN,
        mixedRefsFixed: summary.mixedRefsFixed,
        duplicatesDeactivated: summary.duplicatesDeactivated,
        legacyRowsMigrated: summary.legacyRowsMigrated,
        warnings: summary.warnings,
        skipped: summary.skipped,
        errors: summary.errors,
      },
      null,
      2,
    ),
  );
}

void main().catch((error) => {
  console.error("[featured-repair] failed:", error);
  if (STRICT) {
    process.exit(1);
  }
  process.exit(0);
});

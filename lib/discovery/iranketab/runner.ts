import type {
  IranKetabDiscoveryCandidate,
} from "./collection-parser";
import { parseIranKetabCollectionPage } from "./collection-parser";
import type { IranKetabDiscoverySourceType } from "./collection-fetch";
import { detectIranKetabNextPageUrl } from "./pagination";

export const DEFAULT_DISCOVERY_MAX_PAGES = 100;
export const DEFAULT_DISCOVERY_MAX_BOOKS = 10_000;

export type IranKetabDiscoveryRunDiagnostics = {
  pagesFetched: number;
  discoveredPages: string[];
  paginationDetected: boolean;
  paginationUsed: boolean;
  firstPageUrl: string | null;
  detectedNextPageUrl: string | null;
  lastPageUrl: string | null;
  stoppedReason: "NO_NEXT_PAGE" | "DUPLICATE_PAGE" | "MAX_PAGES" | "MAX_DISCOVERED_BOOKS";
};

export type IranKetabDiscoverySourceForRun = {
  id: string;
  sourceUrl: string;
  sourceType: IranKetabDiscoverySourceType;
  enabled: boolean;
  parserVersion: number;
};

export type IranKetabDiscoveryRunRepository = {
  getSource(sourceId: string): Promise<IranKetabDiscoverySourceForRun | null>;
  createRun(sourceId: string): Promise<{ id: string }>;
  markSourceRunning(sourceId: string): Promise<void>;
  upsertCandidate(input: {
    sourceId: string;
    candidate: IranKetabDiscoveryCandidate;
  }): Promise<{ itemId: string; itemCreated: boolean; itemUpdated: boolean }>;
  completeRun(input: {
    sourceId: string;
    runId: string;
    booksFound: number;
    itemsInserted: number;
    itemsUpdated: number;
    pagesFetched: number;
    diagnostics: IranKetabDiscoveryRunDiagnostics;
  }): Promise<void>;
  failRun(input: {
    sourceId: string;
    runId: string;
    booksFound: number;
    itemsInserted: number;
    itemsUpdated: number;
    pagesFetched: number;
    diagnostics: IranKetabDiscoveryRunDiagnostics;
    errorCode: string;
    errorMessage: string;
  }): Promise<void>;
};

export type RunIranKetabDiscoverySourceDependencies = {
  repository: IranKetabDiscoveryRunRepository;
  fetchCollection: (
    sourceUrl: string,
    sourceType: IranKetabDiscoverySourceType,
  ) => Promise<{ canonicalUrl: string; html: string }>;
  parseCollection?: typeof parseIranKetabCollectionPage;
  scoreItem?: (discoveryItemId: string) => Promise<unknown>;
  maxPages?: number;
  maxDiscoveredBooks?: number;
};

export class IranKetabDiscoveryRunError extends Error {
  constructor(
    public readonly code:
      | "DISCOVERY_SOURCE_NOT_FOUND"
      | "DISCOVERY_SOURCE_DISABLED"
      | "DISCOVERY_CANDIDATE_PERSISTENCE_FAILED"
      | "DISCOVERY_RUN_FAILED",
    message: string,
    public readonly retryable = false,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "IranKetabDiscoveryRunError";
  }
}

export async function runIranKetabDiscoverySource(
  sourceId: string,
  dependencies: RunIranKetabDiscoverySourceDependencies,
) {
  const source = await dependencies.repository.getSource(sourceId);
  if (!source)
    throw new IranKetabDiscoveryRunError("DISCOVERY_SOURCE_NOT_FOUND", "منبع کشف یافت نشد.");
  if (!source.enabled)
    throw new IranKetabDiscoveryRunError("DISCOVERY_SOURCE_DISABLED", "منبع کشف غیرفعال است.");

  const run = await dependencies.repository.createRun(source.id);
  await dependencies.repository.markSourceRunning(source.id);
  let booksFound = 0;
  let itemsInserted = 0;
  let itemsUpdated = 0;
  let runFinalized = false;
  const maxPages = boundedLimit(dependencies.maxPages, DEFAULT_DISCOVERY_MAX_PAGES);
  const maxDiscoveredBooks = boundedLimit(dependencies.maxDiscoveredBooks, DEFAULT_DISCOVERY_MAX_BOOKS);
  const diagnostics: IranKetabDiscoveryRunDiagnostics = {
    pagesFetched: 0,
    discoveredPages: [],
    paginationDetected: false,
    paginationUsed: false,
    firstPageUrl: null,
    detectedNextPageUrl: null,
    lastPageUrl: null,
    stoppedReason: "NO_NEXT_PAGE",
  };

  try {
    const parse = dependencies.parseCollection ?? parseIranKetabCollectionPage;
    const candidates = new Map<string, IranKetabDiscoveryCandidate>();
    const visitedPages = new Set<string>();
    let nextPageUrl: string | null = source.sourceUrl;

    while (nextPageUrl && diagnostics.pagesFetched < maxPages && candidates.size < maxDiscoveredBooks) {
      const fetched = await dependencies.fetchCollection(nextPageUrl, source.sourceType);
      if (visitedPages.has(fetched.canonicalUrl)) {
        diagnostics.stoppedReason = "DUPLICATE_PAGE";
        break;
      }
      visitedPages.add(fetched.canonicalUrl);
      diagnostics.pagesFetched += 1;
      diagnostics.discoveredPages.push(fetched.canonicalUrl);
      if (!diagnostics.firstPageUrl) diagnostics.firstPageUrl = fetched.canonicalUrl;
      diagnostics.lastPageUrl = fetched.canonicalUrl;

      for (const candidate of parse({ html: fetched.html, pageUrl: fetched.canonicalUrl })) {
        if (candidates.size >= maxDiscoveredBooks) {
          diagnostics.stoppedReason = "MAX_DISCOVERED_BOOKS";
          break;
        }
        if (!candidates.has(candidate.iranKetabBookId)) candidates.set(candidate.iranKetabBookId, candidate);
      }
      if (diagnostics.stoppedReason === "MAX_DISCOVERED_BOOKS") break;

      const detectedNextPage = detectIranKetabNextPageUrl(fetched.html, fetched.canonicalUrl);
      if (!detectedNextPage) {
        diagnostics.stoppedReason = "NO_NEXT_PAGE";
        break;
      }
      diagnostics.paginationDetected = true;
      diagnostics.detectedNextPageUrl = detectedNextPage;
      if (visitedPages.has(detectedNextPage)) {
        diagnostics.stoppedReason = "DUPLICATE_PAGE";
        break;
      }
      nextPageUrl = detectedNextPage;
      diagnostics.paginationUsed = true;
      if (diagnostics.pagesFetched >= maxPages) diagnostics.stoppedReason = "MAX_PAGES";
    }

    if (diagnostics.pagesFetched >= maxPages && nextPageUrl && diagnostics.stoppedReason !== "DUPLICATE_PAGE") diagnostics.stoppedReason = "MAX_PAGES";
    booksFound = candidates.size;
    const failures: unknown[] = [];

    for (const candidate of candidates.values()) {
      try {
        const result = await dependencies.repository.upsertCandidate({
          sourceId: source.id,
          candidate,
        });
        if (result.itemCreated) itemsInserted += 1;
        if (result.itemUpdated) itemsUpdated += 1;
        await dependencies.scoreItem?.(result.itemId);
      } catch (error) {
        failures.push(error);
      }
    }

    if (failures.length) {
      const error = new IranKetabDiscoveryRunError(
        "DISCOVERY_CANDIDATE_PERSISTENCE_FAILED",
        `${failures.length} کتاب از منبع ذخیره نشد.`,
        true,
        { cause: failures[0] },
      );
      await dependencies.repository.failRun({
        sourceId: source.id,
        runId: run.id,
        booksFound,
        itemsInserted,
        itemsUpdated,
        pagesFetched: diagnostics.pagesFetched,
        diagnostics,
        errorCode: error.code,
        errorMessage: error.message,
      });
      runFinalized = true;
      throw error;
    }

    await dependencies.repository.completeRun({
      sourceId: source.id,
      runId: run.id,
      booksFound,
      itemsInserted,
      itemsUpdated,
      pagesFetched: diagnostics.pagesFetched,
      diagnostics,
    });
    runFinalized = true;
    return { runId: run.id, booksFound, itemsInserted, itemsUpdated };
  } catch (error) {
    if (!runFinalized) {
      await dependencies.repository.failRun({
        sourceId: source.id,
        runId: run.id,
        booksFound,
        itemsInserted,
        itemsUpdated,
        pagesFetched: diagnostics.pagesFetched,
        diagnostics,
        errorCode: errorCode(error),
        errorMessage: errorMessage(error),
      });
    }
    if (error instanceof IranKetabDiscoveryRunError) throw error;
    throw new IranKetabDiscoveryRunError(
      "DISCOVERY_RUN_FAILED",
      "اجرای کشف منبع ناموفق بود.",
      true,
      { cause: error },
    );
  }
}

function boundedLimit(value: number | undefined, fallback: number) {
  return Math.max(1, Math.trunc(value ?? fallback));
}

function errorCode(error: unknown) {
  return error instanceof Error && "code" in error && typeof error.code === "string"
    ? error.code
    : "DISCOVERY_RUN_FAILED";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 2_000) : "اجرای کشف منبع ناموفق بود.";
}

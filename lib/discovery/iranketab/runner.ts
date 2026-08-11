import type {
  IranKetabDiscoveryCandidate,
} from "./collection-parser";
import { parseIranKetabCollectionPage } from "./collection-parser";
import type { IranKetabDiscoverySourceType } from "./collection-fetch";

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
  }): Promise<void>;
  failRun(input: {
    sourceId: string;
    runId: string;
    booksFound: number;
    itemsInserted: number;
    itemsUpdated: number;
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

  try {
    const fetched = await dependencies.fetchCollection(source.sourceUrl, source.sourceType);
    const parse = dependencies.parseCollection ?? parseIranKetabCollectionPage;
    const candidates = parse({ html: fetched.html, pageUrl: fetched.canonicalUrl });
    booksFound = candidates.length;
    const failures: unknown[] = [];

    for (const candidate of candidates) {
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

function errorCode(error: unknown) {
  return error instanceof Error && "code" in error && typeof error.code === "string"
    ? error.code
    : "DISCOVERY_RUN_FAILED";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message.slice(0, 2_000) : "اجرای کشف منبع ناموفق بود.";
}

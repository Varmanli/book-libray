import assert from "node:assert/strict";
import test from "node:test";

import { IranKetabDiscoveryRunError, runIranKetabDiscoverySource, type IranKetabDiscoveryRunRepository } from "./runner";

function repository(events: string[]): IranKetabDiscoveryRunRepository {
  return {
    getSource: async () => ({ id: "source-1", sourceUrl: "https://www.iranketab.ir/booklist/example", sourceType: "CURATED_LIST", enabled: true, parserVersion: 1 }),
    createRun: async () => { events.push("create-run"); return { id: "run-1" }; },
    markSourceRunning: async () => { events.push("mark-running"); },
    upsertCandidate: async () => ({ itemId: "item-1", itemCreated: true, itemUpdated: false }),
    completeRun: async () => { events.push("complete-run"); },
    failRun: async (input) => { events.push(`fail-run:${input.errorCode}`); },
  };
}

test("an enabled source creates and completes a discovery run", async () => {
  const events: string[] = [];
  const result = await runIranKetabDiscoverySource("source-1", {
    repository: repository(events),
    fetchCollection: async () => ({ canonicalUrl: "https://www.iranketab.ir/booklist/example", html: "unused" }),
    parseCollection: () => [{ iranKetabBookId: "123", canonicalUrl: "https://www.iranketab.ir/book/123", titleHint: "Book", authorHint: null, preferredEditionCode: null, sourcePosition: 1 }],
  });
  assert.deepEqual(result, { runId: "run-1", booksFound: 1, itemsInserted: 1, itemsUpdated: 0 });
  assert.deepEqual(events, ["create-run", "mark-running", "complete-run"]);
});

test("a failed discovery records a failed run and exposes the failure", async () => {
  const events: string[] = [];
  await assert.rejects(
    runIranKetabDiscoverySource("source-1", {
      repository: repository(events),
      fetchCollection: async () => { throw new Error("IranKetab is unavailable"); },
    }),
    (error: unknown) => error instanceof IranKetabDiscoveryRunError && error.code === "DISCOVERY_RUN_FAILED",
  );
  assert.deepEqual(events, ["create-run", "mark-running", "fail-run:DISCOVERY_RUN_FAILED"]);
});

test("runner crawls multiple pages, prevents duplicate pages, and records pagination diagnostics", async () => {
  const completed: Array<{ pagesFetched: number; booksFound: number; diagnostics: unknown }> = [];
  const repo = repository([]);
  repo.completeRun = async (input) => { completed.push({ pagesFetched: input.pagesFetched, booksFound: input.booksFound, diagnostics: input.diagnostics }); };
  const pages = new Map([
    ["https://www.iranketab.ir/booklist/example", '<a href="/book/1-first">First</a><button data-page-index="1" class="paging-item active">1</button><button data-page-index="2" class="paging-item next">2</button>'],
    ["https://www.iranketab.ir/booklist/example?page=2", '<a href="/book/2-second">Second</a><a rel="next" href="/booklist/example">next</a>'],
  ]);
  const result = await runIranKetabDiscoverySource("source-1", {
    repository: repo,
    fetchCollection: async (url) => ({ canonicalUrl: url, html: pages.get(url) ?? "" }),
  });

  assert.equal(result.booksFound, 2);
  assert.deepEqual(completed, [{
    pagesFetched: 2,
    booksFound: 2,
    diagnostics: {
      pagesFetched: 2,
      discoveredPages: ["https://www.iranketab.ir/booklist/example", "https://www.iranketab.ir/booklist/example?page=2"],
      paginationDetected: true,
      paginationUsed: true,
      firstPageUrl: "https://www.iranketab.ir/booklist/example",
      detectedNextPageUrl: "https://www.iranketab.ir/booklist/example",
      lastPageUrl: "https://www.iranketab.ir/booklist/example?page=2",
      stoppedReason: "DUPLICATE_PAGE",
    },
  }]);
});

test("runner stops at the configured maximum page limit", async () => {
  const completed: Array<{ pagesFetched: number; diagnostics: { stoppedReason: string } }> = [];
  const repo = repository([]);
  repo.completeRun = async (input) => { completed.push({ pagesFetched: input.pagesFetched, diagnostics: input.diagnostics }); };
  await runIranKetabDiscoverySource("source-1", {
    repository: repo,
    maxPages: 2,
    fetchCollection: async (url) => {
      const page = Number(new URL(url).searchParams.get("page") ?? "1");
      return { canonicalUrl: url, html: `<a rel="next" href="?page=${page + 1}">next</a>` };
    },
  });
  assert.deepEqual(completed, [{ pagesFetched: 2, diagnostics: { pagesFetched: 2, discoveredPages: ["https://www.iranketab.ir/booklist/example", "https://www.iranketab.ir/booklist/example?page=2"], paginationDetected: true, paginationUsed: true, firstPageUrl: "https://www.iranketab.ir/booklist/example", detectedNextPageUrl: "https://www.iranketab.ir/booklist/example?page=3", lastPageUrl: "https://www.iranketab.ir/booklist/example?page=2", stoppedReason: "MAX_PAGES" } }]);
});

test("runner stops after a single page when no next link exists", async () => {
  const completed: Array<{ pagesFetched: number; diagnostics: { paginationUsed: boolean; stoppedReason: string } }> = [];
  const repo = repository([]);
  repo.completeRun = async (input) => { completed.push({ pagesFetched: input.pagesFetched, diagnostics: input.diagnostics }); };
  await runIranKetabDiscoverySource("source-1", {
    repository: repo,
    fetchCollection: async (url) => ({ canonicalUrl: url, html: '<a href="/book/1-first">First</a>' }),
  });
  assert.equal(completed[0]?.pagesFetched, 1);
  assert.equal(completed[0]?.diagnostics.paginationUsed, false);
  assert.equal(completed[0]?.diagnostics.stoppedReason, "NO_NEXT_PAGE");
});

test("runner stops before persisting more than the discovered-book safety limit", async () => {
  const completed: Array<{ booksFound: number; diagnostics: { stoppedReason: string } }> = [];
  const repo = repository([]);
  repo.completeRun = async (input) => { completed.push({ booksFound: input.booksFound, diagnostics: input.diagnostics }); };
  await runIranKetabDiscoverySource("source-1", {
    repository: repo,
    maxDiscoveredBooks: 1,
    fetchCollection: async (url) => ({ canonicalUrl: url, html: '<a href="/book/1-first">First</a><a href="/book/2-second">Second</a>' }),
  });
  assert.equal(completed[0]?.booksFound, 1);
  assert.equal(completed[0]?.diagnostics.stoppedReason, "MAX_DISCOVERED_BOOKS");
});

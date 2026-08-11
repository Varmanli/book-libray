import assert from "node:assert/strict";
import test from "node:test";

import { parseIranKetabCollectionPage } from "./collection-parser";
import { runIranKetabDiscoverySource, type IranKetabDiscoveryRunRepository } from "./runner";

test("collection parser extracts canonical book candidates and their hints", () => {
  const candidates = parseIranKetabCollectionPage({
    pageUrl: "https://www.iranketab.ir/tag/15-literary-award",
    html: `
      <article class="product-card" data-entity-id="466">
        <a href="/book/466-the-moonstone#pts=74956" title="ماه الماس">
          <h5>ماه الماس</h5><h6>ویلکی کالینز</h6>
        </a>
      </article>
      <article class="product-card">
        <a href="https://iranketab.ir/book/50387-the-woman-in-white"><h5>زن سفیدپوش</h5><h6>ویلکی کالینز</h6></a>
      </article>
      <a href="/profile/617-wilkie-collins">نویسنده</a>
      <a href="https://example.com/book/1-not-iran-ketab">نامعتبر</a>
    `,
  });

  assert.deepEqual(candidates, [
    {
      iranKetabBookId: "466",
      canonicalUrl: "https://www.iranketab.ir/book/466-the-moonstone",
      titleHint: "ماه الماس",
      authorHint: "ویلکی کالینز",
      preferredEditionCode: "74956",
      sourcePosition: 1,
    },
    {
      iranKetabBookId: "50387",
      canonicalUrl: "https://www.iranketab.ir/book/50387-the-woman-in-white",
      titleHint: "زن سفیدپوش",
      authorHint: "ویلکی کالینز",
      preferredEditionCode: null,
      sourcePosition: 2,
    },
  ]);
});

test("collection parser deduplicates repeated book links while retaining the earliest rank", () => {
  const candidates = parseIranKetabCollectionPage({
    pageUrl: "https://www.iranketab.ir/tag/1-recommended-list",
    html: `
      <a href="/book/466-the-moonstone#pts=74956" title="ماه الماس">ماه الماس</a>
      <a href="/book/466-the-moonstone#pts=190241" title="ماه الماس">ماه الماس</a>
    `,
  });

  assert.equal(candidates.length, 1);
  assert.equal(candidates[0]?.iranKetabBookId, "466");
  assert.equal(candidates[0]?.sourcePosition, 1);
  assert.equal(candidates[0]?.preferredEditionCode, "74956");
});

test("runner preserves one item identity while recording memberships from multiple sources", async () => {
  const itemIds = new Map<string, string>();
  const memberships = new Set<string>();
  const completed: Array<{ sourceId: string; booksFound: number }> = [];
  let nextItem = 1;
  let nextRun = 1;
  const sources = new Map([
    ["source-a", { id: "source-a", sourceUrl: "https://www.iranketab.ir/tag/1-a", sourceType: "TAG" as const, enabled: true, parserVersion: 1 }],
    ["source-b", { id: "source-b", sourceUrl: "https://www.iranketab.ir/tag/2-b", sourceType: "TAG" as const, enabled: true, parserVersion: 1 }],
  ]);
  const repository: IranKetabDiscoveryRunRepository = {
    getSource: async (id) => sources.get(id) ?? null,
    createRun: async () => ({ id: `run-${nextRun++}` }),
    markSourceRunning: async () => undefined,
    upsertCandidate: async ({ sourceId, candidate }) => {
      const existing = itemIds.get(candidate.iranKetabBookId);
      const itemId = existing ?? `item-${nextItem++}`;
      itemIds.set(candidate.iranKetabBookId, itemId);
      memberships.add(`${itemId}:${sourceId}`);
      return { itemId, itemCreated: !existing, itemUpdated: Boolean(existing) };
    },
    completeRun: async (input) => {
      completed.push({ sourceId: input.sourceId, booksFound: input.booksFound });
    },
    failRun: async () => undefined,
  };
  const fetchCollection = async () => ({
    canonicalUrl: "https://www.iranketab.ir/tag/example",
    html: '<a href="/book/466-the-moonstone" title="ماه الماس">ماه الماس</a>',
  });

  await runIranKetabDiscoverySource("source-a", { repository, fetchCollection });
  await runIranKetabDiscoverySource("source-b", { repository, fetchCollection });

  assert.equal(itemIds.size, 1);
  assert.deepEqual([...memberships].sort(), ["item-1:source-a", "item-1:source-b"]);
  assert.deepEqual(completed, [
    { sourceId: "source-a", booksFound: 1 },
    { sourceId: "source-b", booksFound: 1 },
  ]);
});

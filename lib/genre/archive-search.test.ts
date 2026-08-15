import assert from "node:assert/strict";
import test from "node:test";

import {
  GENRE_ARCHIVE_PAGE_SIZE,
  genreNameMatchesQuery,
  getGenreArchivePageCount,
  normalizeGenreArchivePage,
  parseGenreArchiveSearchParams,
} from "./archive-search";
import { eligibleGenreRows } from "./query";

const rows = [
  { slug: "adabiat-farsi", name: "ادبیات فارسی", bookCount: 8 },
  { slug: "adabiat-jahan", name: "ادبیات جهان", bookCount: 6 },
  { slug: "tarikh", name: "تاریخ", bookCount: 4 },
  { slug: "empty", name: "بدون کتاب", bookCount: 0 },
  { slug: null, name: "بدون اسلاگ", bookCount: 5 },
];

function archiveFixture(q: string, page: number, pageSize = 1) {
  const eligible = eligibleGenreRows(rows).filter((row) => genreNameMatchesQuery(row.name, q));
  const total = eligible.length;
  const normalizedPage = normalizeGenreArchivePage(page, total, pageSize);
  return {
    items: eligible.slice((normalizedPage - 1) * pageSize, normalizedPage * pageSize),
    total,
    page: normalizedPage,
    pageCount: getGenreArchivePageCount(total, pageSize),
  };
}

test("Genre search finds expected public Genre names", () => {
  assert.deepEqual(
    archiveFixture("ادبیات", 1).items.map((row) => row.name),
    ["ادبیات فارسی"],
  );
});

test("empty Genre search retains eligible rows and excludes empty catalog references", () => {
  assert.deepEqual(
    archiveFixture("", 1, 10).items.map((row) => row.name),
    ["ادبیات فارسی", "ادبیات جهان", "تاریخ"],
  );
});

test("Genre pagination has correct totals and does not duplicate pages", () => {
  const first = archiveFixture("", 1);
  const second = archiveFixture("", 2);

  assert.equal(first.total, 3);
  assert.equal(first.pageCount, 3);
  assert.notDeepEqual(first.items.map((row) => row.slug), second.items.map((row) => row.slug));
  assert.deepEqual(second.items.map((row) => row.name), ["ادبیات جهان"]);
});

test("Genre search and pagination work together", () => {
  const result = archiveFixture("ادبیات", 2);

  assert.equal(result.total, 2);
  assert.equal(result.pageCount, 2);
  assert.deepEqual(result.items.map((row) => row.name), ["ادبیات جهان"]);
});

test("invalid pages normalize safely and no-result searches return an empty archive page", () => {
  assert.deepEqual(parseGenreArchiveSearchParams({ q: ["تاریخ", "ignored"], page: "nope" }), {
    q: "تاریخ",
    page: 1,
  });
  assert.equal(normalizeGenreArchivePage(99, 3, 2), 2);
  assert.deepEqual(archiveFixture("ناموجود", 4), {
    items: [],
    total: 0,
    page: 1,
    pageCount: 0,
  });
  assert.equal(GENRE_ARCHIVE_PAGE_SIZE, 20);
});

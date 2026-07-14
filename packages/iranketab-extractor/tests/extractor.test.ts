import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  IranKetabExtractionError,
  dedupeIranKetabEditions,
  extractIranKetabBook,
  extractIranKetabEditionCode,
  normalizeEditionIsbn,
  normalizeIranKetabBookUrl,
  normalizePersianText,
  parseIranKetabBookPage,
  type GhafasehEdition,
  type ParsedEditionSnapshot
} from "../src/index.js";

const fixtureRoot = path.resolve(import.meta.dirname, "../fixtures");
const fixture = (name: string) => readFile(path.join(fixtureRoot, name, "raw-page.html"), "utf8");

test("White Nights fixture preserves catalog and deduplicated editions", async () => {
  const result = await extractIranKetabBook({ url: "https://www.iranketab.ir/book/1045-white-nights#pts=2405", html: await fixture("white-nights") });
  assert.equal(result.contractVersion, 1);
  assert.equal(result.source.canonicalUrl, "https://www.iranketab.ir/book/1045-white-nights");
  assert.equal(result.source.editionCode, "2405");
  assert.equal(result.book.title, "شب های روشن");
  assert.equal(result.book.originalTitle, "White Nights");
  assert.equal(result.book.authors[0]?.name, "فئودور داستایفسکی");
  assert.ok((result.book.description?.length ?? 0) > 100);
  assert.equal(result.editions.length, 23);
  assert.equal(result.editions[0]?.sourceEditionCode, "2405");
  assert.equal(result.editions[0]?.publisher.name, "ماهی");
  assert.equal(result.editions[0]?.translators[0]?.name, "سروش حبیبی");
  assert.equal(result.editions[0]?.isbn13, "9789642090839");
  assert.ok((result.diagnostics.coverCandidatesByEdition["2405"]?.length ?? 0) > 0);
  assert.deepEqual(result.editions.slice(0, 3).map(edition => edition.sourceEditionCode), ["2405", "128679", "1045"]);
});

test("Foucault fixture preserves identity and duplicate preference", async () => {
  const result = await extractIranKetabBook({ url: "https://www.iranketab.ir/book/1896-foucault-s-pendulum", html: await fixture("foucaults-pendulum") });
  assert.equal(result.book.title, "آونگ فوکو");
  assert.equal(result.book.originalTitle, "Foucault's Pendulum");
  assert.equal(result.book.authors[0]?.name, "اومبرتو اکو");
  assert.equal(result.diagnostics.editionsParsed, 2);
  assert.equal(result.editions.length, 1);
  assert.equal(result.editions[0]?.sourceEditionCode, "1896");
  assert.equal(result.editions[0]?.publisher.name, "روزنه");
  assert.equal(result.editions[0]?.translators[0]?.name, "رضا علیزاده");
  assert.equal(result.editions[0]?.isbn13, "9789643343187");
});

test("URL helpers normalize fragments and reject unsupported hosts", () => {
  assert.equal(normalizeIranKetabBookUrl(" https://www.iranketab.ir/book/1-x#pts=42 "), "https://www.iranketab.ir/book/1-x");
  assert.equal(extractIranKetabEditionCode("https://iranketab.ir/book/1-x#pts=42"), "42");
  assert.throws(() => normalizeIranKetabBookUrl("not a url"), (error: unknown) => error instanceof IranKetabExtractionError && error.code === "INVALID_URL");
  assert.throws(() => normalizeIranKetabBookUrl("https://example.com/book/1"), (error: unknown) => error instanceof IranKetabExtractionError && error.code === "UNSUPPORTED_HOST");
});

test("normalization preserves established Persian and ISBN behavior", () => {
  assert.equal(normalizePersianText("  كتاب‌ يار  "), "کتاب یار");
  assert.equal(normalizeEditionIsbn("978-964-209-083-9"), "9789642090839");
  assert.equal(normalizeEditionIsbn("0-306-40615-2"), "0306406152");
});

test("parser tolerates optional description and translator", () => {
  const html = '<html><head></head><body><h1>کتاب نمونه</h1><div itemtype="http://schema.org/Book"></div><div id="p-7"><h2 itemprop="name">کتاب نمونه</h2><div>انتشارات: ناشر نمونه شابک: 978-1-23 تعداد صفحه: 10</div></div></body></html>';
  const parsed = parseIranKetabBookPage({ html, pageUrl: "https://www.iranketab.ir/book/7-sample", selectedEditionCode: null, selectedOnly: false });
  assert.equal(parsed.book.description, null);
  assert.deepEqual(parsed.book.editions[0]?.translators, []);
});

test("malformed HTML and empty edition collections remain diagnosable", async () => {
  await assert.rejects(extractIranKetabBook({ url: "https://www.iranketab.ir/book/7-sample", html: "<html></html>" }), (error: unknown) => error instanceof IranKetabExtractionError && error.code === "BOOK_TITLE_MISSING");
  const parsed = parseIranKetabBookPage({ html: "<h1>نمونه</h1>", pageUrl: "https://www.iranketab.ir/book/7-sample", selectedEditionCode: null, selectedOnly: false });
  assert.equal(parsed.editionsParsed, 0);
});

test("dedupe keeps the more complete established edition", () => {
  const base: GhafasehEdition = { titleOverride: "نمونه", translators: [], publisher: { name: "ناشر", slug: "nasher" }, isbn10: null, isbn13: null, publishedYear: null, pageCount: null, coverFilename: "a.jpg", coverUrl: null, editionDescription: null, status: "approved", sourceName: "iranketab", sourceUrl: "https://www.iranketab.ir/book/1#pts=1", sourceEditionCode: "1" };
  const complete = { ...base, isbn13: "9780000000000", pageCount: 100, publishedYear: 1400, sourceEditionCode: "2", sourceUrl: "https://www.iranketab.ir/book/1#pts=2" };
  const snapshots: ParsedEditionSnapshot[] = [base, complete].map((edition, index) => ({ sourceEditionCode: edition.sourceEditionCode, titleRaw: "نمونه", titleOverride: "نمونه", publisher: "ناشر", translators: [], isbn13: edition.isbn13, pageCount: edition.pageCount, publishedYear: edition.publishedYear, votes: index, rating: null, selected: false, duplicateKey: "nasher||نمونه" }));
  const result = dedupeIranKetabEditions([base, complete], snapshots, {});
  assert.equal(result.editions.length, 1);
  assert.equal(result.editions[0]?.sourceEditionCode, "2");
});



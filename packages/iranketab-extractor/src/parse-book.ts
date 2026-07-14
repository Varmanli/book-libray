import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

import type {
  GhafasehAuthor,
  GhafasehBookImport,
  GhafasehCountry,
  GhafasehEdition,
  GhafasehGenre
} from "./contract.js";
import {
  buildAuthor,
  buildCoverFilename,
  cleanTitle,
  dedupeGenres,
  inferCountryFromGenres,
  normalizeTitleForDedup,
  normalizeWhitespace,
  parseNullableInt,
  slugify
} from "./normalize.js";
import { extractBookDescription } from "./description.js";
import type { RelatedProfileCandidate } from "./types.js";

type ParsedEditionCandidate = {
  edition: GhafasehEdition;
  sourceEditionCode: string;
  titleRaw: string;
  translatorNames: string[];
  publisherName: string;
  publishedYear: number | null;
  pageCount: number | null;
  votes: number;
  rating: number | null;
  selected: boolean;
  score: number;
  duplicateKey: string;
};

type BlockSelection = cheerio.Cheerio<AnyNode>;

export type ParseBookResult = {
  book: GhafasehBookImport;
  warnings: string[];
  needsReview: string[];
  descriptionCompleteness: "full" | "partial" | "missing";
  parsedEditions: Array<{
    sourceEditionCode: string;
    titleRaw: string;
    titleOverride: string;
    publisher: string;
    translators: string[];
    isbn13: string | null;
    pageCount: number | null;
    publishedYear: number | null;
    votes: number;
    rating: number | null;
    selected: boolean;
    duplicateKey: string;
  }>;
  editionsParsed: number;
  editionsAfterDedup: number;
  genres: GhafasehGenre[];
  metaDescription: string | null;
  relatedProfiles: RelatedProfileCandidate[];
};

export function parseIranKetabBookPage(input: {
  html: string;
  pageUrl: string;
  selectedEditionCode: string | null;
  selectedOnly: boolean;
  limit?: number;
}): ParseBookResult {
  const $ = cheerio.load(input.html);
  const warnings: string[] = [];
  const needsReview: string[] = [];
  const relatedProfiles: RelatedProfileCandidate[] = [];
  const usedFilenames = new Set<string>();
  const section = $('div[itemtype="http://schema.org/Book"]').first();
  const selectedCode = input.selectedEditionCode;
  const metaDescription = $('meta[name="description"]').attr("content")?.trim() ?? null;

  const genres = parseGenres($);
  const country = inferCountryFromGenres(genres);
  const firstPublishedYear =
    parseNullableInt(section.find('meta[itemprop="datePublished"]').first().attr("content")) ?? null;
  if (!firstPublishedYear) {
    needsReview.push("firstPublishedYear missing");
  }

  const firstBlock = $('div[id^="p-"]').first();
  const titleCandidates = $('h1, h2[itemprop="name"], h2').toArray().map((element) => $(element).text());
  const rawBookTitle =
    cleanTitle(titleCandidates.find((value) => cleanTitle(value)) ?? "") ||
    cleanTitle($('meta[property="og:title"]').attr("content")?.replace(/^کتاب\s+/, "").split(" اثر ")[0] ?? "");
  const bookTitle = normalizeWhitespace(rawBookTitle);

  const originalTitle =
    normalizeWhitespace(firstBlock.find(".ltr").first().text()) || null;
  if (!originalTitle) {
    needsReview.push("originalTitle missing");
  }

  const primaryAuthor = parsePrimaryAuthor($, firstBlock, country, relatedProfiles);
  const authors = primaryAuthor ? [primaryAuthor] : [];
  if (!primaryAuthor?.originalName) {
    needsReview.push("author originalName missing");
  }

  const descriptionResult = extractBookDescription({ $ });
  if (descriptionResult.completeness !== "full") {
    needsReview.push("description may need manual rewrite");
  }

  const bookSlug = slugify(
    originalTitle ??
      bookTitle ??
      new URL(input.pageUrl).pathname.split("/").pop() ??
      "book"
  );
  const rawEditions = $('div[id^="p-"]').toArray().map((element) =>
    parseEditionBlock({
      $,
      block: $(element),
      pageUrl: input.pageUrl,
      bookTitle,
      bookSlug,
      selectedEditionCode: selectedCode,
      usedFilenames,
      relatedProfiles
    })
  );

  const parsedCandidates = rawEditions.filter((edition): edition is ParsedEditionCandidate => Boolean(edition));
  const sorted = sortEditions(parsedCandidates);
  const filtered = input.selectedOnly && selectedCode
    ? sorted.filter((edition) => edition.sourceEditionCode === selectedCode)
    : sorted;
  const limited = input.limit ? filtered.slice(0, input.limit) : filtered;

  if (input.selectedOnly && selectedCode && limited.length === 0) {
    warnings.push(`Selected edition ${selectedCode} was not found after parsing`);
    needsReview.push("selected edition not found");
  }

  const book: GhafasehBookImport = {
    title: bookTitle,
    subtitle: null,
    originalTitle,
    authors,
    language: "fa",
    description: descriptionResult.description ?? metaDescription,
    genres,
    country: country ?? authors[0]?.country ?? null,
    firstPublishedYear,
    status: "approved",
    sourceName: "iranketab",
    sourceUrl: input.pageUrl,
    editions: limited.map((candidate) => candidate.edition)
  };

  return {
    book,
    warnings,
    needsReview,
    descriptionCompleteness: descriptionResult.completeness,
    parsedEditions: parsedCandidates.map((candidate) => ({
      sourceEditionCode: candidate.sourceEditionCode,
      titleRaw: candidate.titleRaw,
      titleOverride: candidate.edition.titleOverride,
      publisher: candidate.publisherName,
      translators: candidate.translatorNames,
      isbn13: candidate.edition.isbn13,
      pageCount: candidate.pageCount,
      publishedYear: candidate.publishedYear,
      votes: candidate.votes,
      rating: candidate.rating,
      selected: candidate.selected,
      duplicateKey: candidate.duplicateKey
    })),
    editionsParsed: parsedCandidates.length,
    editionsAfterDedup: limited.length,
    genres,
    metaDescription,
    relatedProfiles: dedupeRelatedProfiles(relatedProfiles)
  };
}

function parsePrimaryAuthor(
  $: cheerio.CheerioAPI,
  firstBlock: BlockSelection,
  country: GhafasehCountry | null,
  relatedProfiles: RelatedProfileCandidate[]
): GhafasehAuthor | null {
  const authorRow = findInfoRow($, firstBlock, /^نویسنده:/);
  const authorLink =
    authorRow?.find('a[href*="/profile/"]').first() ??
    $('a[href*="/profile/"]').filter((_, element) => $(element).text().includes("فئودور")).first();

  const name =
    normalizeWhitespace(authorLink.find('[itemprop="name"]').first().text()) ||
    normalizeWhitespace(authorLink.text());

  if (!name) {
    return null;
  }

  const slugHint = authorLink.attr("href")?.split("/").filter(Boolean).pop() ?? null;
  const author = buildAuthor(name, slugHint);
  relatedProfiles.push({
    type: "AUTHOR",
    name: author.name,
    slug: author.slug,
    sourceUrl: toAbsoluteIranKetabUrl(authorLink.attr("href") ?? null),
    originalName: author.originalName,
    country: author.country ?? country
  });
  return {
    ...author,
    country: author.country ?? country
  };
}

function parseGenres($: cheerio.CheerioAPI): GhafasehGenre[] {
  const genreMap = new Map<string, GhafasehGenre>();

  $("#section_categories a[href*='/tag/']").each((_, element) => {
    const text = normalizeWhitespace($(element).text());
    const href = $(element).attr("href") ?? "";
    if (!text) {
      return;
    }

    const slug = href.split("/").filter(Boolean).pop() ?? slugify(text);
    const genre = { name: text, slug };
    genreMap.set(`${genre.slug}:${genre.name}`, genre);
  });

  return dedupeGenres([...genreMap.values()]);
}

function parseEditionBlock(input: {
  $: cheerio.CheerioAPI;
  block: BlockSelection;
  pageUrl: string;
  bookTitle: string;
  bookSlug: string;
  selectedEditionCode: string | null;
  usedFilenames: Set<string>;
  relatedProfiles: RelatedProfileCandidate[];
}): ParsedEditionCandidate | null {
  const code = input.block.attr("id")?.replace(/^p-/, "").trim() ?? "";
  if (!code) {
    return null;
  }

  const titleRaw =
    normalizeWhitespace(input.block.find('h2[itemprop="name"]').first().text()) ||
    normalizeWhitespace(input.block.find("h2").first().text()) ||
    input.bookTitle;
  const titleOverride = cleanTitle(titleRaw) || input.bookTitle;
  const originalTitle =
    normalizeWhitespace(input.block.find(".ltr").first().text()) || null;

  const translatorLinks = parsePeopleFromLabel(input.$, input.block, /^مترجم(?:ان)?:/);
  const translators = translatorLinks.map((person) => buildAuthor(person.name, person.slugHint));
  const translatorNames = translators.map((translator) => translator.name);
  const publisherLink = findLinkByLabel(input.$, input.block, /^انتشارات:/);
  const publisherName = publisherLink?.text ?? "نامشخص";
  const publisherSlug = slugify(publisherName);
  translatorLinks.forEach((person, index) => {
    const translator = translators[index];
    if (!translator) {
      return;
    }

    input.relatedProfiles.push({
      type: "TRANSLATOR",
      name: translator.name,
      slug: translator.slug,
      sourceUrl: toAbsoluteIranKetabUrl(person.href),
      originalName: translator.originalName,
      country: translator.country
    });
  });

  if (publisherLink) {
    input.relatedProfiles.push({
      type: "PUBLISHER",
      name: publisherName,
      slug: publisherSlug,
      sourceUrl: toAbsoluteIranKetabUrl(publisherLink.href),
      originalName: null,
      country: null
    });
  }

  const blockText = normalizeWhitespace(input.block.text());
  const isbn13 = matchValue(blockText, /شابک:\s*([\d\-۰-۹٠-٩]+)/);
  const pageCount = parseNullableInt(matchValue(blockText, /تعداد صفحه:\s*([\d۰-۹٠-٩]+)/));
  const publishedYear = parseNullableInt(
    matchValue(blockText, /سال انتشار شمسی:\s*([\d۰-۹٠-٩]+)/)
  );
  const format = matchValue(blockText, /قطع:\s*([^:]+?)(?=تعداد صفحه|سال انتشار|نوع جلد|سری چاپ|شابک|$)/);
  const binding = matchValue(blockText, /نوع جلد:\s*([^:]+?)(?=تعداد صفحه|سال انتشار|سری چاپ|شابک|$)/);
  const printSeries = matchValue(blockText, /سری چاپ:\s*([\d۰-۹٠-٩]+)/);
  const votes = parseNullableInt(matchValue(blockText, /از\s*([\d۰-۹٠-٩]+)\s*رأی/)) ?? 0;
  const ratingRaw = matchValue(blockText, /([\d۰-۹٠-٩]+(?:[.,][\d۰-۹٠-٩]+)?)\s*از\s*[\d۰-۹٠-٩]+\s*رأی/);
  const rating = ratingRaw ? Number.parseFloat(ratingRaw.replace(",", ".")) : null;
  const specialNotes = collectSpecialNotes(blockText, titleRaw);
  const editionDescription = buildEditionDescription({
    translators: translatorNames,
    publisherName,
    format,
    binding,
    printSeries,
    specialNotes
  });

  const edition: GhafasehEdition = {
    titleOverride,
    translators,
    publisher: { name: publisherName, slug: publisherSlug },
    isbn10: null,
    isbn13,
    publishedYear,
    pageCount,
    coverFilename: buildCoverFilename({
      bookSlug: input.bookSlug,
      publisherName,
      translatorNames,
      sourceEditionCode: code,
      usedFilenames: input.usedFilenames
    }),
    coverUrl: null,
    editionDescription,
    status: "approved",
    sourceName: "iranketab",
    sourceUrl: `${input.pageUrl}#pts=${code}`,
    sourceEditionCode: code
  };

  const duplicateKey = [
    slugify(publisherName),
    translatorNames.map((name) => slugify(name)).join(","),
    normalizeTitleForDedup(titleOverride)
  ].join("|");

  return {
    edition,
    sourceEditionCode: code,
    titleRaw,
    translatorNames,
    publisherName,
    publishedYear,
    pageCount,
    votes,
    rating,
    selected: input.selectedEditionCode === code,
    score: computeEditionScore({
      votes,
      rating,
      publishedYear,
      pageCount,
      selected: input.selectedEditionCode === code,
      publisherName,
      translators: translatorNames,
      originalTitle
    }),
    duplicateKey
  };
}

function buildEditionDescription(input: {
  translators: string[];
  publisherName: string;
  format: string | null;
  binding: string | null;
  printSeries: string | null;
  specialNotes: string[];
}): string | null {
  const parts: string[] = [];

  if (input.translators.length > 0) {
    parts.push(`ترجمه ${input.translators.join("، ")}`);
  }

  parts.push(/^نشر\s/.test(input.publisherName) ? input.publisherName : `نشر ${input.publisherName}`);

  if (input.format) {
    parts.push(`قطع ${input.format}`);
  }

  if (input.binding) {
    parts.push(`جلد ${input.binding}`);
  }

  if (input.printSeries) {
    parts.push(`سری چاپ ${input.printSeries}`);
  }

  parts.push(...input.specialNotes);
  return parts.length > 0 ? `${parts.join("، ")}.` : null;
}

function collectSpecialNotes(blockText: string, titleRaw: string): string[] {
  const notes: string[] = [];
  const normalized = `${blockText} ${titleRaw}`;
  if (/مصور/i.test(normalized)) {
    notes.push("نسخه مصور");
  }

  if (/POD|دیجیتال/i.test(normalized)) {
    notes.push("نوع چاپ دیجیتال");
  }

  if (/دو جلدی/i.test(normalized)) {
    notes.push("دو جلدی");
  }

  return notes;
}

function computeEditionScore(input: {
  votes: number;
  rating: number | null;
  publishedYear: number | null;
  pageCount: number | null;
  selected: boolean;
  publisherName: string;
  translators: string[];
  originalTitle: string | null;
}): number {
  const publisherBoost = /(ماهی|چشمه|امیرکبیر|نگاه|کتاب پارسه)/.test(input.publisherName) ? 250 : 0;
  const translatorBoost = input.translators.some((name) => /سروش حبیبی/.test(name)) ? 220 : 0;

  return (
    input.votes * 1000 +
    Math.round((input.rating ?? 0) * 100) +
    (input.selected ? 600 : 0) +
    (input.publishedYear ?? 0) +
    (input.pageCount ?? 0) / 10 +
    publisherBoost +
    translatorBoost +
    (input.originalTitle ? 10 : 0)
  );
}

function sortEditions(editions: ParsedEditionCandidate[]): ParsedEditionCandidate[] {
  return [...editions].sort((left, right) => right.score - left.score);
}

function parsePeopleFromLabel(
  $: cheerio.CheerioAPI,
  block: BlockSelection,
  labelPattern: RegExp
): Array<{ name: string; slugHint: string | null; href: string | null }> {
  const container = findInfoRow($, block, labelPattern);
  if (!container) {
    return [];
  }

  return container
    .find('a[href*="/profile/"]')
    .toArray()
    .map((element) => {
      const link = $(element);
      return {
        name:
          normalizeWhitespace(link.find('[itemprop="name"]').first().text()) ||
          normalizeWhitespace(link.text()),
        slugHint: link.attr("href")?.split("/").filter(Boolean).pop() ?? null,
        href: link.attr("href") ?? null
      };
    })
    .filter((person) => Boolean(person.name) && !/فئودور داستایفسکی/.test(person.name));
}

function findLinkByLabel(
  $: cheerio.CheerioAPI,
  block: BlockSelection,
  labelPattern: RegExp
): { text: string; slugHint: string | null; href: string | null } | null {
  const container = findInfoRow($, block, labelPattern);
  if (!container) {
    return null;
  }
  const link = container.find("a").first();

  if (link.length === 0) {
    return null;
  }

  return {
    text: normalizeWhitespace(link.text()),
    slugHint: link.attr("href")?.split("/").filter(Boolean).pop() ?? null,
    href: link.attr("href") ?? null
  };
}

function matchValue(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match?.[1] ? normalizeWhitespace(match[1]) : null;
}

function findInfoRow(
  $: cheerio.CheerioAPI,
  block: BlockSelection,
  labelPattern: RegExp
): BlockSelection | null {
  const row = block
    .find("div")
    .filter((_, element) => {
      const text = normalizeWhitespace($(element).text());
      return (
        labelPattern.test(text) &&
        $(element).find("a").length > 0 &&
        !$(element).children("div").toArray().some((child) => labelPattern.test(normalizeWhitespace($(child).text())))
      );
    })
    .first();

  return row.length > 0 ? row : null;
}

function toAbsoluteIranKetabUrl(href: string | null): string | null {
  if (!href) {
    return null;
  }

  return new URL(href, "https://www.iranketab.ir").toString();
}

function dedupeRelatedProfiles(items: RelatedProfileCandidate[]): RelatedProfileCandidate[] {
  const map = new Map<string, RelatedProfileCandidate>();

  for (const item of items) {
    const key = `${item.type}:${item.slug}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return [...map.values()];
}





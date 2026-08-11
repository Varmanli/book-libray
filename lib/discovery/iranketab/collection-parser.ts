import * as cheerio from "cheerio";

const IRANKETAB_HOSTS = new Set(["iranketab.ir", "www.iranketab.ir"]);
const BOOK_PATH = /^\/book\/(\d+)(?:-[^/]+)?\/?$/u;

export type IranKetabDiscoveryCandidate = {
  iranKetabBookId: string;
  canonicalUrl: string;
  titleHint: string | null;
  authorHint: string | null;
  preferredEditionCode: string | null;
  sourcePosition: number | null;
};

/** Parses only book links from a trusted collection page; fetching and source validation are separate. */
export function parseIranKetabCollectionPage(input: {
  html: string;
  pageUrl: string;
}): IranKetabDiscoveryCandidate[] {
  const $ = cheerio.load(input.html);
  const candidates = new Map<string, IranKetabDiscoveryCandidate>();
  let position = 0;

  $("a[href]").each((_, element) => {
    const parsed = parseBookLink($(element).attr("href"), input.pageUrl);
    if (!parsed) return;
    position += 1;

    const container = $(element).closest(
      "[data-entity-id], article, li, .product-card, .product-card-simple, .card",
    );
    const titleHint = firstText(
      $(element).attr("title"),
      container.find("h1, h2, h3, h4, h5").first().text(),
      $(element).text(),
    );
    const authorHint = firstText(
      container.find("[data-author]").first().attr("data-author"),
      container.find(".author, .product-author").first().text(),
      container.find("h6").first().text(),
    );
    const candidate: IranKetabDiscoveryCandidate = {
      ...parsed,
      titleHint,
      authorHint,
      sourcePosition: position,
    };
    const existing = candidates.get(candidate.iranKetabBookId);
    candidates.set(
      candidate.iranKetabBookId,
      existing ? mergeCandidate(existing, candidate) : candidate,
    );
  });

  return [...candidates.values()].sort(
    (left, right) =>
      (left.sourcePosition ?? Number.MAX_SAFE_INTEGER) -
      (right.sourcePosition ?? Number.MAX_SAFE_INTEGER),
  );
}

function parseBookLink(
  href: string | undefined,
  pageUrl: string,
): Omit<
  IranKetabDiscoveryCandidate,
  "titleHint" | "authorHint" | "sourcePosition"
> | null {
  if (!href) return null;
  try {
    const url = new URL(href, pageUrl);
    if (!IRANKETAB_HOSTS.has(url.hostname.toLowerCase())) return null;
    const match = decodeURIComponent(url.pathname).match(BOOK_PATH);
    if (!match) return null;
    const preferredEditionCode = new URLSearchParams(url.hash.slice(1))
      .get("pts")
      ?.trim() || null;
    url.protocol = "https:";
    url.hostname = "www.iranketab.ir";
    url.search = "";
    url.hash = "";
    return {
      iranKetabBookId: match[1]!,
      canonicalUrl: url.toString(),
      preferredEditionCode,
    };
  } catch {
    return null;
  }
}

function mergeCandidate(
  existing: IranKetabDiscoveryCandidate,
  candidate: IranKetabDiscoveryCandidate,
): IranKetabDiscoveryCandidate {
  return {
    ...existing,
    titleHint: existing.titleHint ?? candidate.titleHint,
    authorHint: existing.authorHint ?? candidate.authorHint,
    preferredEditionCode:
      existing.preferredEditionCode ?? candidate.preferredEditionCode,
    sourcePosition: Math.min(
      existing.sourcePosition ?? Number.MAX_SAFE_INTEGER,
      candidate.sourcePosition ?? Number.MAX_SAFE_INTEGER,
    ),
  };
}

function firstText(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = value?.replace(/\s+/g, " ").trim();
    if (normalized) return normalized;
  }
  return null;
}

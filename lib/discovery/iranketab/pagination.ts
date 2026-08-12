import * as cheerio from "cheerio";

const IRANKETAB_HOSTS = new Set(["iranketab.ir", "www.iranketab.ir"]);

export function normalizeIranKetabPaginationUrl(value: string, currentPageUrl: string) {
  try {
    const url = new URL(value, currentPageUrl);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !IRANKETAB_HOSTS.has(url.hostname.toLowerCase())) return null;
    url.protocol = "https:";
    url.hostname = "www.iranketab.ir";
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || key === "fbclid") url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.toString();
  } catch {
    return null;
  }
}

/** Finds a trusted next-page link without treating ordinary book links as pagination. */
export function detectIranKetabNextPageUrl(html: string, currentPageUrl: string) {
  const $ = cheerio.load(html);
  const links = $("a[href], link[href]").toArray();
  const ranked = links
    .map((element, index) => {
      const node = $(element);
      const href = node.attr("href");
      if (!href) return null;
      const normalized = normalizeIranKetabPaginationUrl(href, currentPageUrl);
      if (!normalized) return null;
      const relNext = (node.attr("rel") ?? "").split(/\s+/).some((value) => value.toLowerCase() === "next");
      const text = node.text().replace(/\s+/g, " ").trim().toLowerCase();
      const paginationContainer = node.closest("nav[aria-label*='page' i], nav[aria-label*='صفحه' i], .pagination, [data-pagination]").length > 0;
      const url = new URL(normalized);
      const pageParameter = ["page", "p"].some((key) => /^\d+$/u.test(url.searchParams.get(key) ?? ""));
      const pagePath = /\/page\/\d+\/?$/u.test(url.pathname);
      const nextText = /^(next|بعدی|صفحه بعد|›|»|>)$/u.test(text);
      if (!relNext && !(paginationContainer && (pageParameter || pagePath || nextText))) return null;
      return { normalized, rank: relNext ? 0 : nextText ? 1 : 2, index };
    })
    .filter((entry): entry is { normalized: string; rank: number; index: number } => entry !== null)
    .sort((left, right) => left.rank - right.rank || left.index - right.index);
  if (ranked[0]) return ranked[0].normalized;

  // IranKetab's current tag pages use buttons (not links) such as
  // <button class="paging-item next" data-page-index="2">.
  const current = new URL(currentPageUrl);
  const pageParameter = current.searchParams.has("p") ? "p" : "page";
  const currentIndex = Number(current.searchParams.get(pageParameter) ?? "1");
  const buttonPages = $("button[data-page-index]")
    .toArray()
    .map((element, index) => {
      const node = $(element);
      const pageIndex = Number(node.attr("data-page-index"));
      if (!Number.isSafeInteger(pageIndex) || pageIndex <= currentIndex) return null;
      return { pageIndex, next: node.hasClass("next"), index };
    })
    .filter((entry): entry is { pageIndex: number; next: boolean; index: number } => entry !== null)
    .sort((left, right) => Number(right.next) - Number(left.next) || left.pageIndex - right.pageIndex || left.index - right.index);
  const next = buttonPages[0];
  if (!next) return null;
  current.searchParams.set(pageParameter, String(next.pageIndex));
  return normalizeIranKetabPaginationUrl(current.toString(), currentPageUrl);
}

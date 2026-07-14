import * as cheerio from "cheerio";
import { normalizeWhitespace, parseNullableInt } from "./normalize.js";
import type { GhafasehReferenceProfileType } from "./contract.js";
import { normalizePersianText } from "./slug.js";

export type ParsedIranKetabReferenceProfile = {
  type: GhafasehReferenceProfileType;
  name: string;
  originalName: string | null;
  slug: string;
  sourceUrl: string | null;
  sourceName: "iranketab";
  description: string | null;
  shortDescription: string | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  birthYear: number | null;
  deathYear: number | null;
  countryName: string | null;
  countrySlug: string | null;
  country: { name: string; originalName: string | null; slug: string } | null;
  website: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  metadata: Record<string, unknown>;
  diagnostics: string[];
};

function first($: cheerio.CheerioAPI, selectors: string[]): string | null {
  for (const selector of selectors) {
    const value = normalizeWhitespace($(selector).first().attr("content") ?? $(selector).first().text());
    if (value) return value;
  }
  return null;
}

function labeled($: cheerio.CheerioAPI, labels: RegExp): string | null {
  let value: string | null = null;
  $("tr, li, p, div").each((_, node) => {
    if (value) return;
    const text = normalizeWhitespace($(node).text());
    const match = text.match(labels);
    if (match?.[1]) value = normalizeWhitespace(match[1]);
  });
  return value;
}

export function parseIranKetabReferenceProfile(input: {
  html: string;
  pageUrl: string;
  type: GhafasehReferenceProfileType;
}): ParsedIranKetabReferenceProfile {
  const $ = cheerio.load(input.html);
  const canonical = $("link[rel='canonical']").attr("href") ?? input.pageUrl;
  const name = first($, ["meta[property='og:title']", "h1", "[itemprop='name']"]) ?? "";
  const description = first($, ["meta[name='description']", "meta[property='og:description']", "[itemprop='description']"]);
  const originalName = first($, ["[itemprop='alternateName']", ".ltr", "meta[name='originalName']"]);
  const imageUrl = first($, ["meta[property='og:image']", "[itemprop='image'] img", "img[alt*='پروفایل']"]);
  const birthYear = parseNullableInt(labeled($, /(?:تولد|زاده)\s*[:：-]?\s*([۰-۹0-9]{4})/));
  const deathYear = parseNullableInt(labeled($, /(?:درگذشت|وفات)\s*[:：-]?\s*([۰-۹0-9]{4})/));
  let slug = "";
  try { slug = new URL(canonical, input.pageUrl).pathname.split("/").filter(Boolean).pop() ?? ""; } catch { slug = ""; }
  const diagnostics: string[] = [];
  if (!name) diagnostics.push("profile name missing");
  if (!description) diagnostics.push("profile description missing");
  return {
    type: input.type, name: normalizePersianText(name), originalName: originalName ? normalizeWhitespace(originalName) : null,
    slug, sourceUrl: canonical, sourceName: "iranketab", description, shortDescription: description,
    imageUrl, bannerImageUrl: null, birthYear: birthYear && birthYear > 0 ? birthYear : null,
    deathYear: deathYear && deathYear > 0 ? deathYear : null,
    countryName: labeled($, /(?:ملیت|کشور)\s*[:：-]?\s*(.+)$/), countrySlug: null, country: null,
    website: first($, ["a[href^='http']:not([href*='iranketab.ir'])"]),
    seoTitle: first($, ["meta[name='title']", "meta[property='og:title']"]),
    seoDescription: first($, ["meta[name='description']", "meta[property='og:description']"]),
    metadata: { parser: "iran ketab reference profile", type: input.type }, diagnostics,
  };
}

export async function enrichIranKetabReferenceProfiles(input: {
  profiles: Array<{ type: GhafasehReferenceProfileType; name: string; sourceUrl: string | null }>;
  fetcher?: (url: string, init?: RequestInit) => Promise<Response>;
  timeoutMs?: number;
}): Promise<ParsedIranKetabReferenceProfile[]> {
  const seen = new Set<string>();
  const result: ParsedIranKetabReferenceProfile[] = [];
  for (const profile of input.profiles) {
    if (!profile.sourceUrl || seen.has(profile.sourceUrl)) continue;
    seen.add(profile.sourceUrl);
    try {
      const url = new URL(profile.sourceUrl);
      if (!/^(?:www\.)?iranketab\.ir$/i.test(url.hostname)) throw new Error("PROFILE_HOST_NOT_ALLOWED");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 10000);
      const response = await (input.fetcher ?? globalThis.fetch)(url.toString(), { signal: controller.signal });
      clearTimeout(timer);
      if (!response.ok || !(response.headers.get("content-type") ?? "").toLowerCase().includes("html")) throw new Error(`PROFILE_HTTP_${response.status}`);
      const html = await response.text();
      if (html.length > 2_000_000) throw new Error("PROFILE_RESPONSE_TOO_LARGE");
      result.push(parseIranKetabReferenceProfile({ html, pageUrl: url.toString(), type: profile.type }));
    } catch (error) {
      result.push({ type: profile.type, name: profile.name, originalName: null, slug: "", sourceUrl: profile.sourceUrl, sourceName: "iranketab", description: null, shortDescription: null, imageUrl: null, bannerImageUrl: null, birthYear: null, deathYear: null, countryName: null, countrySlug: null, country: null, website: null, seoTitle: null, seoDescription: null, metadata: {}, diagnostics: [`profile fetch failed: ${error instanceof Error ? error.message : "unknown"}`] });
    }
  }
  return result;
}

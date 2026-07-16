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
  profileId: string | null;
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
  const name = first($, [".relative h4.font-bold", "h4.font-bold", "meta[property='og:title']", "h1", "[itemprop='name']"]) ?? "";
  const description = first($, [".relative .text-justify", "[itemprop='description']", "meta[property='og:description']", "meta[name='description']"]);
  const originalName = first($, [".relative h5.font-en", "[itemprop='alternateName']", ".ltr", "meta[name='originalName']"]);
  const imageUrl = first($, [".relative img[alt]:not([alt*='ایران'])", "meta[property='og:image']", "[itemprop='image'] img", "img[alt*='پروفایل']"]);
  const visibleText = normalizeWhitespace($(".relative").first().text());
  const birthYear = parseNullableInt(labeled($, /(?:تولد|زاده)\s*[:：-]?\s*([۰-۹0-9]{4})/) ?? visibleText.match(/زاده[^۰-۹0-9]{0,30}([۰-۹0-9]{4})/)?.[1] ?? null);
  const deathYear = parseNullableInt(labeled($, /(?:درگذشت|وفات)\s*[:：-]?\s*([۰-۹0-9]{4})/) ?? visibleText.match(/(?:درگذشته|وفات)[^۰-۹0-9]{0,30}([۰-۹0-9]{4})/)?.[1] ?? null);
  let slug = "";
  try { slug = new URL(canonical, input.pageUrl).pathname.split("/").filter(Boolean).pop() ?? ""; } catch { slug = ""; }
  const profileId = canonical.match(/\/profile\/(\d+)(?:-|\/|$)/)?.[1] ?? $("[data-entity-id]").first().attr("data-entity-id") ?? null;
  const diagnostics: string[] = [];
  if (!name) diagnostics.push("profile name missing");
  if (!description) diagnostics.push("profile description missing");
  return {
    type: input.type, name: normalizePersianText(name.replace(/^کتاب های\s+/i, "").replace(/\s*\|.*$/, "")), originalName: originalName ? normalizeWhitespace(originalName) : null, profileId,
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
  const uniqueProfiles = input.profiles.filter((profile) => {
    if (!profile.sourceUrl || seen.has(profile.sourceUrl)) return false;
    seen.add(profile.sourceUrl);
    return true;
  });
  const fetchProfile = async (profile: (typeof uniqueProfiles)[number]) => {
    try {
      const url = new URL(profile.sourceUrl!);
      if (!/^(?:www\.)?iranketab\.ir$/i.test(url.hostname)) throw new Error("PROFILE_HOST_NOT_ALLOWED");
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), input.timeoutMs ?? 10000);
        try {
          const response = await (input.fetcher ?? globalThis.fetch)(url.toString(), { signal: controller.signal });
          if (!response.ok || !(response.headers.get("content-type") ?? "").toLowerCase().includes("html")) throw new Error(`PROFILE_HTTP_${response.status}`);
          const html = await response.text();
          if (html.length > 2_000_000) throw new Error("PROFILE_RESPONSE_TOO_LARGE");
          return parseIranKetabReferenceProfile({ html, pageUrl: url.toString(), type: profile.type });
        } catch (error) { lastError = error; } finally { clearTimeout(timer); }
      }
      throw lastError ?? new Error("PROFILE_FETCH_FAILED");
    } catch (error) {
      return { type: profile.type, name: profile.name, originalName: null, profileId: null, slug: "", sourceUrl: profile.sourceUrl, sourceName: "iranketab" as const, description: null, shortDescription: null, imageUrl: null, bannerImageUrl: null, birthYear: null, deathYear: null, countryName: null, countrySlug: null, country: null, website: null, seoTitle: null, seoDescription: null, metadata: {}, diagnostics: [`profile fetch failed: ${error instanceof Error ? error.message : "unknown"}`] };
    }
  };
  const results: ParsedIranKetabReferenceProfile[] = [];
  for (let index = 0; index < uniqueProfiles.length; index += 3) {
    results.push(...await Promise.all(uniqueProfiles.slice(index, index + 3).map(fetchProfile)));
  }
  return results;
}

import * as cheerio from "cheerio";

export type IranKetabCoverCandidate = { url: string; source: string; score: number; scope: "edition_block" | "nearby_code" | "global"; directImage: boolean };

export function extractIranKetabCoverCandidates(input: { html: string; pageUrl: string; editionCode?: string | null }): IranKetabCoverCandidate[] {
  const $ = cheerio.load(input.html);
  const code = input.editionCode?.trim() ?? "";
  const candidates = new Map<string, IranKetabCoverCandidate>();
  const add = (rawUrl: string | undefined, source: string, context: string, scope: IranKetabCoverCandidate["scope"]) => {
    const url = normalizeImageUrl(rawUrl, input.pageUrl);
    if (!url) return;
    const candidate = buildCandidate(url, source, context, scope, code);
    if (candidate.score <= 0) return;
    const previous = candidates.get(url);
    if (!previous || candidate.score > previous.score) candidates.set(url, candidate);
  };
  const collectElement = (elements: cheerio.Cheerio<unknown>, scope: IranKetabCoverCandidate["scope"]) => elements.each((_, element) => {
    const html = $.html(element as Parameters<typeof $.html>[0]) ?? "";
    const fragment = cheerio.load(html);
    fragment("img").each((__, image) => {
      add(fragment(image).attr("src"), "img[src]", fragment.html(image) ?? "", scope);
      add(fragment(image).attr("data-src"), "img[data-src]", fragment.html(image) ?? "", scope);
      add(fragment(image).attr("data-original"), "img[data-original]", fragment.html(image) ?? "", scope);
    });
    fragment("a").each((__, anchor) => add(fragment(anchor).attr("href"), "a[href]", fragment.html(anchor) ?? "", scope));
    collectSnippet(html, add, scope);
  });
  if (code) {
    collectElement($(`#p-${code}`), "edition_block");
    collectElement($(`[data-id="${code}"]`), "edition_block");
    for (const snippet of nearbySnippets(input.html, code, 8000)) collectSnippet(snippet, add, "nearby_code");
  }
  $("img").each((_, element) => {
    const context = $.html(element) ?? "";
    add($(element).attr("src"), "img[src]", context, "global");
    add($(element).attr("data-src"), "img[data-src]", context, "global");
    add($(element).attr("data-original"), "img[data-original]", context, "global");
  });
  $("a").each((_, element) => add($(element).attr("href"), "a[href]", $.html(element) ?? "", "global"));
  $('meta[property="og:image"]').each((_, element) => add($(element).attr("content"), "meta[property='og:image']", $.html(element) ?? "", "global"));
  $("script").each((_, element) => collectSnippet($(element).html() ?? "", add, "global"));
  return [...candidates.values()].sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));
}

function collectSnippet(snippet: string, add: (url: string | undefined, source: string, context: string, scope: IranKetabCoverCandidate["scope"]) => void, scope: IranKetabCoverCandidate["scope"]): void {
  const patterns = [/(?:https?:)?\/\/[^"'`\s)]+\/Images\/ProductImages\/[^"'`\s)<]+/gi, /\/Images\/ProductImages\/[^"'`\s)<]+/gi, /(?:https?:)?\/\/[^"'`\s)]+\/Files\/AttachFiles\/[^"'`\s)<]+/gi, /\/Files\/AttachFiles\/[^"'`\s)<]+/gi, /https?:\\\/\\\/[^"'`\s]+/gi, /\/Images\\\/ProductImages\\\/[^"'`\s]+/gi];
  for (const pattern of patterns) for (const match of snippet.matchAll(pattern)) add(unescapeUrl(match[0]), "snippet", snippet.slice(Math.max(0, (match.index ?? 0) - 240), (match.index ?? 0) + 240), scope);
}
function nearbySnippets(html: string, code: string, radius: number): string[] {
  const result: string[] = [];
  const pattern = new RegExp(code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  for (const match of html.matchAll(pattern)) { const index = match.index ?? -1; if (index >= 0) result.push(html.slice(Math.max(0, index - radius), Math.min(html.length, index + radius))); }
  return result;
}
function buildCandidate(url: string, source: string, context: string, scope: IranKetabCoverCandidate["scope"], code: string): IranKetabCoverCandidate {
  const lowerUrl = url.toLowerCase(); const lowerContext = context.toLowerCase(); let score = 0;
  if (lowerUrl.includes("/images/productimages/")) score += 120;
  if (lowerUrl.includes("/files/attachfiles/")) score += 40;
  if (source === "a[href]") score += 50; if (source.startsWith("img[")) score += 25;
  if (scope === "edition_block") score += 160; if (scope === "nearby_code") score += 110; if (scope === "global") score += 10;
  if (["logo", "icon", "avatar", "placeholder", "pixel", "sprite"].some(value => lowerUrl.includes(value))) score -= 300;
  if (lowerContext.includes("logo") || lowerContext.includes("avatar")) score -= 120;
  if (code) { if (context.includes(`p-${code}`) || context.includes(`_${code}`)) score += 160; if (context.includes(`data-id="${code}"`) || context.includes(`id="p-${code}"`)) score += 180; if (context.includes(code)) score += 90; }
  return { url, source, score, scope, directImage: lowerUrl.includes("/images/productimages/") || lowerUrl.includes("/files/attachfiles/") };
}
function normalizeImageUrl(rawUrl: string | undefined, pageUrl: string): string | null {
  if (!rawUrl) return null; const trimmed = unescapeUrl(rawUrl.trim()); if (!trimmed || trimmed.startsWith("data:")) return null;
  try { const parsed = new URL(trimmed, pageUrl); if (parsed.hostname === "img.iranketab.ir") { const proxied = parsed.searchParams.get("pic"); if (proxied) return normalizeImageUrl(proxied, pageUrl); } return parsed.toString(); } catch { return null; }
}
function unescapeUrl(value: string): string { return value.replace(/\\\//g, "/").replace(/^\/\//, "https://"); }



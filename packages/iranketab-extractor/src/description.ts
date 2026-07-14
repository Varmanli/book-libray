import * as cheerio from "cheerio";

import type { DescriptionCompleteness, GhafasehCountry, GhafasehReferenceProfileType } from "./contract.js";
import { normalizePersianText } from "./slug.js";
import { normalizeWhitespace, parseNullableInt } from "./normalize.js";

const MARKETING_PATTERNS = [
  /خرید کتاب/gi,
  /خرید اینترنتی کتاب/gi,
  /سایت خرید کتاب/gi,
  /ارسال/gi,
  /تخفیف/gi,
  /پرفروش(?:\s*ترین)?/gi,
  /ایران کتاب پیشنهاد می کند/gi,
  /ایران کتاب پیشنهاد می‌کند/gi,
  /موجود شد/gi,
  /قیمت/gi
];

const COUNTRY_HINTS: Array<{ pattern: RegExp; country: GhafasehCountry }> = [
  { pattern: /ایرانی|ایران\b/, country: { name: "ایران", originalName: "Iran", slug: "iran" } },
  { pattern: /فرانسوی|فرانسه\b/, country: { name: "فرانسه", originalName: "France", slug: "france" } },
  { pattern: /روسی|روسیه\b/, country: { name: "روسیه", originalName: "Russia", slug: "russia" } },
  { pattern: /آمریکایی|ایالات متحده|آمریکا\b/, country: { name: "آمریکا", originalName: "United States", slug: "united-states" } },
  { pattern: /انگلیسی|انگلستان|بریتانیا\b/, country: { name: "انگلیس", originalName: "England", slug: "england" } },
  { pattern: /آلمانی|آلمان\b/, country: { name: "آلمان", originalName: "Germany", slug: "germany" } },
  { pattern: /ایتالیایی|ایتالیا\b/, country: { name: "ایتالیا", originalName: "Italy", slug: "italy" } },
  { pattern: /اسپانیایی|اسپانیا\b/, country: { name: "اسپانیا", originalName: "Spain", slug: "spain" } },
  { pattern: /ژاپنی|ژاپن\b/, country: { name: "ژاپن", originalName: "Japan", slug: "japan" } },
  { pattern: /هندی|هند\b/, country: { name: "هند", originalName: "India", slug: "india" } }
];

export function extractBookDescription(input: {
  $: cheerio.CheerioAPI;
}): { description: string | null; completeness: DescriptionCompleteness } {
  const intro = extractSectionParagraphs(input.$, /^معرفی کتاب/);
  const features = extractListItems(input.$, /^ویژگی های کتاب/).filter((item) => !MARKETING_PATTERNS.some((pattern) => pattern.test(item)));
  const accolades = extractSectionParagraphs(input.$, /^نکوداشت های کتاب/).filter((item) => item.length > 10);
  const excerpts = extractSectionParagraphs(input.$, /^قسمت هایی از کتاب/).filter((item) => item.length > 20);

  const paragraphs: string[] = [];

  if (intro.length > 0) {
    paragraphs.push(rewriteParagraph(intro.join(" ")));
  }

  if (features.length > 0) {
    paragraphs.push(`در معرفی این اثر به نکاتی مانند ${joinPersianList(features.map((item) => stripTrailingPunctuation(item)))} اشاره شده است.`);
  }

  if (accolades.length > 0) {
    const selected = accolades.slice(0, 3).map((item) => stripTrailingPunctuation(item));
    paragraphs.push(`نکوداشت های این کتاب نیز بر ${joinPersianList(selected)} تاکید می کنند.`);
  }

  if (excerpts.length > 0) {
    const summary = summarizeExcerptThemes(excerpts.join(" "));
    if (summary) {
      paragraphs.push(summary);
    }
  }

  const description = finalizeDescription(paragraphs);
  return {
    description,
    completeness: assessDescriptionCompleteness(description)
  };
}

export function buildProfileDescription(input: {
  biography: string | null;
  awards: string[];
  works: string[];
  type: GhafasehReferenceProfileType;
  name: string;
}): { description: string | null; shortDescription: string | null; completeness: DescriptionCompleteness } {
  const paragraphs: string[] = [];
  if (input.biography) {
    paragraphs.push(rewriteParagraph(input.biography));
  }

  if (input.awards.length > 0) {
    paragraphs.push(`در کارنامه ${input.name} ${joinPersianList(input.awards.map((item) => stripTrailingPunctuation(item)))} نیز دیده می شود.`);
  }

  if (input.works.length > 0) {
    paragraphs.push(`${profileLabel(input.type, false)} با آثاری مانند ${joinPersianList(input.works.slice(0, 6))} نیز شناخته می شود.`);
  }

  const description = finalizeDescription(paragraphs, 5000);
  const completeness = assessDescriptionCompleteness(description);

  return {
    description,
    shortDescription: buildShortDescription({
      type: input.type,
      name: input.name,
      description
    }),
    completeness
  };
}

export function assessDescriptionCompleteness(text: string | null): DescriptionCompleteness {
  if (!text) {
    return "missing";
  }

  if (text.length >= 320) {
    return "full";
  }

  return text.length >= 90 ? "partial" : "missing";
}

export function inferCountryFromText(text: string | null): GhafasehCountry | null {
  if (!text) {
    return null;
  }

  const normalized = normalizePersianText(text);
  for (const entry of COUNTRY_HINTS) {
    if (entry.pattern.test(normalized)) {
      return entry.country;
    }
  }

  return null;
}

export function parseBirthDeathYears(text: string | null): { birthYear: number | null; deathYear: number | null } {
  if (!text) {
    return { birthYear: null, deathYear: null };
  }

  const normalized = normalizeWhitespace(text);
  const born = parseNullableInt(normalized.match(/زاده(?:\s*ی)?[\s\S]{0,40}?([۰-۹0-9]{4})/)?.[1] ?? null);
  const died = parseNullableInt(normalized.match(/درگذشته(?:\s*ی)?[\s\S]{0,40}?([۰-۹0-9]{4})/)?.[1] ?? null);

  return { birthYear: born, deathYear: died };
}

export function inferProfileTypeFromText(input: {
  title: string | null;
  description: string | null;
  url: string;
}): GhafasehReferenceProfileType {
  const combined = normalizePersianText(`${input.title ?? ""} ${input.description ?? ""}`);
  if (input.url.includes("/publisher/") || /انتشارات|نشر|ناشر|برند/.test(combined)) {
    return "PUBLISHER";
  }

  if (/مترجم|ترجمه/.test(combined) && !/نویسنده|رمان نویس|شاعر/.test(combined)) {
    return "TRANSLATOR";
  }

  return "AUTHOR";
}

function extractSectionParagraphs($: cheerio.CheerioAPI, headingPattern: RegExp): string[] {
  const heading = $("h6, h5, h4")
    .filter((_, element) => headingPattern.test(normalizeWhitespace($(element).text())))
    .first();

  if (heading.length === 0) {
    return [];
  }

  const section = heading.closest(".section");
  const texts = section
    .find("p, .text-justify, li")
    .toArray()
    .map((element) => cleanExtractedText($(element).text()))
    .filter((value) => Boolean(value));

  return uniqueOrdered(texts.filter((value) => value !== normalizeWhitespace(heading.text())));
}

function extractListItems($: cheerio.CheerioAPI, headingPattern: RegExp): string[] {
  const heading = $("h6, h5, h4")
    .filter((_, element) => headingPattern.test(normalizeWhitespace($(element).text())))
    .first();
  if (heading.length === 0) {
    return [];
  }

  return heading
    .closest(".section")
    .find("li")
    .toArray()
    .map((element) => cleanExtractedText($(element).text()))
    .filter((value) => Boolean(value));
}

function rewriteParagraph(text: string): string {
  let result = cleanExtractedText(text);
  for (const pattern of MARKETING_PATTERNS) {
    result = result.replace(pattern, " ");
  }

  result = result.replace(/\.([^\s])/g, ". $1");
  result = result.replace(/،\./g, "،");
  result = result.replace(/\s+([،.])/g, "$1");
  result = result.replace(/[ ]{2,}/g, " ");
  return clampText(result, 5000);
}

function summarizeExcerptThemes(text: string): string | null {
  const normalized = cleanExtractedText(text);
  if (!normalized) {
    return null;
  }

  const themes: string[] = [];
  if (/شادکامی|خوشبختی/.test(normalized)) {
    themes.push("قدر لحظه های کوتاه شادکامی");
  }

  if (/رویا|خاطره/.test(normalized)) {
    themes.push("ماندگاری رویاها و خاطره ها");
  }

  if (/قلب|احساس|بر زبان/.test(normalized)) {
    themes.push("دشواری بیان بی واسطه احساسات");
  }

  if (themes.length === 0) {
    return null;
  }

  return `بخش های برگزیده اثر نیز ${joinPersianList(themes)} را برجسته می کنند.`;
}

function buildShortDescription(input: {
  type: GhafasehReferenceProfileType;
  name: string;
  description: string | null;
}): string | null {
  if (!input.description) {
    return null;
  }

  const firstSentence = input.description.split(/(?<=[.؟!])\s+/).find((sentence) => sentence.trim().length > 25) ?? null;
  if (firstSentence) {
    return clampText(firstSentence, 180);
  }

  return `${input.name} ${profileLabel(input.type, true)} است.`;
}

function profileLabel(type: GhafasehReferenceProfileType, short: boolean): string {
  if (type === "AUTHOR") {
    return short ? "نویسنده" : "این نویسنده";
  }

  if (type === "TRANSLATOR") {
    return short ? "مترجم" : "این مترجم";
  }

  return short ? "ناشر" : "این ناشر";
}

function cleanExtractedText(value: string): string {
  return normalizeWhitespace(value)
    .replace(/[«»]+/g, (match) => match)
    .replace(/\s*[\u200c]+\s*/g, " ")
    .trim();
}

function finalizeDescription(paragraphs: string[], maxLength: number = 4200): string | null {
  const cleaned = uniqueOrdered(
    paragraphs
      .map((paragraph) => rewriteParagraph(paragraph))
      .filter((paragraph) => paragraph.length > 30)
  );
  if (cleaned.length === 0) {
    return null;
  }

  return clampText(cleaned.join("\n\n"), maxLength);
}

function clampText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  const clipped = value.slice(0, maxLength);
  const lastSentence = Math.max(clipped.lastIndexOf("."), clipped.lastIndexOf("؟"), clipped.lastIndexOf("!"));
  return (lastSentence > 0 ? clipped.slice(0, lastSentence + 1) : clipped).trim();
}

function joinPersianList(values: string[]): string {
  const cleaned = uniqueOrdered(values.map((item) => item.trim()).filter(Boolean));
  if (cleaned.length === 0) {
    return "";
  }

  if (cleaned.length === 1) {
    return cleaned[0];
  }

  if (cleaned.length === 2) {
    return `${cleaned[0]} و ${cleaned[1]}`;
  }

  return `${cleaned.slice(0, -1).join("، ")} و ${cleaned[cleaned.length - 1]}`;
}

function stripTrailingPunctuation(value: string): string {
  return value.replace(/[.،؛:!؟]+$/g, "").trim();
}

function uniqueOrdered(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const key = normalizePersianText(value);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(value);
  }

  return result;
}





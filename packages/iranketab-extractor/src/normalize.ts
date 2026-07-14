import type { GhafasehAuthor, GhafasehCountry, GhafasehGenre } from "./contract.js";

const PERSIAN_DIGIT_MAP = new Map(
  ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"].map((digit, index) => [digit, String(index)])
);

const ARABIC_DIGIT_MAP = new Map(
  ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"].map((digit, index) => [digit, String(index)])
);

const KNOWN_SLUGS = new Map<string, string>([
  ["فئودور داستایفسکی", "fyodor-dostoevsky"],
  ["لیانید آندری یف", "leonid-andreyev"],
  ["آنتون چخوف", "anton-chekhov"],
  ["ویکتور هوگو", "victor-hugo"],
  ["سروش حبیبی", "soroush-habibi"],
  ["حمیدرضا آتش برآب", "hamidreza-atash-bar-ab"],
  ["نشر کتاب پارسه", "ketab-parseh"],
  ["کتاب پارسه", "ketab-parseh"],
  ["نشر چشمه", "cheshmeh"],
  ["چشمه", "cheshmeh"],
  ["ماهی", "mahi"],
  ["نگاه", "negah"],
  ["امیرکبیر", "amirkabir"]
]);

const KNOWN_AUTHOR_METADATA = new Map<
  string,
  { originalName: string; slug: string; country: GhafasehCountry | null }
>([
  [
    "فئودور داستایفسکی",
    {
      originalName: "Fyodor Dostoevsky",
      slug: "fyodor-dostoevsky",
      country: { name: "روسیه", originalName: "Russia", slug: "russia" }
    }
  ],
  [
    "لیانید آندری یف",
    {
      originalName: "Leonid Andreyev",
      slug: "leonid-andreyev",
      country: { name: "روسیه", originalName: "Russia", slug: "russia" }
    }
  ],
  [
    "آنتون چخوف",
    {
      originalName: "Anton Chekhov",
      slug: "anton-chekhov",
      country: { name: "روسیه", originalName: "Russia", slug: "russia" }
    }
  ],
  [
    "ویکتور هوگو",
    {
      originalName: "Victor Hugo",
      slug: "victor-hugo",
      country: { name: "فرانسه", originalName: "France", slug: "france" }
    }
  ]
]);

const COUNTRY_BY_GENRE = new Map<string, GhafasehCountry>([
  ["ادبیات روسیه", { name: "روسیه", originalName: "Russia", slug: "russia" }],
  ["ادبیات فرانسه", { name: "فرانسه", originalName: "France", slug: "france" }],
  ["ادبیات ایران", { name: "ایران", originalName: "Iran", slug: "iran" }],
  ["ادبیات آمریکا", { name: "آمریکا", originalName: "United States", slug: "united-states" }],
  ["ادبیات آلمان", { name: "آلمان", originalName: "Germany", slug: "germany" }],
  ["ادبیات ژاپن", { name: "ژاپن", originalName: "Japan", slug: "japan" }],
  ["ادبیات انگلیس", { name: "انگلیس", originalName: "England", slug: "england" }],
  ["ادبیات کانادا", { name: "کانادا", originalName: "Canada", slug: "canada" }]
]);

const MARKETING_GENRE_PATTERNS = [
  /پرفروش/i,
  /برگزیده/i,
  /پیشنهادی/i,
  /ایران کتاب/i,
  /فهرست/i,
  /برترین/i,
  /پرافتخارترین/i,
  /جدید ترین/i,
  /تازه های/i,
  /نسخهٔ امضا/i,
  /جشنواره/i,
  /مشاهده همه/i,
  /بسته های پیشنهادی/i,
  /خودپروری/i,
  /کمک آموزشی/i,
  /لوازم/i,
  /نوشت افزار/i,
  /محصولات فرهنگی/i
];

const ALLOWED_GENRE_PATTERNS = [
  /^ادبیات /,
  /^داستان /,
  /^رمان$/,
  /^داستان کوتاه$/,
  /^دهه \d{4} میلادی$/
];

const TITLE_NOISE_PATTERNS = [
  /\(?(جیبی|رقعی|پالتویی|شومیز|جلد سخت|زرکوب|دو جلدی|مصور|گلاسه)\)?/gi,
  /سری چاپ\s*\d+/gi,
  /چاپ\s*\d+/gi
];

const DESCRIPTION_NOISE_PATTERNS = [
  /خرید کتاب/gi,
  /داستانی هیجان انگیز/gi,
  /نویسنده/gi,
  /مترجم/gi,
  /انتشارات/gi
];

const TRANSLITERATION_MAP: Record<string, string> = {
  ا: "a",
  آ: "a",
  ب: "b",
  پ: "p",
  ت: "t",
  ث: "s",
  ج: "j",
  چ: "ch",
  ح: "h",
  خ: "kh",
  د: "d",
  ذ: "z",
  ر: "r",
  ز: "z",
  ژ: "zh",
  س: "s",
  ش: "sh",
  ص: "s",
  ض: "z",
  ط: "t",
  ظ: "z",
  ع: "",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "v",
  ه: "h",
  ی: "y",
  ئ: "y",
  ء: "",
  " ": "-",
  "-": "-"
};

export function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").replace(/[‌]/g, " ").trim();
}

export function toLatinDigits(value: string): string {
  return [...value]
    .map((char) => PERSIAN_DIGIT_MAP.get(char) ?? ARABIC_DIGIT_MAP.get(char) ?? char)
    .join("");
}

export function parseNullableInt(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const digits = toLatinDigits(value).match(/\d+/g)?.join("") ?? "";
  if (!digits) {
    return null;
  }

  const parsed = Number.parseInt(digits, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function slugify(value: string): string {
  const normalized = normalizeWhitespace(value);
  const known = KNOWN_SLUGS.get(normalized);
  if (known) {
    return known;
  }

  const transliterated = [...normalized]
    .map((char) => TRANSLITERATION_MAP[char] ?? char)
    .join("")
    .toLowerCase();

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function cleanTitle(value: string): string {
  let result = normalizeWhitespace(value.replace(/^کتاب\s+/, ""));

  for (const pattern of TITLE_NOISE_PATTERNS) {
    result = result.replace(pattern, " ");
  }

  result = result.replace(/[()]/g, " ");
  return normalizeWhitespace(result);
}

export function normalizeTitleForDedup(value: string): string {
  return cleanTitle(value).replace(/[‌]/g, " ").toLowerCase();
}

export function isRealGenreName(name: string): boolean {
  const normalized = normalizeWhitespace(name);
  if (!normalized) {
    return false;
  }

  if (MARKETING_GENRE_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return false;
  }

  return ALLOWED_GENRE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function dedupeGenres(genres: GhafasehGenre[]): GhafasehGenre[] {
  const map = new Map<string, GhafasehGenre>();

  for (const genre of genres) {
    if (isRealGenreName(genre.name) && !map.has(genre.slug)) {
      map.set(genre.slug, genre);
    }
  }

  return [...map.values()];
}

export function inferCountryFromGenres(genres: GhafasehGenre[]): GhafasehCountry | null {
  for (const genre of genres) {
    const country = COUNTRY_BY_GENRE.get(genre.name);
    if (country) {
      return country;
    }
  }

  return null;
}

export function buildNeutralDescription(input: {
  title: string;
  authorName: string | null;
  genres: GhafasehGenre[];
  metaDescription: string | null;
}): { description: string | null; needsReview: boolean } {
  const genre = input.genres[0]?.name ?? null;
  if (input.title && input.authorName) {
    const parts = [`${input.title} اثری از ${input.authorName} است`];
    if (genre) {
      parts.push(`که در دسته ${genre} قرار می‌گیرد`);
    }

    return {
      description: `${parts.join(" ")}.`,
      needsReview: false
    };
  }

  if (input.metaDescription) {
    let cleaned = normalizeWhitespace(input.metaDescription);
    for (const pattern of DESCRIPTION_NOISE_PATTERNS) {
      cleaned = cleaned.replace(pattern, " ");
    }

    cleaned = normalizeWhitespace(cleaned).replace(/[|]+/g, " ");
    const short = cleaned.slice(0, 220).trim();

    return {
      description: short ? short : null,
      needsReview: true
    };
  }

  return {
    description: null,
    needsReview: true
  };
}

export function buildAuthor(name: string, slugHint?: string | null): GhafasehAuthor {
  const normalized = normalizeWhitespace(name);
  const known = KNOWN_AUTHOR_METADATA.get(normalized);
  const safeSlugHint = slugHint && /^[a-z0-9-]+$/i.test(slugHint.trim()) ? slugHint.trim() : null;
  const slug =
    known?.slug ??
    (safeSlugHint ? safeSlugHint.replace(/^\d+-/, "") : null) ??
    slugify(normalized);

  return {
    name: normalized,
    originalName: known?.originalName ?? null,
    slug,
    country: known?.country ?? null
  };
}

export function buildCoverFilename(input: {
  bookSlug: string;
  publisherName: string;
  translatorNames: string[];
  sourceEditionCode: string;
  usedFilenames: Set<string>;
}): string {
  const publisherSlug = slugify(input.publisherName || "unknown-publisher");
  const translatorSlug =
    input.translatorNames.length > 0
      ? input.translatorNames.map((name) => slugify(name)).join("-")
      : "unknown-translator";
  const base = `${input.bookSlug}-${publisherSlug}-${translatorSlug}`.replace(/-+/g, "-");
  let filename = `${base}.jpg`;

  if (input.usedFilenames.has(filename)) {
    filename = `${base}-${input.sourceEditionCode}.jpg`;
  }

  input.usedFilenames.add(filename);
  return filename;
}





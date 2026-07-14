import type { GhafasehGenre } from "./contract.js";

const MARKETING_PATTERNS = [
  /پرفروش/i,
  /ایران کتاب/i,
  /فهرست برترین/i,
  /کتاب های پیشنهادی/i,
  /برگزیده/i
];

const GENRE_SLUGS = new Map<string, string>([
  ["داستان معمایی", "mystery"],
  ["داستان تاریخی", "historical-fiction"],
  ["ادبیات داستانی", "fiction"],
  ["ادبیات معاصر", "contemporary-literature"],
  ["ادبیات ایتالیا", "italian-literature"],
  ["ادبیات روسیه", "russian-literature"],
  ["ادبیات فرانسه", "french-literature"],
  ["داستان عاشقانه", "romance"],
  ["داستان فلسفی", "philosophical-fiction"],
  ["داستان روانشناسانه", "psychological-fiction"],
  ["داستان اجتماعی", "social-fiction"],
  ["داستان کوتاه", "short-story"],
  ["رمان", "novel"],
  ["دهه 1980 میلادی", "1980s"],
  ["دهه 1840 میلادی", "1840s"],
  ["دهه 1860 میلادی", "1860s"],
  ["ادبیات اقتباسی", "adapted-literature"],
  ["داستان درام", "dramatic-fiction"],
  ["ادبیات کلاسیک", "classic-literature"],
  ["ادبیات اگزیستانسیالیسم", "existential-literature"]
]);

export function normalizeGenres(genres: GhafasehGenre[]): GhafasehGenre[] {
  const map = new Map<string, GhafasehGenre>();

  for (const genre of genres) {
    const name = genre.name.trim();
    if (!name || MARKETING_PATTERNS.some((pattern) => pattern.test(name))) {
      continue;
    }

    const slug = GENRE_SLUGS.get(name) ?? genre.slug.replace(/^\d+-/, "");
    if (!map.has(slug)) {
      map.set(slug, { name, slug });
    }
  }

  return [...map.values()];
}





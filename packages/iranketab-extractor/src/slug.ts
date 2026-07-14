import { KNOWN_BOOKS, KNOWN_PUBLISHERS, KNOWN_TRANSLATORS } from "./known-entities.js";

const LETTER_MAP: Record<string, string> = {
  ا: "a",
  آ: "aa",
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
  ع: "a",
  غ: "gh",
  ف: "f",
  ق: "gh",
  ک: "k",
  گ: "g",
  ل: "l",
  م: "m",
  ن: "n",
  و: "oo",
  ه: "h",
  ی: "y",
  ي: "y",
  ك: "k",
  ة: "h"
};

export function normalizePersianText(value: string): string {
  return value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[‌]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyText(value: string): string {
  const normalized = normalizePersianText(value)
    .replace(/'/g, "")
    .replace(/[’]/g, "")
    .replace(/&/g, " and ");

  const transliterated = [...normalized]
    .map((char) => LETTER_MAP[char] ?? char)
    .join("")
    .toLowerCase();

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function slugifyBookTitle(value: string): string {
  const known = KNOWN_BOOKS.get(normalizePersianText(value)) ?? KNOWN_BOOKS.get(value);
  return known?.slug ?? slugifyText(value).replace(/-s-/g, "s-");
}

export function slugifyPublisherName(value: string): string {
  return KNOWN_PUBLISHERS.get(normalizePersianText(value))?.slug ?? slugifyText(value);
}

export function slugifyPersonName(value: string): string {
  return KNOWN_TRANSLATORS.get(normalizePersianText(value))?.slug ?? slugifyText(value);
}





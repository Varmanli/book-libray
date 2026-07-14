export function normalizeReferenceName(value: string): string {
  return value
    .replace(/[٠-٩]/g, (char) => String(char.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (char) => String(char.charCodeAt(0) - 1776))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/[‐‑‒–—]/g, "-")
    .replace(/[ـ]/g, "")
    .replace(/[“”"'`]+/g, "")
    .replace(/[،,؛;:(){}\[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("en-US");
}

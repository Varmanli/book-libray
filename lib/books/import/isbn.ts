export function normalizeIsbn(value: unknown): string | null {
  if (value == null) return null;
  const normalized = String(value)
    .replace(/[٠-٩]/g, (char) => String(char.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (char) => String(char.charCodeAt(0) - 1776))
    .replace(/^\s*isbn(?:-1[03])?\s*:?\s*/i, "")
    .replace(/[\s\-‌‏‎\u200c\u200f\u200e]+/g, "")
    .trim();
  return normalized ? normalized.toUpperCase() : null;
}

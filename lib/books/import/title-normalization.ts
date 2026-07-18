/** Pure title identity normalization; intentionally safe to import without a DB. */
export function normalizeBookGroupingKey(
  title: string,
  _firstAuthor?: string,
  _originalTitle?: string | null,
): string {
  return normalizeBookTitle(title);
}

export function normalizeBookTitle(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\u200E\u200F\uFEFF]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/gu, " ")
    .trim()
    .toLocaleLowerCase();
}

export const STORED_GENRE_SEPARATOR = " • ";
const MULTI_VALUE_SEPARATOR_RE = /\r?\n|[،,;؛•]/;

export function splitMultiValueText(value: string | null | undefined): string[] {
  if (!value) return [];

  return value
    .split(MULTI_VALUE_SEPARATOR_RE)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);
}

export function hasMultiValueSeparator(value: string | null | undefined): boolean {
  if (!value) return false;
  return MULTI_VALUE_SEPARATOR_RE.test(value);
}

export function splitStoredGenres(value: string | null | undefined): string[] {
  if (!value) return [];

  return splitMultiValueText(value);
}

export function serializeGenres(genres: string[]): string {
  return genres
    .flatMap((genre) => splitMultiValueText(genre))
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .join(STORED_GENRE_SEPARATOR);
}

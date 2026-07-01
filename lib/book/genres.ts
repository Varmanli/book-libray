export const STORED_GENRE_SEPARATOR = " • ";

export function splitStoredGenres(value: string | null | undefined): string[] {
  if (!value) return [];

  return value
    .split(STORED_GENRE_SEPARATOR)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, arr) => arr.indexOf(item) === index);
}

export function serializeGenres(genres: string[]): string {
  return splitStoredGenres(genres.join(STORED_GENRE_SEPARATOR)).join(
    STORED_GENRE_SEPARATOR,
  );
}

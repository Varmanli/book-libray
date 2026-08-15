export const GENRE_ARCHIVE_PAGE_SIZE = 20;

export type GenreArchiveFilters = {
  q: string;
  page: number;
};

type SearchParamValue = string | string[] | undefined;

function firstOf(value: SearchParamValue) {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}

function positiveInteger(value: string, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseGenreArchiveSearchParams(
  searchParams: Record<string, SearchParamValue>,
): GenreArchiveFilters {
  return {
    q: firstOf(searchParams.q).trim(),
    page: positiveInteger(firstOf(searchParams.page), 1),
  };
}

export function getGenreArchivePageCount(total: number, pageSize = GENRE_ARCHIVE_PAGE_SIZE) {
  return total > 0 ? Math.ceil(total / pageSize) : 0;
}

export function normalizeGenreArchivePage(
  requestedPage: number,
  total: number,
  pageSize = GENRE_ARCHIVE_PAGE_SIZE,
) {
  const pageCount = getGenreArchivePageCount(total, pageSize);
  return pageCount === 0 ? 1 : Math.min(Math.max(1, requestedPage), pageCount);
}

/** Mirrors the archive's name search semantics for focused regression tests. */
export function genreNameMatchesQuery(name: string, q: string) {
  return !q.trim() || name.toLocaleLowerCase("fa-IR").includes(q.trim().toLocaleLowerCase("fa-IR"));
}

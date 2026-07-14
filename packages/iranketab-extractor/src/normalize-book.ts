import type { GhafasehBookImport } from "./contract.js";
import { normalizeGenres } from "./known-genres.js";
import { KNOWN_AUTHORS, KNOWN_BOOKS, toCountry } from "./known-entities.js";
import { normalizePersianText, slugifyBookTitle } from "./slug.js";

export function normalizeBook(book: GhafasehBookImport): GhafasehBookImport {
  const normalizedTitle = normalizePersianText(book.title);
  const knownBook = KNOWN_BOOKS.get(normalizedTitle) ?? KNOWN_BOOKS.get(book.originalTitle ?? "");
  const firstAuthor = book.authors[0];
  const knownAuthor = firstAuthor ? KNOWN_AUTHORS.get(normalizePersianText(firstAuthor.name)) : undefined;

  const authors = book.authors.map((author) => {
    const known = KNOWN_AUTHORS.get(normalizePersianText(author.name));
    return {
      ...author,
      originalName: known?.originalName ?? author.originalName,
      slug: known?.slug ?? author.slug,
      country: known ? toCountry(known.country) : author.country
    };
  });

  return {
    ...book,
    title: normalizedTitle,
    originalTitle: knownBook?.originalTitle ?? book.originalTitle,
    description: book.description ?? knownBook?.description ?? null,
    genres: normalizeGenres(book.genres),
    country: knownBook?.country ? toCountry(knownBook.country) : knownAuthor ? toCountry(knownAuthor.country) : book.country,
    firstPublishedYear: knownBook?.firstPublishedYear ?? book.firstPublishedYear,
    authors,
    sourceUrl: book.sourceUrl,
    editions: book.editions,
    subtitle: book.subtitle,
    status: book.status,
    sourceName: book.sourceName,
    language: book.language
  };
}

export function resolveBookSlug(book: GhafasehBookImport): string {
  return slugifyBookTitle(book.originalTitle ?? book.title);
}





import { coalesceCoverImage } from "@/lib/book/cover";

/** The edition fields a public book component may present. */
export type BookPresentationEdition = {
  id: string;
  titleOverride?: string | null;
  coverImage?: string | null;
  translator?: string | null;
  publisher?: string | null;
  editionLabel?: string | null;
  language?: string | null;
  publishedYear?: number | null;
  pageCount?: number | null;
  isbn?: string | null;
  isbn10?: string | null;
  isbn13?: string | null;
};

export type BookPresentationSource = {
  title: string;
  author: string;
  coverImage?: string | null;
  /** Optional primary fallback for callers that already have it. */
  primaryEdition?: BookPresentationEdition | null;
};

/**
 * Resolves presentation in one place. An explicit display edition represents
 * page context and must be preserved in links; a primary fallback is visual
 * only, so canonical/general links remain unchanged.
 */
export function resolveBookPresentation(
  book: BookPresentationSource,
  displayEdition?: BookPresentationEdition | null,
) {
  const edition = displayEdition ?? book.primaryEdition ?? null;
  return {
    edition,
    linkEditionId: displayEdition?.id ?? null,
    title: edition?.titleOverride?.trim() || book.title,
    author: book.author,
    coverImage: coalesceCoverImage(edition?.coverImage, book.coverImage),
    translator: edition?.translator?.trim() || null,
    publisher: edition?.publisher?.trim() || null,
    editionLabel: edition?.editionLabel?.trim() || null,
    language: edition?.language?.trim() || null,
    publishedYear: edition?.publishedYear ?? null,
    pageCount: edition?.pageCount ?? null,
    isbn:
      edition?.isbn13?.trim() ||
      edition?.isbn10?.trim() ||
      edition?.isbn?.trim() ||
      null,
  };
}

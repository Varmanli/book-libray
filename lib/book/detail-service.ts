import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  Book,
  BookEdition,
  CatalogBook,
  Quote,
  QuoteLike,
  ReferenceItem,
  User,
} from "@/db/schema";
import { coalesceCoverImage } from "@/lib/book/cover";
import {
  resolveBookDisplayData,
  sampleLegacyBookFieldSql,
} from "@/lib/book/display-cover";
import {
  ensureCatalogBookSlug,
  ensureBookSlug,
  extractCatalogBookIdFromSlug,
} from "@/lib/book/public-slug";
import { primaryEditionOrderBy } from "@/lib/book/primary-edition";
import {
  resolveBookPresentation,
  type BookPresentationEdition,
} from "@/lib/book/presentation";
import {
  getPublicBookExternalLinks,
  type PublicBookExternalLink,
} from "@/lib/book/external-links";
import { splitStoredGenres } from "@/lib/book/genres";
import {
  listPublishedNotesForBook,
  type PublicNote,
} from "@/lib/notes/service";
import type { PublicQuote } from "@/lib/quotes/service";
import type { ReferenceTypeValue } from "@/lib/validations/reference";

export interface BookReferenceLinks {
  author?: string;
  translator?: string;
  publisher?: string;
  country?: string;
}

export interface ReferenceChipData {
  name: string;
  href: string | null;
  image: string | null;
}

export type BookReferenceImages = {
  [K in keyof BookReferenceLinks]?: string | null;
};

export type BookStatus = "UNREAD" | "READING" | "FINISHED";

export interface BookEditionSummary {
  id: string;
  title: string;
  titleOverride: string | null;
  translator: string | null;
  publisher: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  isbn: string | null;
  isbn10: string | null;
  isbn13: string | null;
  editionLabel: string | null;
  editionDescription: string | null;
  coverImage: string | null;
  language: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isPrimary: boolean;
}

export interface BookDetailMeta {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  originalTitle: string | null;
  description: string | null;
  author: string;
  authorSlug?: string | null;
  genres: Array<{ name: string; slug: string | null }>;
  country: string | null;
  countrySlug?: string | null;
  language: string | null;
  firstPublishedYear: number | null;
  displayCoverImage: string | null;
  coverImage: string | null;
}

export interface ViewerLibraryEntry {
  id: string;
  status: BookStatus;
  rating: number | null;
  isFavorite: boolean;
  privateNote: string | null;
  moodTags: string[];
  editionId: string | null;
  catalogBookId: string | null;
}

export interface BookStats {
  wantToReadCount: number;
  readingCount: number;
  finishedCount: number;
  averageRating: number | null;
  ratingCount: number;
}

export type BookDetailResult =
  | { found: false }
  | {
      found: true;
      book: BookDetailMeta;
      presentation: ReturnType<typeof resolveBookPresentation>;
      selectedEdition: BookEditionSummary | null;
      editions: BookEditionSummary[];
      viewer: ViewerLibraryEntry | null;
      stats: BookStats;
      topMoods: string[];
      refLinks: BookReferenceLinks;
      refImages: BookReferenceImages;
      authorChip: ReferenceChipData;
      translatorChip: ReferenceChipData | null;
      quotes: PublicQuote[];
      bookNotes: PublicNote[];
      editionNotes: PublicNote[];
      externalLinks: PublicBookExternalLink[];
    };

type SubjectRow = {
  catalogBookId: string;
  primaryEditionId: string | null;
  slug: string | null;
  title: string;
  subtitle: string | null;
  originalTitle: string | null;
  description: string | null;
  author: string;
  genre: string | null;
  country: string | null;
  language: string | null;
  firstPublishedYear: number | null;
  catalogCoverImage: string | null;
  legacyBookCoverImage: string | null;
};

async function loadBookSubjectRow(ref: string): Promise<SubjectRow | undefined> {
  const [book] = await db
    .select({
      catalogBookId: CatalogBook.id,
      primaryEditionId: CatalogBook.primaryEditionId,
      slug: CatalogBook.slug,
      title: CatalogBook.title,
      subtitle: CatalogBook.subtitle,
      originalTitle: CatalogBook.originalTitle,
      description: CatalogBook.description,
      author: CatalogBook.author,
      genre: CatalogBook.genre,
      country: CatalogBook.country,
      language: CatalogBook.language,
      firstPublishedYear: CatalogBook.firstPublishedYear,
      catalogCoverImage: CatalogBook.coverImage,
      legacyBookCoverImage: sampleLegacyBookFieldSql<string | null>("cover_image"),
    })
    .from(CatalogBook)
    .where(
      and(
        eq(CatalogBook.status, "APPROVED"),
        or(eq(CatalogBook.id, ref), eq(CatalogBook.slug, ref)),
      ),
    )
    .limit(1);

  if (book) return book;

  const [legacy] = await db
    .select({
      catalogBookId: CatalogBook.id,
      primaryEditionId: CatalogBook.primaryEditionId,
      slug: CatalogBook.slug,
      title: CatalogBook.title,
      subtitle: CatalogBook.subtitle,
      originalTitle: CatalogBook.originalTitle,
      description: CatalogBook.description,
      author: CatalogBook.author,
      genre: CatalogBook.genre,
      country: CatalogBook.country,
      language: CatalogBook.language,
      firstPublishedYear: CatalogBook.firstPublishedYear,
      catalogCoverImage: CatalogBook.coverImage,
      legacyBookCoverImage: Book.coverImage,
    })
    .from(Book)
    .innerJoin(CatalogBook, eq(Book.catalogBookId, CatalogBook.id))
    .where(or(eq(Book.id, ref), eq(Book.slug, ref)))
    .limit(1);

  return legacy;
}

async function loadSubjectRow(ref: string): Promise<SubjectRow | undefined> {
  const subject = await loadBookSubjectRow(ref);
  if (subject) return subject;

  const catalogBookId =
    extractCatalogBookIdFromSlug(ref) ??
    (/^[0-9a-f-]{36}$/i.test(ref) ? ref : null);

  if (!catalogBookId) return undefined;
  return loadBookSubjectRow(catalogBookId);
}

async function loadApprovedEditions(catalogBookId: string): Promise<BookEditionSummary[]> {
  const rows = await db
    .select({
      id: BookEdition.id,
      title: CatalogBook.title,
      titleOverride: BookEdition.titleOverride,
      translator: BookEdition.translator,
      publisher: BookEdition.publisher,
      publishedYear: BookEdition.publishedYear,
      pageCount: BookEdition.pageCount,
      isbn: BookEdition.isbn,
      isbn10: BookEdition.isbn10,
      isbn13: BookEdition.isbn13,
      editionLabel: BookEdition.editionLabel,
      editionDescription: BookEdition.editionDescription,
      coverImage: BookEdition.coverImage,
      language: BookEdition.language,
      status: BookEdition.status,
      isPrimary: sql<boolean>`${CatalogBook.primaryEditionId} = ${BookEdition.id}`,
    })
    .from(BookEdition)
    .innerJoin(CatalogBook, eq(BookEdition.catalogBookId, CatalogBook.id))
    .where(
      and(
        eq(BookEdition.catalogBookId, catalogBookId),
        eq(BookEdition.status, "APPROVED"),
      ),
    )
    .orderBy(
      ...primaryEditionOrderBy(CatalogBook.primaryEditionId),
    );

  return rows.map((row) => ({
    ...row,
    coverImage: coalesceCoverImage(row.coverImage),
  }));
}

async function resolveSiblingBookIds(catalogBookId: string): Promise<string[]> {
  const rows = await db
    .select({ id: Book.id })
    .from(Book)
    .where(eq(Book.catalogBookId, catalogBookId));
  return rows.map((row) => row.id);
}

async function loadViewerEntry(
  viewerId: string | undefined,
  catalogBookId: string,
  selectedEditionId: string | null,
): Promise<ViewerLibraryEntry | null> {
  if (!viewerId) return null;

  const filters = selectedEditionId
    ? [
        and(
          eq(Book.userId, viewerId),
          eq(Book.catalogBookId, catalogBookId),
          eq(Book.editionId, selectedEditionId),
        ),
        and(eq(Book.userId, viewerId), eq(Book.catalogBookId, catalogBookId)),
      ]
    : [and(eq(Book.userId, viewerId), eq(Book.catalogBookId, catalogBookId))];

  for (const where of filters) {
    const [entry] = await db
      .select({
        id: Book.id,
        status: Book.status,
        rating: Book.rating,
        isFavorite: Book.isFavorite,
        review: Book.review,
        moodTags: Book.moodTags,
        editionId: Book.editionId,
        catalogBookId: Book.catalogBookId,
      })
      .from(Book)
      .where(where)
      .limit(1);

    if (entry) {
      return {
        id: entry.id,
        status: entry.status,
        rating: entry.rating,
        isFavorite: entry.isFavorite,
        privateNote: entry.review,
        moodTags: entry.moodTags ?? [],
        editionId: entry.editionId,
        catalogBookId: entry.catalogBookId,
      };
    }
  }

  return null;
}

async function loadBookStats(catalogBookId: string): Promise<BookStats> {
  const [row] = await db
    .select({
      wantToReadCount: sql<number>`count(*) filter (where ${Book.status} = 'UNREAD')::int`,
      readingCount: sql<number>`count(*) filter (where ${Book.status} = 'READING')::int`,
      finishedCount: sql<number>`count(*) filter (where ${Book.status} = 'FINISHED')::int`,
      ratingCount: sql<number>`count(*) filter (where ${Book.rating} is not null and ${Book.rating} > 0)::int`,
      averageRating: sql<string | null>`round(avg(${Book.rating}) filter (where ${Book.rating} is not null and ${Book.rating} > 0), 1)`,
    })
    .from(Book)
    .where(eq(Book.catalogBookId, catalogBookId));

  return {
    wantToReadCount: row?.wantToReadCount ?? 0,
    readingCount: row?.readingCount ?? 0,
    finishedCount: row?.finishedCount ?? 0,
    ratingCount: row?.ratingCount ?? 0,
    averageRating: row?.averageRating != null ? Number(row.averageRating) : null,
  };
}

async function loadTopMoods(catalogBookId: string): Promise<string[]> {
  const rows = await db
    .select({ moodTags: Book.moodTags })
    .from(Book)
    .where(eq(Book.catalogBookId, catalogBookId));

  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row.moodTags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

async function loadReferenceLinks(subject: {
  author: string;
  genres: string[];
  translator: string | null;
  publisher: string | null;
  country: string | null;
}): Promise<{
  links: BookReferenceLinks;
  images: BookReferenceImages;
  genres: Array<{ name: string; slug: string | null }>;
}> {
  const pairs: { key: keyof BookReferenceLinks; type: ReferenceTypeValue; name: string }[] = [
    { key: "author", type: "AUTHOR", name: subject.author },
  ];

  if (subject.translator) {
    pairs.push({ key: "translator", type: "TRANSLATOR", name: subject.translator });
  }
  if (subject.publisher) {
    pairs.push({ key: "publisher", type: "PUBLISHER", name: subject.publisher });
  }
  if (subject.country) {
    pairs.push({ key: "country", type: "COUNTRY", name: subject.country });
  }

  const conds = pairs.map((pair) =>
    and(eq(ReferenceItem.type, pair.type), sql`lower(${ReferenceItem.name}) = lower(${pair.name})`),
  );
  for (const genre of subject.genres) {
    conds.push(
      and(eq(ReferenceItem.type, "GENRE"), sql`lower(${ReferenceItem.name}) = lower(${genre})`),
    );
  }

  if (conds.length === 0) {
    return { links: {}, images: {}, genres: [] };
  }

  const rows = await db
    .select({
      type: ReferenceItem.type,
      name: ReferenceItem.name,
      slug: ReferenceItem.slug,
      coverImage: ReferenceItem.coverImage,
    })
    .from(ReferenceItem)
    .where(and(eq(ReferenceItem.status, "APPROVED"), or(...conds)));

  const links: BookReferenceLinks = {};
  const images: BookReferenceImages = {};

  for (const pair of pairs) {
    const match = rows.find(
      (row) => row.type === pair.type && row.slug && row.name.toLowerCase() === pair.name.toLowerCase(),
    );
    if (match?.slug) links[pair.key] = match.slug;
    if (match) images[pair.key] = match.coverImage ?? null;
  }

  return {
    links,
    images,
    genres: subject.genres.map((genre) => {
      const match = rows.find(
        (row) => row.type === "GENRE" && row.name.toLowerCase() === genre.toLowerCase(),
      );
      return { name: genre, slug: match?.slug ?? null };
    }),
  };
}

async function loadPublicQuotes(
  siblingIds: string[],
  subject: {
    title: string;
    author: string;
    coverImage: string | null;
    slug: string;
  },
  viewerId?: string,
  limit?: number,
): Promise<PublicQuote[]> {
  if (siblingIds.length === 0) return [];

  const query = db
    .select({
      id: Quote.id,
      content: Quote.content,
      page: Quote.page,
      bookId: Quote.bookId,
      authorUsername: User.username,
      authorName: User.name,
      authorImage: User.image,
      likeCount: sql<number>`count(${QuoteLike.id})::int`,
      likedByViewer: sql<boolean>`coalesce(bool_or(${QuoteLike.userId} = ${viewerId ?? null}), false)`,
    })
    .from(Quote)
    .innerJoin(Book, eq(Quote.bookId, Book.id))
    .innerJoin(User, eq(Book.userId, User.id))
    .leftJoin(QuoteLike, eq(QuoteLike.quoteId, Quote.id))
    .where(inArray(Quote.bookId, siblingIds))
    .groupBy(Quote.id, User.id)
    .orderBy(desc(sql`count(${QuoteLike.id})`), desc(Quote.id));

  const rows = await (limit ? query.limit(limit) : query);

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    page: row.page,
    bookId: row.bookId,
    bookSlug: subject.slug,
    bookTitle: subject.title,
    bookAuthor: subject.author,
    bookCover: subject.coverImage,
    likeCount: row.likeCount,
    likedByViewer: Boolean(row.likedByViewer),
    authorUsername: row.authorUsername,
    authorName: row.authorName,
    authorImage: row.authorImage,
  }));
}

const DETAIL_QUOTE_LIMIT = 10;

export async function getBookDetail(
  ref: string,
  viewerId?: string,
  preferredEditionId?: string | null,
): Promise<BookDetailResult> {
  const subject = await loadSubjectRow(ref);
  if (!subject) return { found: false };

  const slug = await ensureCatalogBookSlug({
    id: subject.catalogBookId,
    title: subject.title,
    slug: subject.slug,
  });

  const editions = await loadApprovedEditions(subject.catalogBookId);
  const display = resolveBookDisplayData({
    title: subject.title,
    subtitle: subject.subtitle,
    author: subject.author,
    editions,
    primaryEditionId: subject.primaryEditionId,
    selectedEditionId: preferredEditionId ?? null,
    catalogBookCover: subject.catalogCoverImage,
    legacyBookCover: subject.legacyBookCoverImage,
  });
  const selectedEdition = display.displayEdition;
  const displayCoverImage = display.displayCoverImage;

  if (process.env.NODE_ENV !== "production") {
    console.debug("[book-cover-resolution]", {
      catalogBookId: subject.catalogBookId,
      primaryEditionId: subject.primaryEditionId,
      selectedEditionId: selectedEdition?.id ?? null,
      selectedEditionCover: selectedEdition?.coverImage ?? null,
      primaryEditionCover: display.primaryEdition?.coverImage ?? null,
      fallbackEditionCover: display.fallbackEdition?.coverImage ?? null,
      catalogCover: subject.catalogCoverImage,
      legacyBookCover: subject.legacyBookCoverImage,
      finalDisplayCover: displayCoverImage,
    });
  }

  const genreNames = subject.genre ? splitStoredGenres(subject.genre) : [];
  const siblingIds = await resolveSiblingBookIds(subject.catalogBookId);

  const [viewer, stats, topMoods, refData, externalLinks, notes] = await Promise.all([
    loadViewerEntry(viewerId, subject.catalogBookId, selectedEdition?.id ?? null),
    loadBookStats(subject.catalogBookId),
    loadTopMoods(subject.catalogBookId),
    loadReferenceLinks({
      author: subject.author,
      genres: genreNames,
      translator: selectedEdition?.translator ?? null,
      publisher: selectedEdition?.publisher ?? null,
      country: subject.country,
    }),
    getPublicBookExternalLinks(subject.catalogBookId),
    listPublishedNotesForBook({
      catalogBookId: subject.catalogBookId,
      viewerId,
      editionId: selectedEdition?.id ?? null,
    }),
  ]);

  const authorChip: ReferenceChipData = {
    name: subject.author,
    href: refData.links.author ? `/authors/${encodeURIComponent(refData.links.author)}` : null,
    image: refData.images.author ?? null,
  };

  const translatorChip: ReferenceChipData | null = selectedEdition?.translator
    ? {
        name: selectedEdition.translator,
        href: refData.links.translator
          ? `/translators/${encodeURIComponent(refData.links.translator)}`
          : null,
        image: refData.images.translator ?? null,
      }
    : null;

  const book: BookDetailMeta = {
    id: subject.catalogBookId,
    slug,
    title: subject.title,
    subtitle: subject.subtitle,
    originalTitle: subject.originalTitle,
    description: subject.description,
    author: subject.author,
    authorSlug: refData.links.author ?? null,
    genres: refData.genres,
    country: subject.country,
    countrySlug: refData.links.country ?? null,
    language: subject.language ?? selectedEdition?.language ?? "fa",
    firstPublishedYear: subject.firstPublishedYear,
    displayCoverImage,
    coverImage: displayCoverImage,
  };
  const presentation = resolveBookPresentation(
    book,
    selectedEdition as BookPresentationEdition | null,
  );

  const quotes = await loadPublicQuotes(
    siblingIds,
    {
      title: subject.title,
      author: subject.author,
      coverImage: book.coverImage,
      slug,
    },
    viewerId,
    DETAIL_QUOTE_LIMIT,
  );

  return {
    found: true,
    book,
    presentation,
    selectedEdition,
    editions,
    viewer,
    stats,
    topMoods,
    refLinks: refData.links,
    refImages: refData.images,
    authorChip,
    translatorChip,
    quotes,
    bookNotes: notes.bookNotes,
    editionNotes: notes.editionNotes,
    externalLinks,
  };
}

export interface BookQuotesPageHeader {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImage: string | null;
}

export type BookQuotesPageResult =
  | { found: false }
  | {
      found: true;
      book: BookQuotesPageHeader;
      quotes: PublicQuote[];
      viewerEntryId: string | null;
    };

export async function getBookQuotesPage(
  ref: string,
  viewerId?: string,
): Promise<BookQuotesPageResult> {
  const subject = await loadSubjectRow(ref);
  if (!subject) return { found: false };

  const slug = await ensureCatalogBookSlug({
    id: subject.catalogBookId,
    title: subject.title,
    slug: subject.slug,
  });

  const siblingIds = await resolveSiblingBookIds(subject.catalogBookId);
  const editions = await loadApprovedEditions(subject.catalogBookId);
  const display = resolveBookDisplayData({
    title: subject.title,
    author: subject.author,
    editions,
    primaryEditionId: subject.primaryEditionId,
    catalogBookCover: subject.catalogCoverImage,
    legacyBookCover: subject.legacyBookCoverImage,
  });
  const coverImage = display.coverImage;

  const [quotes, viewer] = await Promise.all([
    loadPublicQuotes(
      siblingIds,
      {
        title: subject.title,
        author: subject.author,
        coverImage,
        slug,
      },
      viewerId,
    ),
    loadViewerEntry(viewerId, subject.catalogBookId, null),
  ]);

  return {
    found: true,
    book: {
      id: subject.catalogBookId,
      slug,
      title: subject.title,
      author: subject.author,
      coverImage,
    },
    quotes,
    viewerEntryId: viewer?.id ?? null,
  };
}

export type AddToLibraryResult =
  | { ok: false; reason: "NOT_FOUND" | "EDITION_NOT_FOUND" }
  | { ok: true; bookId: string; already: boolean };

export async function addBookToLibrary(
  viewerId: string,
  sourceBookId: string,
  status: BookStatus,
  editionId?: string,
): Promise<AddToLibraryResult> {
  if (editionId) {
    const [edition] = await db
      .select({
        editionId: BookEdition.id,
        catalogBookId: CatalogBook.id,
        title: CatalogBook.title,
        author: CatalogBook.author,
        description: CatalogBook.description,
        genre: CatalogBook.genre,
        country: CatalogBook.country,
        translator: BookEdition.translator,
        publisher: BookEdition.publisher,
        pageCount: BookEdition.pageCount,
        format: BookEdition.format,
        coverImage: sql<string | null>`coalesce(${BookEdition.coverImage}, ${CatalogBook.coverImage})`,
      })
      .from(BookEdition)
      .innerJoin(CatalogBook, eq(BookEdition.catalogBookId, CatalogBook.id))
      .where(
        and(
          eq(BookEdition.id, editionId),
          eq(CatalogBook.id, sourceBookId),
        ),
      )
      .limit(1);

    if (!edition) return { ok: false, reason: "EDITION_NOT_FOUND" };

    const [existing] = await db
      .select({ id: Book.id })
      .from(Book)
      .where(
        and(eq(Book.userId, viewerId), eq(Book.catalogBookId, edition.catalogBookId), eq(Book.editionId, edition.editionId)),
      )
      .limit(1);

    if (existing) return { ok: true, bookId: existing.id, already: true };

    const [created] = await db
      .insert(Book)
      .values({
        title: edition.title,
        author: edition.author,
        description: edition.description,
        genre: edition.genre ?? "نامشخص",
        country: edition.country,
        translator: edition.translator,
        publisher: edition.publisher,
        pageCount: edition.pageCount,
        format: edition.format,
        coverImage: edition.coverImage,
        userId: viewerId,
        status,
        catalogBookId: edition.catalogBookId,
        editionId: edition.editionId,
      })
      .returning({ id: Book.id });

    return { ok: true, bookId: created.id, already: false };
  }

  const [catalog] = await db
    .select({ id: CatalogBook.id })
    .from(CatalogBook)
    .where(eq(CatalogBook.id, sourceBookId))
    .limit(1);

  if (catalog) {
    const [bestEdition] = await db
      .select({ id: BookEdition.id })
      .from(BookEdition)
      .where(and(eq(BookEdition.catalogBookId, sourceBookId), eq(BookEdition.status, "APPROVED")))
      .orderBy(desc(BookEdition.publishedYear), desc(BookEdition.createdAt))
      .limit(1);

    return addBookToLibrary(viewerId, sourceBookId, status, bestEdition?.id);
  }

  const [legacy] = await db
    .select({
      id: Book.id,
      title: Book.title,
      author: Book.author,
      translator: Book.translator,
      publisher: Book.publisher,
      genre: Book.genre,
      country: Book.country,
      description: Book.description,
      coverImage: Book.coverImage,
      pageCount: Book.pageCount,
      format: Book.format,
      catalogBookId: Book.catalogBookId,
      editionId: Book.editionId,
      userId: Book.userId,
    })
    .from(Book)
    .where(eq(Book.id, sourceBookId))
    .limit(1);

  if (!legacy) return { ok: false, reason: "NOT_FOUND" };
  if (legacy.userId === viewerId) return { ok: true, bookId: legacy.id, already: true };

  const existingWhere = legacy.editionId
    ? and(eq(Book.userId, viewerId), eq(Book.editionId, legacy.editionId))
    : legacy.catalogBookId
      ? and(eq(Book.userId, viewerId), eq(Book.catalogBookId, legacy.catalogBookId))
      : null;

  if (existingWhere) {
    const [existing] = await db.select({ id: Book.id }).from(Book).where(existingWhere).limit(1);
    if (existing) return { ok: true, bookId: existing.id, already: true };
  }

  const [created] = await db
    .insert(Book)
    .values({
      title: legacy.title,
      author: legacy.author,
      translator: legacy.translator,
      publisher: legacy.publisher,
      genre: legacy.genre,
      country: legacy.country,
      description: legacy.description,
      coverImage: legacy.coverImage,
      pageCount: legacy.pageCount,
      format: legacy.format,
      userId: viewerId,
      status,
      catalogBookId: legacy.catalogBookId,
      editionId: legacy.editionId,
    })
    .returning({ id: Book.id });

  return { ok: true, bookId: created.id, already: false };
}

export async function ensurePublicBookSlug(ref: string): Promise<string | null> {
  const subject = await loadSubjectRow(ref);
  if (!subject) return null;
  return ensureCatalogBookSlug({
    id: subject.catalogBookId,
    title: subject.title,
    slug: subject.slug,
  });
}

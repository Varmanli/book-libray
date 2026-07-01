import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  Book,
  BookEdition,
  CatalogBook,
  PublishedBookNote,
  PublishedBookNoteLike,
  Quote,
  QuoteLike,
  ReferenceItem,
  User,
} from "@/db/schema";
import {
  ensureCatalogBookSlug,
  ensureBookSlug,
  extractCatalogBookIdFromSlug,
} from "@/lib/book/public-slug";
import { coalesceCoverImage } from "@/lib/book/cover";
import { splitStoredGenres } from "@/lib/book/genres";
import {
  getPublicBookExternalLinks,
  type PublicBookExternalLink,
} from "@/lib/book/external-links";
import type { ReferenceTypeValue } from "@/lib/validations/reference";
import type { PublicQuote } from "@/lib/quotes/service";
import type { PublicNote } from "@/lib/notes/service";

/** اسلاگ‌های صفحه‌ی عمومیِ موجودیت‌های مرجعِ مرتبط با کتاب (در صورت تأییدشده‌بودن). */
export interface BookReferenceLinks {
  author?: string;
  translator?: string;
  publisher?: string;
  country?: string;
}

/**
 * داده‌ی چیپ نویسنده/مترجم برای نمایش آواتار دایره‌ای: نام همیشه هست؛ `href`
 * فقط وقتی مرجع تأییدشده دارد و `image` تصویر همان مرجع است (در صورت وجود).
 */
export interface ReferenceChipData {
  name: string;
  href: string | null;
  image: string | null;
}

/** تصویر مرجعِ هر فیلد متادیتا (در صورت وجود مرجع تأییدشده با تصویر). */
export type BookReferenceImages = {
  [K in keyof BookReferenceLinks]?: string | null;
};

export type BookStatus = "UNREAD" | "READING" | "FINISHED";

export interface BookDetailMeta {
  id: string;
  slug: string;
  title: string;
  originalTitle: string | null;
  description: string | null;
  coverImage: string | null;
  author: string;
  authorSlug?: string | null;
  translator: string | null;
  translatorSlug?: string | null;
  publisher: string | null;
  publisherSlug?: string | null;
  genres: Array<{ name: string; slug: string | null }>;
  country: string | null;
  countrySlug?: string | null;
  pageCount: number | null;
  format: "PHYSICAL" | "ELECTRONIC";
  language: string | null;
  publishedYear: number | null;
  editionLabel: string | null;
  isbn: string | null;
}

export interface ViewerLibraryEntry {
  id: string;
  status: BookStatus;
  rating: number | null;
  isFavorite: boolean;
  privateNote: string | null;
  moodTags: string[];
}

/**
 * Aggregate stats across the book identity (all library rows sharing the same
 * `catalogBookId`; for a legacy book with no catalog link this is just that one
 * row, so counts reflect the only data the model has). Ratings are 1..10.
 */
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
      viewer: ViewerLibraryEntry | null;
      stats: BookStats;
      topMoods: string[];
      refLinks: BookReferenceLinks;
      refImages: BookReferenceImages;
      authorChip: ReferenceChipData;
      translatorChip: ReferenceChipData | null;
      quotes: PublicQuote[];
      notes: PublicNote[];
      externalLinks: PublicBookExternalLink[];
    };

type SubjectRow = {
  id: string;
  publicBookId: string;
  sourceBookId: string | null;
  slug: string | null;
  title: string;
  author: string;
  translator: string | null;
  publisher: string | null;
  genre: string | null;
  country: string | null;
  description: string | null;
  coverImage: string | null;
  pageCount: number | null;
  format: "PHYSICAL" | "ELECTRONIC";
  catalogBookId: string | null;
  originalTitle: string | null;
  catalogLanguage: string | null;
  editionLanguage: string | null;
  publishedYear: number | null;
  editionLabel: string | null;
  isbn: string | null;
};

type BestApprovedEditionRow = {
  id: string;
  translator: string | null;
  publisher: string | null;
  coverImage: string | null;
  pageCount: number | null;
  format: "PHYSICAL" | "ELECTRONIC" | null;
  language: string | null;
  publishedYear: number | null;
  editionLabel: string | null;
  isbn: string | null;
};

type SampleCatalogBookRow = {
  id: string;
  coverImage: string | null;
};

function bestEditionField<T>(catalogId: unknown, fieldName: string) {
  return sql<T>`(
    select be.${sql.raw(fieldName)}
    from "BookEdition" be
    where be.catalog_book_id = ${catalogId}
      and be.status = 'APPROVED'
    order by
      (be.cover_image is not null and trim(be.cover_image) <> '') desc,
      be.published_year desc nulls last,
      be.created_at desc
    limit 1
  )`;
}

function sampleCatalogBookField<T>(catalogId: unknown, fieldName: string) {
  return sql<T>`(
    select b.${sql.raw(fieldName)}
    from "Book" b
    where b.catalog_book_id = ${catalogId}
    order by
      (b.cover_image is not null and trim(b.cover_image) <> '') desc,
      (b.slug is not null) desc,
      b.created_at desc
    limit 1
  )`;
}

async function loadBestApprovedEdition(
  catalogBookId: string
): Promise<BestApprovedEditionRow | null> {
  const [edition] = await db
    .select({
      id: BookEdition.id,
      translator: BookEdition.translator,
      publisher: BookEdition.publisher,
      coverImage: BookEdition.coverImage,
      pageCount: BookEdition.pageCount,
      format: BookEdition.format,
      language: BookEdition.language,
      publishedYear: BookEdition.publishedYear,
      editionLabel: BookEdition.editionLabel,
      isbn: BookEdition.isbn,
    })
    .from(BookEdition)
    .where(
      and(
        eq(BookEdition.catalogBookId, catalogBookId),
        eq(BookEdition.status, "APPROVED")
      )
    )
    .orderBy(
      desc(sql`${BookEdition.coverImage} is not null and trim(${BookEdition.coverImage}) <> ''`),
      desc(BookEdition.publishedYear),
      desc(BookEdition.createdAt)
    )
    .limit(1);

  return edition ?? null;
}

async function loadSampleCatalogBook(
  catalogBookId: string
): Promise<SampleCatalogBookRow | null> {
  const [book] = await db
    .select({
      id: Book.id,
      coverImage: Book.coverImage,
    })
    .from(Book)
    .where(eq(Book.catalogBookId, catalogBookId))
    .orderBy(
      desc(sql`${Book.coverImage} is not null and trim(${Book.coverImage}) <> ''`),
      desc(sql`${Book.slug} is not null`),
      desc(Book.createdAt)
    )
    .limit(1);

  return book ?? null;
}

/**
 * Book identity: rows sharing a `catalogBookId` are the same canonical book
 * across users; a legacy book with no catalog link is its own island. Public
 * quotes/notes and the viewer's own entry are resolved over this identity set.
 */
async function resolveSiblingBookIds(
  bookId: string | null,
  catalogBookId: string | null
): Promise<string[]> {
  if (!catalogBookId) return bookId ? [bookId] : [];
  const rows = await db
    .select({ id: Book.id })
    .from(Book)
    .where(eq(Book.catalogBookId, catalogBookId));
  return rows.map((r) => r.id);
}

/**
 * Loads the subject book row (by slug OR id) plus optional catalog/edition
 * extras. Accepting both keeps old `/book/[uuid]` links resolvable while the
 * canonical URL is slug-based.
 */
async function loadBookSubjectRow(ref: string): Promise<SubjectRow | undefined> {
  const [subject] = await db
    .select({
      id: sql<string>`coalesce(${CatalogBook.id}, ${Book.id})`,
      publicBookId: sql<string>`coalesce(${CatalogBook.id}, ${Book.id})`,
      sourceBookId: Book.id,
      slug: sql<string | null>`coalesce(${CatalogBook.slug}, ${Book.slug})`,
      title: sql<string>`coalesce(${CatalogBook.title}, ${Book.title})`,
      author: sql<string>`coalesce(${CatalogBook.author}, ${Book.author})`,
      translator: Book.translator,
      publisher: Book.publisher,
      genre: sql<string | null>`coalesce(${CatalogBook.genre}, ${Book.genre})`,
      country: sql<string | null>`coalesce(${CatalogBook.country}, ${Book.country})`,
      description: sql<string | null>`coalesce(${CatalogBook.description}, ${Book.description})`,
      coverImage: sql<string | null>`coalesce(${CatalogBook.coverImage}, ${Book.coverImage})`,
      pageCount: Book.pageCount,
      format: sql<"PHYSICAL" | "ELECTRONIC">`coalesce(${Book.format}, 'PHYSICAL')`,
      catalogBookId: Book.catalogBookId,
      originalTitle: CatalogBook.originalTitle,
      catalogLanguage: CatalogBook.language,
      editionLanguage: sql<string | null>`null`,
      publishedYear: sql<number | null>`null`,
      editionLabel: sql<string | null>`null`,
      isbn: sql<string | null>`null`,
    })
    .from(Book)
    .leftJoin(CatalogBook, eq(Book.catalogBookId, CatalogBook.id))
    .where(
      or(
        eq(Book.slug, ref),
        eq(Book.id, ref),
        eq(Book.catalogBookId, ref),
        eq(CatalogBook.slug, ref),
      )
    )
    .orderBy(
      sql`case
        when ${Book.slug} = ${ref} then 0
        when ${Book.id} = ${ref} then 1
        when ${Book.catalogBookId} = ${ref} then 2
        else 3
      end`,
      desc(sql`${Book.slug} is not null`),
      desc(Book.createdAt)
    )
    .limit(1);

  if (!subject) return undefined;
  if (!subject.catalogBookId) return subject;

  const edition = await loadBestApprovedEdition(subject.catalogBookId);
  if (!edition) return subject;

  return {
    ...subject,
    translator: edition.translator ?? subject.translator,
    publisher: edition.publisher ?? subject.publisher,
    coverImage: edition.coverImage ?? subject.coverImage,
    pageCount: edition.pageCount ?? subject.pageCount,
    format: edition.format ?? subject.format,
    editionLanguage: edition.language,
    publishedYear: edition.publishedYear,
    editionLabel: edition.editionLabel,
    isbn: edition.isbn,
  };
}

async function loadCatalogSubjectRow(
  catalogBookId: string
): Promise<SubjectRow | undefined> {
  const [catalog, edition, sampleBook] = await Promise.all([
    db
      .select({
        id: CatalogBook.id,
        publicBookId: CatalogBook.id,
        slug: CatalogBook.slug,
        title: CatalogBook.title,
        author: CatalogBook.author,
        genre: CatalogBook.genre,
        country: CatalogBook.country,
        description: CatalogBook.description,
        coverImage: CatalogBook.coverImage,
        originalTitle: CatalogBook.originalTitle,
        catalogLanguage: CatalogBook.language,
      })
      .from(CatalogBook)
      .where(
        and(eq(CatalogBook.id, catalogBookId), eq(CatalogBook.status, "APPROVED"))
      )
      .limit(1),
    loadBestApprovedEdition(catalogBookId),
    loadSampleCatalogBook(catalogBookId),
  ]);

  const subject = catalog[0];
  if (!subject) return undefined;

  return {
    id: subject.id,
    publicBookId: subject.publicBookId,
    sourceBookId: sampleBook?.id ?? null,
    slug: subject.slug,
    title: subject.title,
    author: subject.author,
    translator: edition?.translator ?? null,
    publisher: edition?.publisher ?? null,
    genre: subject.genre,
    country: subject.country,
    description: subject.description,
    coverImage: edition?.coverImage ?? subject.coverImage ?? sampleBook?.coverImage ?? null,
    pageCount: edition?.pageCount ?? null,
    format: edition?.format ?? "PHYSICAL",
    catalogBookId,
    originalTitle: subject.originalTitle,
    catalogLanguage: subject.catalogLanguage,
    editionLanguage: edition?.language ?? null,
    publishedYear: edition?.publishedYear ?? null,
    editionLabel: edition?.editionLabel ?? null,
    isbn: edition?.isbn ?? null,
  };
}

async function loadSubjectRow(ref: string): Promise<SubjectRow | undefined> {
  const [catalogBySlug] = await db
    .select({ id: CatalogBook.id })
    .from(CatalogBook)
    .where(and(eq(CatalogBook.slug, ref), eq(CatalogBook.status, "APPROVED")))
    .limit(1);
  if (catalogBySlug) {
    return loadCatalogSubjectRow(catalogBySlug.id);
  }

  const subject = await loadBookSubjectRow(ref);
  if (subject) return subject;

  const catalogBookId =
    extractCatalogBookIdFromSlug(ref) ??
    (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)
      ? ref
      : null);
  if (!catalogBookId) return undefined;
  return loadCatalogSubjectRow(catalogBookId);
}

/**
 * Public quotes across a book identity, sorted by like count then newest
 * (Quote has no timestamp, so the id is the newest-first proxy). Shared by the
 * detail page (top N) and the all-quotes page (full list).
 */
async function loadPublicQuotes(
  siblingIds: string[],
  subject: {
    title: string;
    author: string;
    coverImage: string | null;
    slug: string;
  },
  viewerId?: string,
  limit?: number
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
      likedByViewer: sql<boolean>`coalesce(bool_or(${QuoteLike.userId} = ${
        viewerId ?? null
      }), false)`,
    })
    .from(Quote)
    .innerJoin(Book, eq(Quote.bookId, Book.id))
    .innerJoin(User, eq(Book.userId, User.id))
    .leftJoin(QuoteLike, eq(QuoteLike.quoteId, Quote.id))
    .where(inArray(Quote.bookId, siblingIds))
    .groupBy(Quote.id, User.id)
    .orderBy(desc(sql`count(${QuoteLike.id})`), desc(Quote.id));

  const rows = await (limit ? query.limit(limit) : query);

  return rows.map((q) => ({
    id: q.id,
    content: q.content,
    page: q.page,
    bookId: q.bookId,
    bookSlug: subject.slug,
    bookTitle: subject.title,
    bookAuthor: subject.author,
    bookCover: subject.coverImage,
    likeCount: q.likeCount,
    likedByViewer: Boolean(q.likedByViewer),
    authorUsername: q.authorUsername,
    authorName: q.authorName,
    authorImage: q.authorImage,
  }));
}

/** The viewer's own Book row within a book identity, if any. */
async function loadViewerEntry(
  siblingIds: string[],
  viewerId?: string
): Promise<ViewerLibraryEntry | null> {
  if (!viewerId || siblingIds.length === 0) return null;
  const [entry] = await db
    .select({
      id: Book.id,
      status: Book.status,
      rating: Book.rating,
      isFavorite: Book.isFavorite,
      review: Book.review,
      moodTags: Book.moodTags,
    })
    .from(Book)
    .where(and(eq(Book.userId, viewerId), inArray(Book.id, siblingIds)))
    .limit(1);

  if (!entry) return null;
  return {
    id: entry.id,
    status: entry.status,
    rating: entry.rating,
    isFavorite: entry.isFavorite,
    privateNote: entry.review,
    moodTags: entry.moodTags ?? [],
  };
}

/**
 * Top mood tags across the whole book identity, most-common first (max 5).
 * Aggregated in JS over the small sibling set — no fake data, just what users
 * actually saved.
 */
async function loadTopMoods(siblingIds: string[]): Promise<string[]> {
  if (siblingIds.length === 0) return [];
  const rows = await db
    .select({ moodTags: Book.moodTags })
    .from(Book)
    .where(inArray(Book.id, siblingIds));

  const counts = new Map<string, number>();
  for (const row of rows) {
    for (const tag of row.moodTags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  // پرتکرارترین حس‌ها (بیشترین تعداد اول)، فقط ۳ مورد برتر.
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
}

/**
 * Reading-status counts and average rating across the whole book identity
 * (`siblingIds`). Single grouped query — never call per component.
 */
async function loadBookStats(siblingIds: string[]): Promise<BookStats> {
  if (siblingIds.length === 0) {
    return {
      wantToReadCount: 0,
      readingCount: 0,
      finishedCount: 0,
      averageRating: null,
      ratingCount: 0,
    };
  }
  const [row] = await db
    .select({
      wantToReadCount: sql<number>`count(*) filter (where ${Book.status} = 'UNREAD')::int`,
      readingCount: sql<number>`count(*) filter (where ${Book.status} = 'READING')::int`,
      finishedCount: sql<number>`count(*) filter (where ${Book.status} = 'FINISHED')::int`,
      ratingCount: sql<number>`count(*) filter (where ${Book.rating} is not null and ${Book.rating} > 0)::int`,
      averageRating: sql<string | null>`round(avg(${Book.rating}) filter (where ${Book.rating} is not null and ${Book.rating} > 0), 1)`,
    })
    .from(Book)
    .where(inArray(Book.id, siblingIds));

  return {
    wantToReadCount: row?.wantToReadCount ?? 0,
    readingCount: row?.readingCount ?? 0,
    finishedCount: row?.finishedCount ?? 0,
    ratingCount: row?.ratingCount ?? 0,
    averageRating:
      row?.averageRating != null ? Number(row.averageRating) : null,
  };
}

/**
 * Resolves which of the book's metadata names (author/genre/translator/
 * publisher/country) have an APPROVED public reference page, returning their
 * slugs so the detail page can link them. Names without an approved reference
 * are simply omitted (plain text fallback).
 */
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
  const pairs: {
    key: keyof BookReferenceLinks;
    type: ReferenceTypeValue;
    name: string;
  }[] = [
    { key: "author", type: "AUTHOR", name: subject.author },
  ];
  if (subject.translator)
    pairs.push({ key: "translator", type: "TRANSLATOR", name: subject.translator });
  if (subject.publisher)
    pairs.push({ key: "publisher", type: "PUBLISHER", name: subject.publisher });
  if (subject.country)
    pairs.push({ key: "country", type: "COUNTRY", name: subject.country });

  const conds = pairs.map((p) =>
    and(
      eq(ReferenceItem.type, p.type),
      sql`lower(${ReferenceItem.name}) = lower(${p.name})`
    )
  );
  for (const genre of subject.genres) {
    conds.push(
      and(
        eq(ReferenceItem.type, "GENRE"),
        sql`lower(${ReferenceItem.name}) = lower(${genre})`
      )
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
  const genres = subject.genres.map((genre) => {
    const match = rows.find(
      (r) =>
        r.type === "GENRE" &&
        r.name.toLowerCase() === genre.toLowerCase()
    );
    return {
      name: genre,
      slug: match?.slug ?? null,
    };
  });
  for (const p of pairs) {
    const match = rows.find(
      (r) =>
        r.type === p.type &&
        !!r.slug &&
        r.name.toLowerCase() === p.name.toLowerCase()
    );
    if (match?.slug) links[p.key] = match.slug;
    if (match) images[p.key] = match.coverImage ?? null;
  }
  return { links, images, genres };
}

/** Top 10 quotes are shown on the book detail page; the rest live at /book/[id]/quotes. */
const DETAIL_QUOTE_LIMIT = 10;

export async function getBookDetail(
  ref: string,
  viewerId?: string
): Promise<BookDetailResult> {
  const subject = await loadSubjectRow(ref);

  if (!subject) return { found: false };

  const slug = subject.catalogBookId
    ? await ensureCatalogBookSlug({
        id: subject.catalogBookId,
        title: subject.title,
        slug: subject.slug,
      })
    : await ensureBookSlug({
        id: subject.id,
        title: subject.title,
        slug: subject.slug,
      });

  const siblingIds = await resolveSiblingBookIds(
    subject.sourceBookId,
    subject.catalogBookId
  );
  const genreNames = subject.genre ? splitStoredGenres(subject.genre) : [];

  const [viewer, stats, topMoods, refData, externalLinks] = await Promise.all([
    loadViewerEntry(siblingIds, viewerId),
    loadBookStats(siblingIds),
    loadTopMoods(siblingIds),
    loadReferenceLinks({
      author: subject.author,
      genres: genreNames,
      translator: subject.translator,
      publisher: subject.publisher,
      country: subject.country,
    }),
    subject.catalogBookId
      ? getPublicBookExternalLinks(subject.catalogBookId)
      : Promise.resolve([] as PublicBookExternalLink[]),
  ]);

  const refLinks = refData.links;
  const authorChip: ReferenceChipData = {
    name: subject.author,
    href: refLinks.author
      ? `/authors/${encodeURIComponent(refLinks.author)}`
      : null,
    image: refData.images.author ?? null,
  };
  const translatorChip: ReferenceChipData | null = subject.translator
    ? {
        name: subject.translator,
        href: refLinks.translator
          ? `/translators/${encodeURIComponent(refLinks.translator)}`
          : null,
        image: refData.images.translator ?? null,
      }
    : null;

  const book: BookDetailMeta = {
    id: subject.publicBookId,
    slug,
    title: subject.title,
    originalTitle: subject.originalTitle,
    description: subject.description,
    coverImage: coalesceCoverImage(subject.coverImage),
    author: subject.author,
    authorSlug: refLinks.author ?? null,
    translator: subject.translator,
    translatorSlug: refLinks.translator ?? null,
    publisher: subject.publisher,
    publisherSlug: refLinks.publisher ?? null,
    genres: refData.genres,
    country: subject.country,
    countrySlug: refLinks.country ?? null,
    pageCount: subject.pageCount,
    format: subject.format,
    language: subject.editionLanguage ?? subject.catalogLanguage,
    publishedYear: subject.publishedYear,
    editionLabel: subject.editionLabel,
    isbn: subject.isbn,
  };

  // top quotes for the detail page slider
  const quotes = await loadPublicQuotes(
    siblingIds,
    {
      title: subject.title,
      author: subject.author,
      coverImage: coalesceCoverImage(subject.coverImage),
      slug,
    },
    viewerId,
    DETAIL_QUOTE_LIMIT
  );

  const noteRows =
    siblingIds.length === 0
      ? []
      : await db
          .select({
            id: PublishedBookNote.id,
            content: PublishedBookNote.content,
            bookId: PublishedBookNote.bookId,
            createdAt: PublishedBookNote.createdAt,
            authorUsername: User.username,
            authorName: User.name,
            authorImage: User.image,
            likeCount: sql<number>`count(${PublishedBookNoteLike.id})::int`,
            likedByViewer: sql<boolean>`coalesce(bool_or(${PublishedBookNoteLike.userId} = ${
              viewerId ?? null
            }), false)`,
          })
          .from(PublishedBookNote)
          .innerJoin(User, eq(PublishedBookNote.userId, User.id))
          .leftJoin(
            PublishedBookNoteLike,
            eq(PublishedBookNoteLike.noteId, PublishedBookNote.id)
          )
          .where(inArray(PublishedBookNote.bookId, siblingIds))
          .groupBy(PublishedBookNote.id, User.id)
          .orderBy(desc(PublishedBookNote.createdAt))
          .limit(50);

  const notes: PublicNote[] = noteRows.map((n) => ({
    id: n.id,
    content: n.content,
    bookId: n.bookId,
    bookSlug: slug,
    bookTitle: subject.title,
    bookAuthor: subject.author,
    bookCover: coalesceCoverImage(subject.coverImage),
    createdAt: n.createdAt,
    likeCount: n.likeCount,
    likedByViewer: Boolean(n.likedByViewer),
    authorUsername: n.authorUsername,
    authorName: n.authorName,
    authorImage: n.authorImage,
  }));

  return {
    found: true,
    book,
    viewer,
    stats,
    topMoods,
    refLinks,
    refImages: refData.images,
    authorChip,
    translatorChip,
    quotes,
    notes,
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

/**
 * All public quotes for a book (sorted by likes), plus the viewer's own entry id
 * so the all-quotes page can show owner edit/delete. Reuses the same loaders as
 * the detail page — no duplicated query logic.
 */
export async function getBookQuotesPage(
  ref: string,
  viewerId?: string
): Promise<BookQuotesPageResult> {
  const subject = await loadSubjectRow(ref);
  if (!subject) return { found: false };

  const slug = subject.catalogBookId
    ? await ensureCatalogBookSlug({
        id: subject.catalogBookId,
        title: subject.title,
        slug: subject.slug,
      })
    : await ensureBookSlug({
        id: subject.id,
        title: subject.title,
        slug: subject.slug,
      });

  const siblingIds = await resolveSiblingBookIds(
    subject.sourceBookId,
    subject.catalogBookId
  );

  const [quotes, viewer] = await Promise.all([
    loadPublicQuotes(
      siblingIds,
      {
        title: subject.title,
        author: subject.author,
        coverImage: coalesceCoverImage(subject.coverImage),
        slug,
      },
      viewerId
    ),
    loadViewerEntry(siblingIds, viewerId),
  ]);

  return {
    found: true,
    book: {
      id: subject.publicBookId,
      slug,
      title: subject.title,
      author: subject.author,
      coverImage: coalesceCoverImage(subject.coverImage),
    },
    quotes,
    viewerEntryId: viewer?.id ?? null,
  };
}

export type AddToLibraryResult =
  | { ok: false; reason: "NOT_FOUND" }
  | { ok: true; bookId: string; already: boolean };

/**
 * Adds the book at `sourceBookId` to the viewer's library by copying its public
 * fields (and catalog/edition links) into a fresh Book row. Idempotent per
 * viewer for catalog-linked books; returns the existing copy if present.
 */
export async function addBookToLibrary(
  viewerId: string,
  sourceBookId: string,
  status: BookStatus
): Promise<AddToLibraryResult> {
  const [src] = await db
    .select({
      id: Book.id,
      userId: Book.userId,
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
    })
    .from(Book)
    .where(eq(Book.id, sourceBookId))
    .limit(1);

  if (!src) {
    const [catalogSrc] = await db
      .select({
        id: CatalogBook.id,
        title: CatalogBook.title,
        author: CatalogBook.author,
        description: CatalogBook.description,
        genre: CatalogBook.genre,
        country: CatalogBook.country,
        coverImage: sql<string | null>`(
          coalesce(
            ${bestEditionField<string | null>(CatalogBook.id, "cover_image")},
            ${CatalogBook.coverImage}
          )
        )`,
        translator: bestEditionField<string | null>(CatalogBook.id, "translator"),
        publisher: bestEditionField<string | null>(CatalogBook.id, "publisher"),
        pageCount: bestEditionField<number | null>(CatalogBook.id, "page_count"),
        format: sql<"PHYSICAL" | "ELECTRONIC">`coalesce((
          ${bestEditionField<"PHYSICAL" | "ELECTRONIC" | null>(CatalogBook.id, "format")}
        ), 'PHYSICAL')`,
        editionId: bestEditionField<string | null>(CatalogBook.id, "id"),
      })
      .from(CatalogBook)
      .where(eq(CatalogBook.id, sourceBookId))
      .limit(1);

    if (!catalogSrc) return { ok: false, reason: "NOT_FOUND" };

    const [existing] = await db
      .select({ id: Book.id })
      .from(Book)
      .where(and(eq(Book.userId, viewerId), eq(Book.catalogBookId, catalogSrc.id)))
      .limit(1);
    if (existing) return { ok: true, bookId: existing.id, already: true };

    const [createdFromCatalog] = await db
      .insert(Book)
      .values({
        title: catalogSrc.title,
        author: catalogSrc.author,
        translator: catalogSrc.translator,
        publisher: catalogSrc.publisher,
        genre: catalogSrc.genre ?? "نامشخص",
        country: catalogSrc.country,
        description: catalogSrc.description,
        coverImage: catalogSrc.coverImage,
        pageCount: catalogSrc.pageCount,
        format: catalogSrc.format,
        userId: viewerId,
        status,
        catalogBookId: catalogSrc.id,
        editionId: catalogSrc.editionId,
      })
      .returning({ id: Book.id });

    return { ok: true, bookId: createdFromCatalog.id, already: false };
  }

  // already the viewer's own row
  if (src.userId === viewerId) return { ok: true, bookId: src.id, already: true };

  // existing viewer copy by canonical identity (or edition)
  if (src.catalogBookId) {
    const [existing] = await db
      .select({ id: Book.id })
      .from(Book)
      .where(
        and(eq(Book.userId, viewerId), eq(Book.catalogBookId, src.catalogBookId))
      )
      .limit(1);
    if (existing) return { ok: true, bookId: existing.id, already: true };
  } else if (src.editionId) {
    const [existing] = await db
      .select({ id: Book.id })
      .from(Book)
      .where(and(eq(Book.userId, viewerId), eq(Book.editionId, src.editionId)))
      .limit(1);
    if (existing) return { ok: true, bookId: existing.id, already: true };
  }

  const [created] = await db
    .insert(Book)
    .values({
      title: src.title,
      author: src.author,
      translator: src.translator,
      publisher: src.publisher,
      genre: src.genre,
      country: src.country,
      description: src.description,
      coverImage: src.coverImage,
      pageCount: src.pageCount,
      format: src.format,
      userId: viewerId,
      status,
      catalogBookId: src.catalogBookId,
      editionId: src.editionId,
    })
    .returning({ id: Book.id });

  return { ok: true, bookId: created.id, already: false };
}

import { and, eq, ilike } from "drizzle-orm";

import { db } from "@/db";
import { BookEdition, CatalogBook } from "@/db/schema";
import { normalizeCoverImage } from "@/lib/book/cover";
import { generateUniqueCatalogBookSlug } from "@/lib/book/public-slug";
import { serializeGenres } from "@/lib/book/genres";
import { buildImportPreview } from "@/lib/books/import/validate";
import {
  joinPeople,
  normalizeIsbn,
  referenceNames,
} from "@/lib/books/import/normalize";
import {
  createReferenceResolutionCache,
  resolveReferenceItem,
} from "@/lib/reference/service";
import type {
  ImportPreviewResponse,
  ImportResultResponse,
  NormalizedImportBook,
  ReferencePreviewSummary,
} from "@/lib/books/import/types";

async function findReusableCatalogBook(book: NormalizedImportBook) {
  const title = book.title.trim();
  const firstAuthor = (book.authors[0]?.name ?? "").trim();

  const [existing] = await db
    .select({
      id: CatalogBook.id,
      title: CatalogBook.title,
      originalTitle: CatalogBook.originalTitle,
    })
    .from(CatalogBook)
    .where(
      and(
        ilike(CatalogBook.title, title),
        ilike(CatalogBook.author, `%${firstAuthor}%`),
      ),
    )
    .limit(1);

  if (!existing) return null;

  if (
    book.originalTitle &&
    existing.originalTitle &&
    book.originalTitle.trim().toLowerCase() !== existing.originalTitle.trim().toLowerCase()
  ) {
    return null;
  }

  return existing;
}

function resolveEditionCover(
  coverFilename: string | null | undefined,
  coverUrl: string | null | undefined,
) {
  return {
    coverImage: normalizeCoverImage(coverUrl ?? null),
    coverFilename: coverFilename?.trim() || null,
  };
}

function addReferenceSummary(
  target: ReferencePreviewSummary,
  key: keyof ReferencePreviewSummary,
) {
  target[key] += 1;
}

export async function importNormalizedBooks(
  books: NormalizedImportBook[],
  adminId: string,
  previewInput?: ImportPreviewResponse,
): Promise<ImportResultResponse> {
  const preview = previewInput ?? await buildImportPreview(books);
  const errors: string[] = [];
  const result: ImportResultResponse = {
    importedCount: 0,
    skippedCount: 0,
    invalidCount: preview.invalidCount,
    createdBooks: 0,
    reusedBooks: 0,
    createdEditions: 0,
    skippedDuplicateEditions: 0,
    failedBooks: 0,
    failedEditions: 0,
    referenceItems: { created: 0, reused: 0, updated: 0 },
    errors,
  };

  const referenceCache = createReferenceResolutionCache();

  for (const previewBook of preview.books) {
    const importableEditions = previewBook.editions.filter(
      (edition) => edition.isValid && edition.duplicateState !== "existing_edition",
    );

    if (previewBook.errors.length > 0 || importableEditions.length === 0) {
      result.failedBooks += 1;
      result.failedEditions += previewBook.editions.length;
      errors.push(
        `ردیف ${previewBook.rowNumbers.join("، ")}: کتاب «${previewBook.title || "بدون عنوان"}» آماده‌ی واردسازی نیست.`,
      );
      continue;
    }

    try {
      await db.transaction(async (tx) => {
        const reusableBook = previewBook.duplicateState === "existing_book"
          ? await findReusableCatalogBook(previewBook)
          : null;

        const catalogBookId = reusableBook
          ? reusableBook.id
          : await (async () => {
              const id = crypto.randomUUID();
              const slug = await generateUniqueCatalogBookSlug(previewBook.title, id);
              const [created] = await tx
                .insert(CatalogBook)
                .values({
                  id,
                  title: previewBook.title,
                  subtitle: previewBook.subtitle ?? null,
                  slug,
                  originalTitle: previewBook.originalTitle ?? null,
                  description: previewBook.description ?? null,
                  coverImage: null,
                  author: joinPeople(previewBook.authors),
                  language: previewBook.language || "fa",
                  genre: serializeGenres(referenceNames(previewBook.genres)),
                  country: previewBook.country?.name ?? null,
                  firstPublishedYear: previewBook.firstPublishedYear ?? null,
                  sourceName: previewBook.sourceName ?? "bulk_import",
                  sourceUrl: previewBook.sourceUrl ?? null,
                  status: previewBook.status.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED",
                  createdById: adminId,
                  updatedAt: new Date(),
                })
                .returning({ id: CatalogBook.id });
              return created.id;
            })();

        if (reusableBook) {
          result.reusedBooks += 1;
        } else {
          result.createdBooks += 1;
        }
        result.importedCount += 1;

        for (const author of previewBook.authors) {
          const resolved = await resolveReferenceItem(tx, {
            type: "AUTHOR",
            input: author,
            cache: referenceCache,
            createdById: adminId,
            defaultStatus: "APPROVED",
          });
          if (resolved) addReferenceSummary(result.referenceItems, resolved.resolution);
        }

        for (const genre of previewBook.genres) {
          const resolved = await resolveReferenceItem(tx, {
            type: "GENRE",
            input: genre,
            cache: referenceCache,
            createdById: adminId,
            defaultStatus: "APPROVED",
          });
          if (resolved) addReferenceSummary(result.referenceItems, resolved.resolution);
        }

        if (previewBook.country) {
          const resolved = await resolveReferenceItem(tx, {
            type: "COUNTRY",
            input: previewBook.country,
            cache: referenceCache,
            createdById: adminId,
            defaultStatus: "APPROVED",
          });
          if (resolved) addReferenceSummary(result.referenceItems, resolved.resolution);
        }

        for (const edition of previewBook.editions) {
          if (!edition.isValid) {
            result.failedEditions += 1;
            continue;
          }
          if (edition.duplicateState === "existing_edition") {
            result.skippedDuplicateEditions += 1;
            continue;
          }

          const normalizedIsbn13 = normalizeIsbn(edition.isbn13);
          const normalizedIsbn10 = normalizeIsbn(edition.isbn10);

          if (normalizedIsbn13 || normalizedIsbn10) {
            const [existingEdition] = await tx
              .select({ id: BookEdition.id })
              .from(BookEdition)
              .where(
                normalizedIsbn13
                  ? eq(BookEdition.isbn13, normalizedIsbn13)
                  : eq(BookEdition.isbn10, normalizedIsbn10!),
              )
              .limit(1);

            if (existingEdition) {
              result.skippedDuplicateEditions += 1;
              continue;
            }
          }

          for (const translator of edition.translators) {
            const resolved = await resolveReferenceItem(tx, {
              type: "TRANSLATOR",
              input: translator,
              cache: referenceCache,
              createdById: adminId,
              defaultStatus: "APPROVED",
            });
            if (resolved) addReferenceSummary(result.referenceItems, resolved.resolution);
          }

          if (edition.publisher) {
            const resolved = await resolveReferenceItem(tx, {
              type: "PUBLISHER",
              input: edition.publisher,
              cache: referenceCache,
              createdById: adminId,
              defaultStatus: "APPROVED",
            });
            if (resolved) addReferenceSummary(result.referenceItems, resolved.resolution);
          }

          const editionCover = resolveEditionCover(
            edition.coverFilename,
            edition.coverUrl,
          );

          await tx.insert(BookEdition).values({
            catalogBookId,
            titleOverride: edition.titleOverride ?? null,
            translator: edition.translators.length > 0 ? joinPeople(edition.translators) : null,
            publisher: edition.publisher?.name ?? null,
            isbn: normalizedIsbn13 ?? normalizedIsbn10,
            isbn10: normalizedIsbn10,
            isbn13: normalizedIsbn13,
            format: "PHYSICAL",
            coverImage: editionCover.coverImage,
            coverFilename: editionCover.coverFilename,
            publishedYear: edition.publishedYear ?? null,
            editionLabel: edition.titleOverride ?? null,
            editionDescription: edition.editionDescription ?? null,
            pageCount: edition.pageCount ?? null,
            language: previewBook.language || "fa",
            sourceName: edition.sourceName ?? previewBook.sourceName ?? "bulk_import",
            sourceUrl: edition.sourceUrl ?? previewBook.sourceUrl ?? null,
            sourceEditionCode: edition.sourceEditionCode ?? null,
            status: edition.status.toUpperCase() as "PENDING" | "APPROVED" | "REJECTED",
            createdById: adminId,
            updatedAt: new Date(),
          });

          result.createdEditions += 1;
        }
      });
    } catch (error) {
      result.failedBooks += 1;
      result.failedEditions += importableEditions.length;
      errors.push(
        `کتاب «${previewBook.title}» وارد نشد${error instanceof Error ? `: ${error.message}` : "."}`,
      );
    }
  }

  result.skippedCount = preview.summary.totalBooks - result.importedCount;

  return result;
}

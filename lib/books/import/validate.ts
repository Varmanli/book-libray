import {
  createReferenceResolutionCache,
  previewResolveReferenceItem,
} from "@/lib/reference/service";
import {
  findExistingBookMatches,
  findExistingEditionDuplicates,
} from "@/lib/books/import/duplicates";
import { db } from "@/db";
import {
  cleanString,
  canPersistCoverUrl,
  normalizeBookGroupingKey,
  normalizeIsbn,
} from "@/lib/books/import/normalize";
import type {
  ImportPreviewBook,
  ImportPreviewEdition,
  ImportPreviewResponse,
  NormalizedImportBook,
  ReferencePreviewSummary,
} from "@/lib/books/import/types";

function isYearValid(value: number | null | undefined) {
  return value == null || (Number.isInteger(value) && value >= 0 && value <= 3000);
}

function emptyReferenceSummary(): ReferencePreviewSummary {
  return { created: 0, reused: 0, updated: 0 };
}

function incrementReferenceSummary(
  summary: ReferencePreviewSummary,
  key: keyof ReferencePreviewSummary,
) {
  summary[key] += 1;
}

function hasMeaningfulEditionIdentity(edition: NormalizedImportBook["editions"][number]) {
  return [
    edition.titleOverride,
    edition.publisher?.name,
    edition.isbn10,
    edition.isbn13,
    edition.coverFilename,
    edition.coverUrl,
    edition.editionDescription,
    edition.publishedYear,
    edition.pageCount,
    edition.translators[0]?.name,
  ].some((item) => item != null && String(item).trim() !== "");
}

function getEditionIdentityKey(
  book: NormalizedImportBook,
  edition: NormalizedImportBook["editions"][number],
) {
  const isbn13 = normalizeIsbn(edition.isbn13);
  if (isbn13) return `isbn13:${isbn13}`;

  const isbn10 = normalizeIsbn(edition.isbn10);
  if (isbn10) return `isbn10:${isbn10}`;

  return [
    normalizeBookGroupingKey(
      book.title,
      book.authors[0]?.name ?? "",
      book.originalTitle,
    ),
    (edition.publisher?.name ?? "").trim().toLowerCase(),
    (edition.translators[0]?.name ?? "").trim().toLowerCase(),
    edition.publishedYear ?? "",
    edition.pageCount ?? "",
    (edition.titleOverride ?? "").trim().toLowerCase(),
  ].join("::");
}

export async function buildImportPreview(
  books: NormalizedImportBook[],
): Promise<ImportPreviewResponse> {
  const [bookMatches, editionDuplicates] = await Promise.all([
    findExistingBookMatches(books),
    findExistingEditionDuplicates(books),
  ]);

  const referenceCache = createReferenceResolutionCache();
  const fileEditionCounts = new Map<string, number>();
  for (const book of books) {
    for (const edition of book.editions) {
      const key = getEditionIdentityKey(book, edition);
      fileEditionCounts.set(key, (fileEditionCounts.get(key) ?? 0) + 1);
    }
  }

  const previewBooks: ImportPreviewBook[] = [];

  for (const book of books) {
    const bookErrors: string[] = [];
    const bookWarnings: string[] = [];
    const bookReferenceSummary = emptyReferenceSummary();

    if (!cleanString(book.title)) {
      bookErrors.push("عنوان کتاب الزامی است.");
    }
    if (book.authors.length === 0) {
      bookErrors.push("حداقل یک نویسنده برای کتاب لازم است.");
    }
    if (!isYearValid(book.firstPublishedYear)) {
      bookErrors.push("سال انتشار اولیه معتبر نیست.");
    }
    if (book.editions.length === 0) {
      bookErrors.push("حداقل یک نسخه برای هر کتاب لازم است.");
    }

    for (const author of book.authors) {
      const resolved = await previewResolveReferenceItem(db, {
        type: "AUTHOR",
        input: author,
        cache: referenceCache,
      });
      if (resolved) incrementReferenceSummary(bookReferenceSummary, resolved.resolution);
    }

    for (const genre of book.genres) {
      const resolved = await previewResolveReferenceItem(db, {
        type: "GENRE",
        input: genre,
        cache: referenceCache,
      });
      if (resolved) incrementReferenceSummary(bookReferenceSummary, resolved.resolution);
    }

    if (book.country) {
      const resolved = await previewResolveReferenceItem(db, {
        type: "COUNTRY",
        input: book.country,
        cache: referenceCache,
      });
      if (resolved) incrementReferenceSummary(bookReferenceSummary, resolved.resolution);
    }

    const bookKey = normalizeBookGroupingKey(
      book.title,
      book.authors[0]?.name ?? "",
      book.originalTitle,
    );
    const matchedBook = bookMatches.get(bookKey);

    if (matchedBook?.matchType === "existing_book") {
      bookWarnings.push("این کتاب از قبل در کاتالوگ وجود دارد و نسخه‌ها به همان اثر اضافه می‌شوند.");
    } else if (matchedBook?.matchType === "possible_existing_book") {
      bookWarnings.push("ممکن است این ردیف متعلق به کتابی باشد که از قبل در کاتالوگ ثبت شده است.");
    }

    const editionPreviews: ImportPreviewEdition[] = [];

    for (const edition of book.editions) {
      const errors: string[] = [];
      const warnings: string[] = [];
      const referenceSummary = emptyReferenceSummary();
      const identityKey = getEditionIdentityKey(book, edition);
      const isbn13 = normalizeIsbn(edition.isbn13);
      const isbn10 = normalizeIsbn(edition.isbn10);
      let duplicateState: ImportPreviewEdition["duplicateState"] = "none";
      let duplicateMessage: string | undefined;

      if (!isYearValid(edition.publishedYear)) {
        errors.push("سال چاپ نسخه معتبر نیست.");
      }
      if (edition.pageCount != null && (!Number.isInteger(edition.pageCount) || edition.pageCount <= 0)) {
        errors.push("تعداد صفحات باید یک عدد مثبت باشد.");
      }
      if (edition.coverUrl && !canPersistCoverUrl(edition.coverUrl)) {
        errors.push(
          "مسیر محلی جلد (/uploads/ یا public/uploads/) قابل واردسازی نیست؛ یک URL عمومی معتبر وارد کنید.",
        );
      }
      if (!hasMeaningfulEditionIdentity(edition)) {
        warnings.push("این نسخه مشخصه‌ی متمایزکننده‌ی کمی دارد و بهتر است مترجم، ناشر، شابک یا سال چاپ تکمیل شود.");
      }

      if ((fileEditionCounts.get(identityKey) ?? 0) > 1) {
        duplicateState = "file_duplicate";
        duplicateMessage = "این نسخه در همین فایل بیش از یک بار تکرار شده است.";
        errors.push(duplicateMessage);
      } else {
        const existingDuplicate =
          (isbn13 ? editionDuplicates.get(isbn13) : undefined) ??
          (isbn10 ? editionDuplicates.get(isbn10) : undefined);
        if (existingDuplicate) {
          duplicateState = "existing_edition";
          duplicateMessage = "نسخه‌ای با همین شابک از قبل در کاتالوگ ثبت شده است و در مرحله‌ی واردسازی رد می‌شود.";
          warnings.push(duplicateMessage);
        }
      }

      for (const translator of edition.translators) {
        const resolved = await previewResolveReferenceItem(db, {
          type: "TRANSLATOR",
          input: translator,
          cache: referenceCache,
        });
        if (resolved) incrementReferenceSummary(referenceSummary, resolved.resolution);
      }

      if (edition.publisher) {
        const resolved = await previewResolveReferenceItem(db, {
          type: "PUBLISHER",
          input: edition.publisher,
          cache: referenceCache,
        });
        if (resolved) incrementReferenceSummary(referenceSummary, resolved.resolution);
      }

      editionPreviews.push({
        ...edition,
        isValid: errors.length === 0,
        errors,
        warnings,
        duplicateState,
        duplicateMessage,
        referenceSummary,
      });
    }

    const readyEditions = editionPreviews.filter(
      (edition) => edition.isValid && edition.duplicateState !== "existing_edition",
    ).length;

    previewBooks.push({
      ...book,
      isValid: bookErrors.length === 0 && readyEditions > 0,
      errors: bookErrors,
      warnings: bookWarnings,
      duplicateState: matchedBook?.matchType ?? "none",
      duplicateMessage: matchedBook
        ? matchedBook.matchType === "existing_book"
          ? "کتاب موجود شناسایی شد."
          : "شباهت به کتاب موجود شناسایی شد."
        : undefined,
      referenceSummary: bookReferenceSummary,
      editions: editionPreviews,
    });
  }

  const totalEditions = previewBooks.reduce((sum, book) => sum + book.editions.length, 0);
  const validBooks = previewBooks.filter((book) => book.isValid).length;
  const invalidBooks = previewBooks.length - validBooks;
  const duplicateBooks = previewBooks.filter((book) => book.duplicateState !== "none").length;
  const duplicateEditions = previewBooks.reduce(
    (sum, book) => sum + book.editions.filter((edition) => edition.duplicateState !== "none").length,
    0,
  );
  const readyEditions = previewBooks.reduce(
    (sum, book) =>
      sum +
      book.editions.filter(
        (edition) => edition.isValid && edition.duplicateState !== "existing_edition",
      ).length,
    0,
  );
  const readyBooks = previewBooks.filter((book) =>
    book.errors.length === 0 &&
    book.editions.some(
      (edition) => edition.isValid && edition.duplicateState !== "existing_edition",
    ),
  ).length;

  return {
    validCount: validBooks,
    invalidCount: invalidBooks,
    summary: {
      totalBooks: previewBooks.length,
      totalEditions,
      validBooks,
      invalidBooks,
      duplicateBooks,
      duplicateEditions,
      readyBooks,
      readyEditions,
    },
    books: previewBooks,
  };
}

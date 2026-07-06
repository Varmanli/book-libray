import { and, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { BookEdition, CatalogBook } from "@/db/schema";
import {
  normalizeBookGroupingKey,
  normalizeIsbn,
} from "@/lib/books/import/normalize";
import type {
  ExistingBookMatch,
  ExistingEditionDuplicate,
  NormalizedImportBook,
} from "@/lib/books/import/types";

export async function findExistingBookMatches(
  books: NormalizedImportBook[],
): Promise<Map<string, ExistingBookMatch>> {
  const matches = new Map<string, ExistingBookMatch>();

  for (const book of books) {
    const title = book.title.trim();
    const firstAuthor = (book.authors[0]?.name ?? "").trim();
    const key = normalizeBookGroupingKey(title, firstAuthor, book.originalTitle);

    const [exact] = await db
      .select({
        id: CatalogBook.id,
        title: CatalogBook.title,
        author: CatalogBook.author,
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

    if (exact) {
      matches.set(key, {
        ...exact,
        matchType:
          book.originalTitle && exact.originalTitle && book.originalTitle !== exact.originalTitle
            ? "possible_existing_book"
            : "existing_book",
      });
      continue;
    }

    const [possible] = await db
      .select({
        id: CatalogBook.id,
        title: CatalogBook.title,
        author: CatalogBook.author,
        originalTitle: CatalogBook.originalTitle,
      })
      .from(CatalogBook)
      .where(
        or(
          ilike(CatalogBook.title, title),
          book.originalTitle ? ilike(CatalogBook.originalTitle, book.originalTitle) : eq(CatalogBook.id, "__none__"),
        ),
      )
      .limit(1);

    if (possible) {
      matches.set(key, { ...possible, matchType: "possible_existing_book" });
    }
  }

  return matches;
}

export async function findExistingEditionDuplicates(
  books: NormalizedImportBook[],
): Promise<Map<string, ExistingEditionDuplicate>> {
  const isbns = new Set<string>();
  for (const book of books) {
    for (const edition of book.editions) {
      const isbn13 = normalizeIsbn(edition.isbn13);
      const isbn10 = normalizeIsbn(edition.isbn10);
      if (isbn13) isbns.add(isbn13);
      if (isbn10) isbns.add(isbn10);
    }
  }

  const map = new Map<string, ExistingEditionDuplicate>();
  if (isbns.size === 0) return map;

  const rows = await db
    .select({
      id: BookEdition.id,
      catalogBookId: BookEdition.catalogBookId,
      isbn10: BookEdition.isbn10,
      isbn13: BookEdition.isbn13,
    })
    .from(BookEdition)
    .where(
      or(
        ...Array.from(isbns).map((isbn) =>
          or(eq(BookEdition.isbn10, isbn), eq(BookEdition.isbn13, isbn)),
        ),
      ),
    );

  for (const row of rows) {
    if (row.isbn10) map.set(row.isbn10, row);
    if (row.isbn13) map.set(row.isbn13, row);
  }

  return map;
}

import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  Book,
  BookEdition,
  CatalogBook,
  HomeFeaturedBook,
  HomeHeroSlideBook,
  User,
} from "@/db/schema";
import { coalesceCoverImage } from "@/lib/book/cover";
import {
  generateUniqueCatalogBookSlug,
  isLegacyCatalogSlug,
} from "@/lib/book/public-slug";
import { splitStoredGenres } from "@/lib/book/genres";
import { adminCreateReference } from "@/lib/reference/service";

type Counters = {
  fixedSlugs: number;
  fixedCovers: number;
  fixedMetadata: number;
  fixedRelations: number;
  approvedAdminBooks: number;
  fixedHomeContent: number;
  fixedReferences: number;
  skipped: number;
  errors: number;
};

async function main() {
  const counters: Counters = {
    fixedSlugs: 0,
    fixedCovers: 0,
    fixedMetadata: 0,
    fixedRelations: 0,
    approvedAdminBooks: 0,
    fixedHomeContent: 0,
    fixedReferences: 0,
    skipped: 0,
    errors: 0,
  };

  const catalogBooks = await db
    .select({
      id: CatalogBook.id,
      title: CatalogBook.title,
      slug: CatalogBook.slug,
      coverImage: CatalogBook.coverImage,
      status: CatalogBook.status,
      createdById: CatalogBook.createdById,
      author: CatalogBook.author,
      genre: CatalogBook.genre,
      country: CatalogBook.country,
    })
    .from(CatalogBook)
    .orderBy(asc(CatalogBook.createdAt));

  for (const book of catalogBooks) {
    try {
      const updates: Partial<typeof CatalogBook.$inferInsert> = {};

      if (!book.slug?.trim() || isLegacyCatalogSlug(book.slug)) {
        updates.slug = await generateUniqueCatalogBookSlug(book.title, book.id, book.id);
        counters.fixedSlugs += 1;
      }

      const [bestEdition] = await db
        .select({
          coverImage: BookEdition.coverImage,
          translator: BookEdition.translator,
          publisher: BookEdition.publisher,
        })
        .from(BookEdition)
        .where(and(eq(BookEdition.catalogBookId, book.id), eq(BookEdition.status, "APPROVED")))
        .orderBy(
          sql`(case when ${BookEdition.coverImage} is not null and trim(${BookEdition.coverImage}) <> '' then 1 else 0 end) desc`,
          sql`${BookEdition.publishedYear} desc nulls last`,
          sql`${BookEdition.createdAt} desc`,
        )
        .limit(1);

      const [sampleBook] = await db
        .select({ coverImage: Book.coverImage })
        .from(Book)
        .where(eq(Book.catalogBookId, book.id))
        .orderBy(descSql(Book.createdAt))
        .limit(1);

      const canonicalCover = coalesceCoverImage(
        book.coverImage,
        bestEdition?.coverImage,
        sampleBook?.coverImage,
      );

      if (canonicalCover && canonicalCover !== book.coverImage) {
        updates.coverImage = canonicalCover;
        counters.fixedCovers += 1;
      }

      if (book.status !== "APPROVED" && book.createdById) {
        const [creator] = await db
          .select({ role: User.role })
          .from(User)
          .where(eq(User.id, book.createdById))
          .limit(1);
        if (creator?.role === "ADMIN") {
          updates.status = "APPROVED";
          counters.approvedAdminBooks += 1;
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await db.update(CatalogBook).set(updates).where(eq(CatalogBook.id, book.id));
      } else {
        counters.skipped += 1;
      }

      // ارتقای روابط مرجع (نویسنده/ژانر/مترجم/ناشر/کشور) به APPROVED در صورت امکان.
      try {
        const genres = splitStoredGenres(book.genre);
        await Promise.all([
          book.author ? adminCreateReference("AUTHOR", book.author) : Promise.resolve(),
          ...genres.map((g) => adminCreateReference("GENRE", g)),
          bestEdition?.translator
            ? adminCreateReference("TRANSLATOR", bestEdition.translator)
            : Promise.resolve(),
          bestEdition?.publisher
            ? adminCreateReference("PUBLISHER", bestEdition.publisher)
            : Promise.resolve(),
          book.country ? adminCreateReference("COUNTRY", book.country) : Promise.resolve(),
        ]);
        counters.fixedReferences += 1;
      } catch {
        // بی‌صدا؛ ارتقای مرجع best-effort است.
      }
    } catch (error) {
      counters.errors += 1;
      console.error(`catalog backfill failed for ${book.id}:`, error);
    }
  }

  const orphanBooks = await db
    .select({
      id: Book.id,
      title: Book.title,
      author: Book.author,
    })
    .from(Book)
    .where(isNull(Book.catalogBookId));

  for (const row of orphanBooks) {
    try {
      const [match] = await db
        .select({ id: CatalogBook.id })
        .from(CatalogBook)
        .where(
          and(
            sql`lower(${CatalogBook.title}) = lower(${row.title})`,
            sql`lower(${CatalogBook.author}) = lower(${row.author})`,
          ),
        )
        .limit(1);

      if (!match) {
        counters.skipped += 1;
        continue;
      }

      const [edition] = await db
        .select({ id: BookEdition.id })
        .from(BookEdition)
        .where(
          and(
            eq(BookEdition.catalogBookId, match.id),
            eq(BookEdition.status, "APPROVED"),
          ),
        )
        .orderBy(
          sql`(case when ${BookEdition.coverImage} is not null and trim(${BookEdition.coverImage}) <> '' then 1 else 0 end) desc`,
          sql`${BookEdition.publishedYear} desc nulls last`,
          sql`${BookEdition.createdAt} desc`,
        )
        .limit(1);

      await db
        .update(Book)
        .set({
          catalogBookId: match.id,
          editionId: edition?.id ?? null,
        })
        .where(eq(Book.id, row.id));
      counters.fixedRelations += 1;
    } catch (error) {
      counters.errors += 1;
      console.error(`book relation backfill failed for ${row.id}:`, error);
    }
  }

  // محتوای صفحه‌ی اصلی: انتخاب‌های قدیمیِ مبتنی بر book_id را به هویت کانونی
  // (catalog_book_id) نگاشت می‌کند تا با resolver جدید هم نمایش داده شوند.
  for (const table of [HomeFeaturedBook, HomeHeroSlideBook] as const) {
    try {
      const legacyRows = await db
        .select({
          id: table.id,
          bookId: table.bookId,
        })
        .from(table)
        .where(and(isNull(table.catalogBookId), isNotNull(table.bookId)));

      for (const row of legacyRows) {
        if (!row.bookId) continue;
        const [book] = await db
          .select({ catalogBookId: Book.catalogBookId })
          .from(Book)
          .where(eq(Book.id, row.bookId))
          .limit(1);
        if (!book?.catalogBookId) {
          counters.skipped += 1;
          continue;
        }
        await db
          .update(table)
          .set({ catalogBookId: book.catalogBookId })
          .where(eq(table.id, row.id));
        counters.fixedHomeContent += 1;
      }
    } catch (error) {
      counters.errors += 1;
      console.error("home content backfill failed:", error);
    }
  }

  console.log(
    JSON.stringify(
      {
        fixedSlugs: counters.fixedSlugs,
        fixedCovers: counters.fixedCovers,
        fixedMetadata: counters.fixedMetadata,
        fixedRelations: counters.fixedRelations,
        approvedAdminBooks: counters.approvedAdminBooks,
        fixedHomeContent: counters.fixedHomeContent,
        fixedReferences: counters.fixedReferences,
        skippedRecords: counters.skipped,
        errors: counters.errors,
      },
      null,
      2,
    ),
  );
}

function descSql(column: unknown) {
  return sql`${column} desc`;
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});

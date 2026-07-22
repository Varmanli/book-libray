import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { Book } from "@/db/schema";

export interface CurrentlyReadingBook {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  pageCount: number | null;
  currentPage: number;
  progress: number;
  readingUpdatedAt: Date | null;
  rating: number | null;
  review: string | null;
  moodTags: string[] | null;
}

export async function getCurrentlyReadingBooks(userId: string): Promise<CurrentlyReadingBook[]> {
  const books = await db
    .select({
      id: Book.id,
      title: Book.title,
      author: Book.author,
      coverImage: Book.coverImage,
      pageCount: Book.pageCount,
      currentPage: Book.currentPage,
      progress: Book.progress,
      readingUpdatedAt: Book.readingUpdatedAt,
      rating: Book.rating,
      review: Book.review,
      moodTags: Book.moodTags,
    })
    .from(Book)
    .where(and(eq(Book.userId, userId), eq(Book.status, "READING")))
    .orderBy(desc(Book.readingUpdatedAt), desc(Book.createdAt));

  return books.map((book) => ({
      ...book,
      progress: book.pageCount && book.pageCount > 0
        ? Math.round((book.currentPage / book.pageCount) * 100)
        : book.progress ?? 0,
    }));
}

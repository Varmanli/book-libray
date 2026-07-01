import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  Book,
  CatalogBook,
  PublishedBookNote,
  PublishedBookNoteLike,
  User,
} from "@/db/schema";

/** خطای کنترل‌شده‌ی یادداشت که route handler آن را به پاسخ HTTP تبدیل می‌کند. */
export class NoteError extends Error {
  constructor(message: string, public status = 400, public code?: string) {
    super(message);
    this.name = "NoteError";
  }
}

export interface PublicNote {
  id: string;
  content: string;
  bookId: string;
  bookSlug?: string | null;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string | null;
  createdAt: Date;
  likeCount: number;
  likedByViewer: boolean;
  authorUsername: string | null;
  authorName: string | null;
  authorImage: string | null;
}

export type PublicNotesResult =
  | { found: false }
  | { found: true; isPrivate: true }
  | { found: true; isPrivate: false; isOwner: boolean; notes: PublicNote[] };

/**
 * Published notes for a profile. Only rows in PublishedBookNote (notes the user
 * explicitly published) are returned — never the private `Book.review`. Like
 * quotes, they inherit the profile's privacy: a private profile exposes nothing
 * to a non-owner.
 */
export async function getPublishedNotesByUsername(
  username: string,
  viewerId?: string
): Promise<PublicNotesResult> {
  const [user] = await db
    .select({
      id: User.id,
      username: User.username,
      name: User.name,
      image: User.image,
      profileVisibility: User.profileVisibility,
    })
    .from(User)
    .where(sql`lower(${User.username}) = lower(${username})`)
    .limit(1);

  if (!user) return { found: false };

  const isOwner = !!viewerId && viewerId === user.id;
  if (user.profileVisibility === "PRIVATE" && !isOwner) {
    return { found: true, isPrivate: true };
  }

  const rows = await db
    .select({
      id: PublishedBookNote.id,
      content: PublishedBookNote.content,
      bookId: PublishedBookNote.bookId,
      bookSlug: sql<string | null>`coalesce(${CatalogBook.slug}, ${Book.slug})`,
      bookTitle: Book.title,
      bookAuthor: Book.author,
      bookCover: Book.coverImage,
      createdAt: PublishedBookNote.createdAt,
      likeCount: sql<number>`count(${PublishedBookNoteLike.id})::int`,
      likedByViewer: sql<boolean>`coalesce(bool_or(${PublishedBookNoteLike.userId} = ${
        viewerId ?? null
      }), false)`,
    })
    .from(PublishedBookNote)
    .innerJoin(Book, eq(PublishedBookNote.bookId, Book.id))
    .leftJoin(CatalogBook, eq(Book.catalogBookId, CatalogBook.id))
    .leftJoin(
      PublishedBookNoteLike,
      eq(PublishedBookNoteLike.noteId, PublishedBookNote.id)
    )
    .where(eq(PublishedBookNote.userId, user.id))
    .groupBy(PublishedBookNote.id, Book.id, CatalogBook.id)
    .orderBy(desc(PublishedBookNote.createdAt))
    .limit(30);

  const notes: PublicNote[] = rows.map((r) => ({
    ...r,
    likedByViewer: Boolean(r.likedByViewer),
    authorUsername: user.username,
    authorName: user.name,
    authorImage: user.image,
  }));

  return { found: true, isPrivate: false, isOwner, notes };
}

/** Toggles the current user's like on a published note. */
export async function togglePublishedNoteLike(
  noteId: string,
  userId: string
): Promise<{ liked: boolean; likeCount: number } | null> {
  const [note] = await db
    .select({ id: PublishedBookNote.id })
    .from(PublishedBookNote)
    .where(eq(PublishedBookNote.id, noteId))
    .limit(1);

  if (!note) return null;

  const removed = await db
    .delete(PublishedBookNoteLike)
    .where(
      and(
        eq(PublishedBookNoteLike.noteId, noteId),
        eq(PublishedBookNoteLike.userId, userId)
      )
    )
    .returning({ id: PublishedBookNoteLike.id });

  let liked: boolean;
  if (removed.length > 0) {
    liked = false;
  } else {
    await db
      .insert(PublishedBookNoteLike)
      .values({ noteId, userId })
      .onConflictDoNothing();
    liked = true;
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(PublishedBookNoteLike)
    .where(eq(PublishedBookNoteLike.noteId, noteId));

  return { liked, likeCount: row?.count ?? 0 };
}

/**
 * Publishes a public note for a book the user owns in their library. The book
 * must be one of the user's own Book rows (so the note is tied to their copy and
 * shows on their profile + the book page).
 */
export async function createPublishedNote(
  userId: string,
  bookId: string,
  content: string
): Promise<{ id: string }> {
  const [book] = await db
    .select({ id: Book.id })
    .from(Book)
    .where(and(eq(Book.id, bookId), eq(Book.userId, userId)))
    .limit(1);

  if (!book) {
    throw new NoteError(
      "ابتدا کتاب را به کتابخانه‌ات اضافه کن",
      403,
      "BOOK_NOT_OWNED"
    );
  }

  const [created] = await db
    .insert(PublishedBookNote)
    .values({ userId, bookId, content })
    .returning({ id: PublishedBookNote.id });

  return created;
}

export async function updatePublishedNote(
  userId: string,
  noteId: string,
  content: string
): Promise<{ id: string }> {
  const [updated] = await db
    .update(PublishedBookNote)
    .set({ content, updatedAt: new Date() })
    .where(and(eq(PublishedBookNote.id, noteId), eq(PublishedBookNote.userId, userId)))
    .returning({ id: PublishedBookNote.id });

  if (!updated) {
    throw new NoteError("یادداشت یافت نشد", 404, "NOTE_NOT_FOUND");
  }
  return updated;
}

export async function deletePublishedNote(
  userId: string,
  noteId: string
): Promise<void> {
  const [deleted] = await db
    .delete(PublishedBookNote)
    .where(and(eq(PublishedBookNote.id, noteId), eq(PublishedBookNote.userId, userId)))
    .returning({ id: PublishedBookNote.id });

  if (!deleted) {
    throw new NoteError("یادداشت یافت نشد", 404, "NOTE_NOT_FOUND");
  }
}

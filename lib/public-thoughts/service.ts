import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { Book, PersonalBookNote, PublicBookThought, User } from "@/db/schema";

export type PublicThoughtType = "THOUGHT" | "QUOTE" | "REFLECTION";

export async function listPublicBookThoughts(catalogBookId: string) {
  return db
    .select({
      id: PublicBookThought.id,
      content: PublicBookThought.content,
      pageNumber: PublicBookThought.pageNumber,
      type: PublicBookThought.type,
      createdAt: PublicBookThought.createdAt,
      authorName: User.name,
      authorUsername: User.username,
      authorImage: User.image,
    })
    .from(PublicBookThought)
    .innerJoin(User, eq(PublicBookThought.userId, User.id))
    .where(eq(PublicBookThought.catalogBookId, catalogBookId))
    .orderBy(desc(PublicBookThought.createdAt))
    .limit(50);
}

export async function publishPersonalBookThought(input: {
  noteId: string;
  userId: string;
  content: string;
  pageNumber: number | null;
  type: PublicThoughtType;
}) {
  const [source] = await db
    .select({
      noteId: PersonalBookNote.id,
      catalogBookId: Book.catalogBookId,
    })
    .from(PersonalBookNote)
    .innerJoin(Book, eq(PersonalBookNote.bookId, Book.id))
    .where(
      and(
        eq(PersonalBookNote.id, input.noteId),
        eq(PersonalBookNote.userId, input.userId),
        eq(Book.userId, input.userId),
      ),
    )
    .limit(1);

  if (!source?.catalogBookId) return null;

  const [existing] = await db
    .select({ id: PublicBookThought.id })
    .from(PublicBookThought)
    .where(eq(PublicBookThought.sourcePersonalNoteId, source.noteId))
    .limit(1);

  if (existing) {
    const [thought] = await db
      .update(PublicBookThought)
      .set({
        content: input.content,
        pageNumber: input.pageNumber,
        type: input.type,
        updatedAt: new Date(),
      })
      .where(and(eq(PublicBookThought.id, existing.id), eq(PublicBookThought.userId, input.userId)))
      .returning({ id: PublicBookThought.id });
    return thought;
  }

  const [thought] = await db
    .insert(PublicBookThought)
    .values({
      catalogBookId: source.catalogBookId,
      userId: input.userId,
      sourcePersonalNoteId: source.noteId,
      content: input.content,
      pageNumber: input.pageNumber,
      type: input.type,
    })
    .returning({ id: PublicBookThought.id });
  return thought;
}

export async function unpublishPersonalBookThought(noteId: string, userId: string) {
  const rows = await db
    .delete(PublicBookThought)
    .where(
      and(
        eq(PublicBookThought.sourcePersonalNoteId, noteId),
        eq(PublicBookThought.userId, userId),
      ),
    )
    .returning({ id: PublicBookThought.id });
  return rows.length > 0;
}

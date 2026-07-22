import { and, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  Book,
  CatalogBook,
  PublishedBookNote,
  Quote,
  ReferenceItem,
  User,
  Wishlist,
} from "@/db/schema";
import { getReadingStats } from "@/lib/profile/service";

export interface DashboardBookPreview {
  id: string;
  slug: string | null;
  title: string;
  author: string;
  coverImage: string | null;
  status: "UNREAD" | "READING" | "PAUSED" | "FINISHED";
  rating: number | null;
  createdAt: Date;
}

export interface DashboardPendingSubmission {
  id: string;
  title: string;
  type: "CATALOG_BOOK" | "REFERENCE";
  createdAt: Date;
}

export interface DashboardQuotePreview {
  id: string;
  content: string;
  imageKey: string | null;
  page: number | null;
  bookId: string;
  bookSlug: string | null;
  bookTitle: string;
}

export interface DashboardNotePreview {
  id: string;
  content: string;
  bookId: string;
  bookSlug: string | null;
  bookTitle: string;
  createdAt: Date;
}

export interface UserDashboardData {
  profile: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    bannerImage: string | null;
    bio: string | null;
    profileVisibility: "PUBLIC" | "PRIVATE";
  };
  stats: {
    totalBooks: number;
    reading: number;
    finished: number;
    unread: number;
    favorites: number;
    wishlist: number;
    quotes: number;
    notes: number;
  };
  currentlyReading: DashboardBookPreview[];
  recentlyAdded: DashboardBookPreview[];
  recentQuotes: DashboardQuotePreview[];
  recentNotes: DashboardNotePreview[];
  pendingSubmissions: DashboardPendingSubmission[];
  profileCompletion: {
    completed: number;
    total: number;
    percent: number;
    missing: string[];
  };
}

export async function getUserDashboardData(
  userId: string
): Promise<UserDashboardData | null> {
  const [user] = await db
    .select({
      id: User.id,
      name: User.name,
      username: User.username,
      image: User.image,
      bannerImage: User.profileBannerImage,
      bio: User.bio,
      profileVisibility: User.profileVisibility,
    })
    .from(User)
    .where(eq(User.id, userId))
    .limit(1);

  if (!user?.username) {
    return null;
  }

  const [
    readingStats,
    wishlistCount,
    quotesCount,
    notesCount,
    currentlyReading,
    recentlyAdded,
    recentQuotes,
    recentNotes,
    pendingCatalogBooks,
    pendingReferences,
  ] = await Promise.all([
      getReadingStats(userId),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(Wishlist)
        .where(eq(Wishlist.userId, userId))
        .then((rows) => rows[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(Quote)
        .where(eq(Quote.userId, userId))
        .then((rows) => rows[0]?.count ?? 0),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(PublishedBookNote)
        .where(eq(PublishedBookNote.userId, userId))
        .then((rows) => rows[0]?.count ?? 0),
      db
        .select({
          id: Book.id,
          slug: sql<string | null>`coalesce(${CatalogBook.slug}, ${Book.slug})`,
          title: Book.title,
          author: Book.author,
          coverImage: Book.coverImage,
          status: Book.status,
          rating: Book.rating,
          createdAt: Book.createdAt,
        })
        .from(Book)
        .leftJoin(CatalogBook, eq(Book.catalogBookId, CatalogBook.id))
        .where(and(eq(Book.userId, userId), eq(Book.status, "READING")))
        .orderBy(desc(Book.createdAt))
        .limit(6),
      db
        .select({
          id: Book.id,
          slug: sql<string | null>`coalesce(${CatalogBook.slug}, ${Book.slug})`,
          title: Book.title,
          author: Book.author,
          coverImage: Book.coverImage,
          status: Book.status,
          rating: Book.rating,
          createdAt: Book.createdAt,
        })
        .from(Book)
        .leftJoin(CatalogBook, eq(Book.catalogBookId, CatalogBook.id))
        .where(eq(Book.userId, userId))
        .orderBy(desc(Book.createdAt))
        .limit(8),
      // جدیدترین تکه‌های خود کاربر.
      db
        .select({
          id: Quote.id,
          content: Quote.content,
          imageKey: Quote.imageKey,
          page: Quote.page,
          bookId: Quote.bookId,
          bookSlug: sql<string | null>`coalesce(${CatalogBook.slug}, ${Book.slug})`,
          bookTitle: Book.title,
        })
        .from(Quote)
        .innerJoin(Book, eq(Quote.bookId, Book.id))
        .leftJoin(CatalogBook, eq(Book.catalogBookId, CatalogBook.id))
        .where(eq(Quote.userId, userId))
        .orderBy(desc(Quote.createdAt))
        .limit(3),
      db
        .select({
          id: PublishedBookNote.id,
          content: PublishedBookNote.content,
          bookId: sql<string>`coalesce(${PublishedBookNote.bookId}, ${Book.id}, '')`,
          bookSlug: sql<string | null>`coalesce(${CatalogBook.slug}, ${Book.slug})`,
          bookTitle: sql<string>`coalesce(${CatalogBook.title}, ${Book.title}, 'کتاب')`,
          createdAt: PublishedBookNote.createdAt,
        })
        .from(PublishedBookNote)
        .leftJoin(Book, eq(PublishedBookNote.bookId, Book.id))
        .leftJoin(CatalogBook, eq(Book.catalogBookId, CatalogBook.id))
        .where(eq(PublishedBookNote.userId, userId))
        .orderBy(desc(PublishedBookNote.createdAt))
        .limit(3),
      db
        .select({
          id: CatalogBook.id,
          title: CatalogBook.title,
          createdAt: CatalogBook.createdAt,
        })
        .from(CatalogBook)
        .where(
          and(eq(CatalogBook.createdById, userId), eq(CatalogBook.status, "PENDING"))
        )
        .orderBy(desc(CatalogBook.createdAt))
        .limit(4),
      db
        .select({
          id: ReferenceItem.id,
          title: ReferenceItem.name,
          createdAt: ReferenceItem.createdAt,
        })
        .from(ReferenceItem)
        .where(
          and(
            eq(ReferenceItem.createdById, userId),
            eq(ReferenceItem.status, "PENDING")
          )
        )
        .orderBy(desc(ReferenceItem.createdAt))
        .limit(4),
    ]);

  const unread = Math.max(
    readingStats.total - readingStats.reading - readingStats.finished,
    0
  );

  const completionChecks = [
    { ok: !!user.username, label: "نام کاربری" },
    { ok: !!user.image, label: "تصویر پروفایل" },
    { ok: !!user.bio?.trim(), label: "بیوگرافی" },
    { ok: user.profileVisibility === "PUBLIC", label: "حالت عمومی پروفایل" },
  ];
  const completed = completionChecks.filter((item) => item.ok).length;
  const total = completionChecks.length;

  return {
    profile: {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bannerImage: user.bannerImage,
      bio: user.bio,
      profileVisibility: user.profileVisibility,
    },
    stats: {
      totalBooks: readingStats.total,
      reading: readingStats.reading,
      finished: readingStats.finished,
      unread,
      favorites: readingStats.favorites,
      wishlist: wishlistCount,
      quotes: quotesCount,
      notes: notesCount,
    },
    currentlyReading,
    recentlyAdded,
    recentQuotes,
    recentNotes,
    pendingSubmissions: [
      ...pendingCatalogBooks.map((item) => ({
        ...item,
        type: "CATALOG_BOOK" as const,
      })),
      ...pendingReferences.map((item) => ({
        ...item,
        type: "REFERENCE" as const,
      })),
    ].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime()),
    profileCompletion: {
      completed,
      total,
      percent: Math.round((completed / total) * 100),
      missing: completionChecks.filter((item) => !item.ok).map((item) => item.label),
    },
  };
}

import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  Book,
  BookEdition,
  CatalogBook,
  PublishedBookNote,
  Quote,
  ReferenceItem,
  User,
} from "@/db/schema";
import { generateUniqueCatalogBookSlug } from "@/lib/book/public-slug";
import { coalesceCoverImage } from "@/lib/book/cover";
import { splitStoredGenres } from "@/lib/book/genres";
import {
  listBookExternalLinks,
  upsertBookExternalLinks,
  type AdminExternalLink,
} from "@/lib/book/external-links";
import { adminCreateReference } from "@/lib/reference/service";
import type {
  AdminBookUpdateInput,
  ManualBookInput,
} from "@/lib/validations/catalog";
import type { ExternalLinkInput } from "@/lib/validations/external-links";

export interface PendingEditionDTO {
  id: string;
  translator: string | null;
  publisher: string | null;
  isbn: string | null;
  format: string;
  publishedYear: number | null;
  editionLabel: string | null;
  pageCount: number | null;
  coverImage: string | null;
}

export interface PendingCatalogDTO {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  description: string | null;
  createdByName: string | null;
  createdAt: Date;
  editions: PendingEditionDTO[];
}

/** فهرست کتاب‌های کاتالوگ در انتظار تأیید، همراه با نسخه‌ها و سازنده. */
export async function listPendingCatalog(): Promise<PendingCatalogDTO[]> {
  const rows = await db
    .select({
      id: CatalogBook.id,
      title: CatalogBook.title,
      author: CatalogBook.author,
      genre: CatalogBook.genre,
      description: CatalogBook.description,
      createdAt: CatalogBook.createdAt,
      createdByName: User.name,
      editionId: BookEdition.id,
      translator: BookEdition.translator,
      publisher: BookEdition.publisher,
      isbn: BookEdition.isbn,
      format: BookEdition.format,
      publishedYear: BookEdition.publishedYear,
      editionLabel: BookEdition.editionLabel,
      pageCount: BookEdition.pageCount,
      coverImage: BookEdition.coverImage,
    })
    .from(CatalogBook)
    .leftJoin(BookEdition, eq(BookEdition.catalogBookId, CatalogBook.id))
    .leftJoin(User, eq(CatalogBook.createdById, User.id))
    .where(eq(CatalogBook.status, "PENDING"))
    .orderBy(desc(CatalogBook.createdAt))
    .limit(300);

  const map = new Map<string, PendingCatalogDTO>();
  for (const r of rows) {
    let book = map.get(r.id);
    if (!book) {
      book = {
        id: r.id,
        title: r.title,
        author: r.author,
        genre: r.genre,
        description: r.description,
        createdByName: r.createdByName,
        createdAt: r.createdAt,
        editions: [],
      };
      map.set(r.id, book);
    }
    if (r.editionId) {
      book.editions.push({
        id: r.editionId,
        translator: r.translator,
        publisher: r.publisher,
        isbn: r.isbn,
        format: r.format ?? "PHYSICAL",
        publishedYear: r.publishedYear,
        editionLabel: r.editionLabel,
        pageCount: r.pageCount,
        coverImage: r.coverImage,
      });
    }
  }
  return Array.from(map.values());
}

/**
 * تأیید/رد یک کتاب کاتالوگ؛ وضعیت نسخه‌های در انتظارِ همان کتاب هم هم‌سو می‌شود.
 * ردیف‌های کتابخانه‌ی کاربران دست‌نخورده می‌مانند.
 */
export async function setCatalogStatus(
  bookId: string,
  status: "APPROVED" | "REJECTED"
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(CatalogBook)
      .set({ status, updatedAt: new Date() })
      .where(eq(CatalogBook.id, bookId));

    await tx
      .update(BookEdition)
      .set({ status, updatedAt: new Date() })
      .where(
        and(
          eq(BookEdition.catalogBookId, bookId),
          inArray(BookEdition.status, ["PENDING"])
        )
      );
  });
}

/** ویرایش اختیاری متادیتای کتاب کاتالوگ پیش از تأیید. */
export async function updateCatalogMetadata(
  bookId: string,
  input: {
    title?: string;
    author?: string;
    genre?: string;
    description?: string;
  }
): Promise<void> {
  const set: Partial<typeof CatalogBook.$inferInsert> = { updatedAt: new Date() };
  if (input.title !== undefined) set.title = input.title.trim();
  if (input.author !== undefined) set.author = input.author.trim();
  if (input.genre !== undefined) set.genre = input.genre.trim();
  if (input.description !== undefined) set.description = input.description.trim();
  await db.update(CatalogBook).set(set).where(eq(CatalogBook.id, bookId));
}

const COUNT = sql<number>`count(*)::int`;

// ---------------- داشبورد ----------------
export interface AdminOverview {
  counts: {
    users: number;
    books: number;
    pendingBooks: number;
    pendingReferences: number;
    quotes: number;
    notes: number;
  };
  recentUsers: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    createdAt: Date;
  }[];
  recentBooks: {
    id: string;
    title: string;
    author: string;
    status: string;
    createdAt: Date;
  }[];
  recentPending: {
    id: string;
    title: string;
    author: string;
    createdAt: Date;
  }[];
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const [
    [users],
    [books],
    [pendingBooks],
    [pendingReferences],
    [quotes],
    [notes],
    recentUsers,
    recentBooks,
    recentPending,
  ] = await Promise.all([
    db.select({ c: COUNT }).from(User),
    db.select({ c: COUNT }).from(CatalogBook),
    db
      .select({ c: COUNT })
      .from(CatalogBook)
      .where(eq(CatalogBook.status, "PENDING")),
    db
      .select({ c: COUNT })
      .from(ReferenceItem)
      .where(eq(ReferenceItem.status, "PENDING")),
    db.select({ c: COUNT }).from(Quote),
    db.select({ c: COUNT }).from(PublishedBookNote),
    db
      .select({
        id: User.id,
        name: User.name,
        username: User.username,
        image: User.image,
        createdAt: User.createdAt,
      })
      .from(User)
      .orderBy(desc(User.createdAt))
      .limit(6),
    db
      .select({
        id: CatalogBook.id,
        title: CatalogBook.title,
        author: CatalogBook.author,
        status: CatalogBook.status,
        createdAt: CatalogBook.createdAt,
      })
      .from(CatalogBook)
      .orderBy(desc(CatalogBook.createdAt))
      .limit(6),
    db
      .select({
        id: CatalogBook.id,
        title: CatalogBook.title,
        author: CatalogBook.author,
        createdAt: CatalogBook.createdAt,
      })
      .from(CatalogBook)
      .where(eq(CatalogBook.status, "PENDING"))
      .orderBy(desc(CatalogBook.createdAt))
      .limit(6),
  ]);

  return {
    counts: {
      users: users?.c ?? 0,
      books: books?.c ?? 0,
      pendingBooks: pendingBooks?.c ?? 0,
      pendingReferences: pendingReferences?.c ?? 0,
      quotes: quotes?.c ?? 0,
      notes: notes?.c ?? 0,
    },
    recentUsers,
    recentBooks,
    recentPending,
  };
}

// ---------------- مدیریت کاربران ----------------
export interface AdminUserRow {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  image: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
  bookCount: number;
}

export async function adminListUsers(opts: {
  q?: string;
  role?: "USER" | "ADMIN";
  limit?: number;
  offset?: number;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const conds = [];
  if (opts.q?.trim()) {
    const term = `%${opts.q.trim()}%`;
    conds.push(
      or(
        ilike(User.name, term),
        ilike(User.email, term),
        ilike(User.username, term)
      )
    );
  }
  if (opts.role) conds.push(eq(User.role, opts.role));
  const where = conds.length ? and(...conds) : undefined;

  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = opts.offset ?? 0;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: User.id,
        name: User.name,
        username: User.username,
        email: User.email,
        image: User.image,
        role: User.role,
        createdAt: User.createdAt,
        bookCount: sql<number>`count(${Book.id})::int`,
      })
      .from(User)
      .leftJoin(Book, eq(Book.userId, User.id))
      .where(where)
      .groupBy(User.id)
      .orderBy(desc(User.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ c: COUNT }).from(User).where(where),
  ]);

  return { users: rows as AdminUserRow[], total: totalRow?.c ?? 0 };
}

export async function adminSetUserRole(
  userId: string,
  role: "USER" | "ADMIN"
): Promise<void> {
  await db
    .update(User)
    .set({ role, updatedAt: new Date() })
    .where(eq(User.id, userId));
}

// ---------------- مدیریت کتاب‌های کاتالوگ ----------------
export interface AdminBookRow {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  coverImage: string | null;
  editionCount: number;
  linkCount: number;
  createdByName: string | null;
  createdAt: Date;
}

export async function adminListCatalogBooks(opts: {
  q?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  limit?: number;
  offset?: number;
}): Promise<{ books: AdminBookRow[]; total: number }> {
  const conds = [];
  if (opts.q?.trim()) {
    const term = `%${opts.q.trim()}%`;
    conds.push(or(ilike(CatalogBook.title, term), ilike(CatalogBook.author, term)));
  }
  if (opts.status) conds.push(eq(CatalogBook.status, opts.status));
  const where = conds.length ? and(...conds) : undefined;

  const limit = Math.min(opts.limit ?? 20, 100);
  const offset = opts.offset ?? 0;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: CatalogBook.id,
        title: CatalogBook.title,
        author: CatalogBook.author,
        genre: CatalogBook.genre,
        status: CatalogBook.status,
        createdByName: User.name,
        createdAt: CatalogBook.createdAt,
        coverImage: sql<string | null>`coalesce(max(${BookEdition.coverImage}), ${CatalogBook.coverImage})`,
        editionCount: sql<number>`count(${BookEdition.id})::int`,
        linkCount: sql<number>`(
          select count(*) from "BookExternalLink" bel
          where bel.catalog_book_id = ${CatalogBook.id}
        )::int`,
      })
      .from(CatalogBook)
      .leftJoin(BookEdition, eq(BookEdition.catalogBookId, CatalogBook.id))
      .leftJoin(User, eq(CatalogBook.createdById, User.id))
      .where(where)
      .groupBy(CatalogBook.id, User.id)
      .orderBy(desc(CatalogBook.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ c: COUNT }).from(CatalogBook).where(where),
  ]);

  return { books: rows as AdminBookRow[], total: totalRow?.c ?? 0 };
}

export async function setCatalogBookStatus(
  bookId: string,
  status: "APPROVED" | "REJECTED"
): Promise<void> {
  return setCatalogStatus(bookId, status);
}

export async function adminDeleteCatalogBook(bookId: string): Promise<void> {
  // BookEditions cascade; user library Book rows keep their copied fields and
  // only lose the catalog link (FK is set null on delete).
  await db.delete(CatalogBook).where(eq(CatalogBook.id, bookId));
}

/**
 * Admin-created catalog book + edition. Approved by default (admins are trusted).
 * Author/genre are also promoted to APPROVED reference items.
 */
export async function adminCreateCatalogBook(
  input: ManualBookInput,
  adminId: string,
  externalLinks?: ExternalLinkInput[]
): Promise<{ id: string; slug: string }> {
  const genres = splitStoredGenres(input.genre);
  const catalogId = crypto.randomUUID();
  const slug = await generateUniqueCatalogBookSlug(input.title, catalogId);

  const id = await db.transaction(async (tx) => {
    const [book] = await tx
      .insert(CatalogBook)
      .values({
        id: catalogId,
        title: input.title,
        slug,
        originalTitle: input.originalTitle,
        description: input.description,
        coverImage: input.coverImage ?? null,
        author: input.author,
        genre: input.genre,
        country: input.country,
        language: input.language,
        status: "APPROVED",
        createdById: adminId,
      })
      .returning({ id: CatalogBook.id });

    await tx.insert(BookEdition).values({
      catalogBookId: book.id,
      translator: input.translator,
      publisher: input.publisher,
      isbn: input.isbn,
      format: input.format,
      coverImage: input.coverImage ?? null,
      publishedYear: input.publishedYear,
      editionLabel: input.editionLabel,
      pageCount: input.pageCount,
      language: input.language,
      status: "APPROVED",
      createdById: adminId,
    });

    // لینک‌های بیرونی به هویت کانونی (catalogBookId) وصل می‌شوند، نه ردیف کاربر.
    if (externalLinks && externalLinks.length > 0) {
      await upsertBookExternalLinks(book.id, externalLinks, tx);
    }

    return book.id;
  });

  // Promote reference values (best-effort, non-blocking).
  try {
    await Promise.all([
      adminCreateReference("AUTHOR", input.author),
      ...genres.map((genre) => adminCreateReference("GENRE", genre)),
      input.translator
        ? adminCreateReference("TRANSLATOR", input.translator)
        : Promise.resolve(),
      input.publisher
        ? adminCreateReference("PUBLISHER", input.publisher)
        : Promise.resolve(),
      input.country
        ? adminCreateReference("COUNTRY", input.country)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("admin reference promote failed:", err);
  }

  return { id, slug };
}

// ---------------- جست‌وجوی کاتالوگ برای ادمین (انتخابگر صفحه‌ی اصلی و ...) ----------------

/** بهترین جلدِ نسخه‌ی تأییدشده برای یک کتاب کانونی (همان منطق آرشیو عمومی). */
function bestEditionCoverSql() {
  return sql<string | null>`(
    select be.cover_image
    from "BookEdition" be
    where be.catalog_book_id = ${CatalogBook.id}
      and be.status = 'APPROVED'
    order by
      (be.cover_image is not null and trim(be.cover_image) <> '') desc,
      be.published_year desc nulls last,
      be.created_at desc
    limit 1
  )`;
}

/** جلدِ یکی از ردیف‌های کتابخانه‌ی همان کتاب کانونی (آخرین لایه‌ی fallback). */
function sampleBookCoverSql() {
  return sql<string | null>`(
    select b.cover_image
    from "Book" b
    where b.catalog_book_id = ${CatalogBook.id}
      and b.cover_image is not null and trim(b.cover_image) <> ''
    order by b.created_at desc
    limit 1
  )`;
}

export interface AdminCatalogSearchResult {
  id: string;
  slug: string | null;
  title: string;
  originalTitle: string | null;
  author: string;
  coverImage: string | null;
  publisher: string | null;
  translator: string | null;
}

/**
 * جست‌وجوی کتاب‌های کاتالوگ برای ابزارهای ادمین (انتخابگر صفحه‌ی اصلی، و...).
 * هویت = CatalogBook (کانونی)؛ پس کتاب‌های ساخته‌شده توسط ادمین، کتاب‌های
 * تأییدشده‌ی کاربران و کتاب‌های واردشده همه دیده می‌شوند. جلد با همان زنجیره‌ی
 * fallbackِ آرشیو عمومی محاسبه می‌شود تا جلد شکسته نمایش داده نشود.
 */
export async function searchAdminCatalogBooks(
  rawQuery: string,
  opts: {
    limit?: number;
    statuses?: Array<"PENDING" | "APPROVED" | "REJECTED">;
  } = {},
): Promise<AdminCatalogSearchResult[]> {
  const limit = Math.min(opts.limit ?? 12, 50);
  const statuses = opts.statuses ?? ["APPROVED"];
  const q = rawQuery.trim();

  const conds = [inArray(CatalogBook.status, statuses)];
  if (q) {
    const term = `%${q}%`;
    conds.push(
      sql`(
        ${CatalogBook.title} ilike ${term}
        or ${CatalogBook.originalTitle} ilike ${term}
        or ${CatalogBook.author} ilike ${term}
        or ${CatalogBook.slug} ilike ${term}
        or exists (
          select 1 from "BookEdition" be
          where be.catalog_book_id = ${CatalogBook.id}
            and (be.translator ilike ${term} or be.publisher ilike ${term})
        )
      )`,
    );
  }

  const rows = await db
    .select({
      id: CatalogBook.id,
      slug: CatalogBook.slug,
      title: CatalogBook.title,
      originalTitle: CatalogBook.originalTitle,
      author: CatalogBook.author,
      publisher: sql<string | null>`(
        select be.publisher from "BookEdition" be
        where be.catalog_book_id = ${CatalogBook.id} and be.publisher is not null
        order by be.created_at desc limit 1
      )`,
      translator: sql<string | null>`(
        select be.translator from "BookEdition" be
        where be.catalog_book_id = ${CatalogBook.id} and be.translator is not null
        order by be.created_at desc limit 1
      )`,
      coverImage: sql<string | null>`coalesce(
        ${bestEditionCoverSql()},
        ${CatalogBook.coverImage},
        ${sampleBookCoverSql()}
      )`,
    })
    .from(CatalogBook)
    .where(and(...conds))
    .orderBy(desc(CatalogBook.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    originalTitle: row.originalTitle,
    author: row.author,
    coverImage: coalesceCoverImage(row.coverImage),
    publisher: row.publisher,
    translator: row.translator,
  }));
}

// ---------------- ویرایش ادمینیِ کتاب کاتالوگ ----------------
export interface AdminBookEditData {
  id: string;
  slug: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  title: string;
  originalTitle: string | null;
  author: string;
  genres: string[];
  description: string | null;
  country: string | null;
  language: string | null;
  coverImage: string | null;
  // فیلدهای نسخه‌ی نماینده
  editionId: string | null;
  translator: string | null;
  publisher: string | null;
  isbn: string | null;
  format: "PHYSICAL" | "ELECTRONIC";
  pageCount: number | null;
  publishedYear: number | null;
  editionLabel: string | null;
  externalLinks: AdminExternalLink[];
}

/** شناسه‌ی بهترین نسخه‌ی یک کتاب کانونی (همان معیار نماینده)، یا null. */
async function findRepresentativeEditionId(
  catalogBookId: string,
): Promise<string | null> {
  const [edition] = await db
    .select({ id: BookEdition.id })
    .from(BookEdition)
    .where(eq(BookEdition.catalogBookId, catalogBookId))
    .orderBy(
      sql`(${BookEdition.status} = 'APPROVED') desc`,
      sql`(${BookEdition.coverImage} is not null and trim(${BookEdition.coverImage}) <> '') desc`,
      sql`${BookEdition.publishedYear} desc nulls last`,
      desc(BookEdition.createdAt),
    )
    .limit(1);
  return edition?.id ?? null;
}

/** داده‌ی کاملِ یک کتاب کاتالوگ برای فرم ویرایش ادمین. */
export async function getAdminCatalogBookForEdit(
  id: string,
): Promise<AdminBookEditData | null> {
  const [book] = await db
    .select({
      id: CatalogBook.id,
      slug: CatalogBook.slug,
      status: CatalogBook.status,
      title: CatalogBook.title,
      originalTitle: CatalogBook.originalTitle,
      author: CatalogBook.author,
      genre: CatalogBook.genre,
      description: CatalogBook.description,
      country: CatalogBook.country,
      language: CatalogBook.language,
      coverImage: CatalogBook.coverImage,
    })
    .from(CatalogBook)
    .where(eq(CatalogBook.id, id))
    .limit(1);

  if (!book) return null;

  const externalLinks = await listBookExternalLinks(id);
  const editionId = await findRepresentativeEditionId(id);
  const edition = editionId
    ? (
        await db
          .select({
            id: BookEdition.id,
            translator: BookEdition.translator,
            publisher: BookEdition.publisher,
            isbn: BookEdition.isbn,
            format: BookEdition.format,
            pageCount: BookEdition.pageCount,
            publishedYear: BookEdition.publishedYear,
            editionLabel: BookEdition.editionLabel,
            coverImage: BookEdition.coverImage,
          })
          .from(BookEdition)
          .where(eq(BookEdition.id, editionId))
          .limit(1)
      )[0]
    : undefined;

  return {
    id: book.id,
    slug: book.slug,
    status: book.status,
    title: book.title,
    originalTitle: book.originalTitle,
    author: book.author,
    genres: splitStoredGenres(book.genre),
    description: book.description,
    country: book.country,
    language: book.language,
    coverImage: coalesceCoverImage(book.coverImage, edition?.coverImage),
    editionId: edition?.id ?? null,
    translator: edition?.translator ?? null,
    publisher: edition?.publisher ?? null,
    isbn: edition?.isbn ?? null,
    format: (edition?.format as "PHYSICAL" | "ELECTRONIC") ?? "ELECTRONIC",
    pageCount: edition?.pageCount ?? null,
    publishedYear: edition?.publishedYear ?? null,
    editionLabel: edition?.editionLabel ?? null,
    externalLinks,
  };
}

/**
 * ویرایش ادمینیِ یک کتاب کاتالوگ:
 *  - فیلدهای کانونی روی CatalogBook به‌روزرسانی می‌شوند (به‌جز slug که فقط با
 *    درخواست صریحِ regenerateSlug عوض می‌شود تا لینک عمومی پایدار بماند).
 *  - فیلدهای نسخه‌ای روی نسخه‌ی نماینده اعمال می‌شوند (در نبود نسخه، یکی ساخته می‌شود).
 *  - جلد به‌صورت هماهنگ روی کاتالوگ و نسخه ذخیره/حذف می‌شود تا همه‌جا یکدست بماند.
 *  - ردیف‌های کتابخانه‌ی کاربران دست‌نخورده می‌مانند.
 */
export async function updateAdminCatalogBook(
  id: string,
  input: AdminBookUpdateInput,
  externalLinks?: ExternalLinkInput[],
): Promise<{ id: string; slug: string | null }> {
  const [existing] = await db
    .select({ id: CatalogBook.id, slug: CatalogBook.slug })
    .from(CatalogBook)
    .where(eq(CatalogBook.id, id))
    .limit(1);
  if (!existing) throw new Error("CATALOG_BOOK_NOT_FOUND");

  const clean = (v: string | null | undefined) => {
    if (v === undefined) return undefined;
    const t = (v ?? "").trim();
    return t ? t : null;
  };

  const coverProvided = input.coverImage !== undefined;
  const coverValue = coverProvided ? coalesceCoverImage(input.coverImage) : undefined;

  let nextSlug = existing.slug;
  if (input.regenerateSlug) {
    nextSlug = await generateUniqueCatalogBookSlug(input.title, id, id);
  }

  await db.transaction(async (tx) => {
    const catalogSet: Partial<typeof CatalogBook.$inferInsert> = {
      title: input.title.trim(),
      author: input.author.trim(),
      genre: input.genre.trim(),
      originalTitle: clean(input.originalTitle),
      description: clean(input.description),
      country: clean(input.country),
      language: clean(input.language),
      updatedAt: new Date(),
    };
    if (input.status) catalogSet.status = input.status;
    if (input.regenerateSlug && nextSlug) catalogSet.slug = nextSlug;
    if (coverProvided) catalogSet.coverImage = coverValue ?? null;

    await tx.update(CatalogBook).set(catalogSet).where(eq(CatalogBook.id, id));

    const editionSet: Partial<typeof BookEdition.$inferInsert> = {
      translator: clean(input.translator),
      publisher: clean(input.publisher),
      isbn: clean(input.isbn),
      editionLabel: clean(input.editionLabel),
      pageCount: input.pageCount ?? null,
      publishedYear: input.publishedYear ?? null,
      language: clean(input.language),
      updatedAt: new Date(),
    };
    if (input.format) editionSet.format = input.format;
    if (coverProvided) editionSet.coverImage = coverValue ?? null;

    const editionId = await findRepresentativeEditionId(id);
    if (editionId) {
      await tx
        .update(BookEdition)
        .set(editionSet)
        .where(eq(BookEdition.id, editionId));
    } else {
      await tx.insert(BookEdition).values({
        catalogBookId: id,
        format: input.format ?? "ELECTRONIC",
        status: "APPROVED",
        ...editionSet,
      });
    }

    // لینک‌های بیرونی فقط در صورت ارسالِ صریح جایگزین می‌شوند (replace-all).
    if (externalLinks !== undefined) {
      await upsertBookExternalLinks(id, externalLinks, tx);
    }
  });

  // ارتقای مقادیر مرجع به APPROVED (best-effort).
  try {
    const genres = splitStoredGenres(input.genre);
    await Promise.all([
      adminCreateReference("AUTHOR", input.author),
      ...genres.map((g) => adminCreateReference("GENRE", g)),
      input.translator
        ? adminCreateReference("TRANSLATOR", input.translator)
        : Promise.resolve(),
      input.publisher
        ? adminCreateReference("PUBLISHER", input.publisher)
        : Promise.resolve(),
      input.country
        ? adminCreateReference("COUNTRY", input.country)
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error("admin reference promote (update) failed:", err);
  }

  return { id, slug: nextSlug };
}

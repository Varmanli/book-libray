import { and, desc, eq, ilike, like, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { ReferenceItem } from "@/db/schema";
import { slugify } from "@/lib/book/slug";
import type {
  ReferenceTypeValue,
  UpdateReferenceInput,
} from "@/lib/validations/reference";

export class ReferenceError extends Error {
  constructor(message: string, public status = 400, public code?: string) {
    super(message);
    this.name = "ReferenceError";
  }
}

export interface ReferenceItemDTO {
  id: string;
  type: ReferenceTypeValue;
  name: string;
  slug: string | null;
  coverImage: string | null;
  bannerImage: string | null;
  description: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: Date;
}

export interface ReferenceSearchPage {
  items: ReferenceItemDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

/** اسلاگ یکتا در یک نوع؛ در صورت تداخل پسوند عددی اضافه می‌شود. */
async function uniqueReferenceSlug(
  type: ReferenceTypeValue,
  rawName: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(rawName) || "item";
  const rows = await db
    .select({ id: ReferenceItem.id, slug: ReferenceItem.slug })
    .from(ReferenceItem)
    .where(
      and(
        eq(ReferenceItem.type, type),
        or(eq(ReferenceItem.slug, base), like(ReferenceItem.slug, `${base}-%`))
      )
    );
  const taken = new Set(
    rows
      .filter((r) => r.id !== excludeId)
      .map((r) => r.slug)
      .filter((s): s is string => !!s)
  );
  if (!taken.has(base)) return base;
  for (let i = 2; i < 10000; i += 1) {
    const candidate = `${base}-${i}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

const REFERENCE_COLUMNS = {
  id: ReferenceItem.id,
  type: ReferenceItem.type,
  name: ReferenceItem.name,
  slug: ReferenceItem.slug,
  coverImage: ReferenceItem.coverImage,
  bannerImage: ReferenceItem.bannerImage,
  description: ReferenceItem.description,
  status: ReferenceItem.status,
  createdAt: ReferenceItem.createdAt,
};

/** جست‌وجوی مقادیر مرجع برای کمبوباکس (پیش‌فرض فقط تأییدشده‌ها). */
export async function searchReference(
  type: ReferenceTypeValue,
  q: string,
  { approvedOnly = true, limit = 20 } = {}
): Promise<ReferenceItemDTO[]> {
  const conds = [eq(ReferenceItem.type, type)];
  if (approvedOnly) conds.push(eq(ReferenceItem.status, "APPROVED"));
  if (q.trim()) conds.push(ilike(ReferenceItem.name, `%${q.trim()}%`));

  const rows = await db
    .select(REFERENCE_COLUMNS)
    .from(ReferenceItem)
    .where(and(...conds))
    .orderBy(ReferenceItem.name)
    .limit(limit);

  return rows as ReferenceItemDTO[];
}

export async function searchReferencePage(
  type: ReferenceTypeValue,
  q: string,
  {
    approvedOnly = true,
    page = 1,
    pageSize = 20,
  }: {
    approvedOnly?: boolean;
    page?: number;
    pageSize?: number;
  } = {}
): Promise<ReferenceSearchPage> {
  const safePageSize = Math.max(1, Math.min(100, Math.trunc(pageSize)));
  const safePage = Math.max(1, Math.trunc(page));
  const conds = [eq(ReferenceItem.type, type)];
  if (approvedOnly) conds.push(eq(ReferenceItem.status, "APPROVED"));
  if (q.trim()) conds.push(ilike(ReferenceItem.name, `%${q.trim()}%`));

  const [countRows, rows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(ReferenceItem)
      .where(and(...conds)),
    db
      .select(REFERENCE_COLUMNS)
      .from(ReferenceItem)
      .where(and(...conds))
      .orderBy(ReferenceItem.name)
      .limit(safePageSize)
      .offset((safePage - 1) * safePageSize),
  ]);

  const totalCount = countRows[0]?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / safePageSize));
  const normalizedPage = Math.min(safePage, pageCount);

  return {
    items: rows as ReferenceItemDTO[],
    totalCount,
    page: normalizedPage,
    pageSize: safePageSize,
    pageCount,
  };
}

/**
 * اطمینان از وجود یک مقدار مرجع: اگر هست برمی‌گرداند، وگرنه به‌صورت PENDING
 * (پیشنهاد کاربر) می‌سازد. برای جریان ساخت دستی کتاب استفاده می‌شود.
 */
export async function ensureReferenceItem(
  type: ReferenceTypeValue,
  name: string,
  userId: string
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const [existing] = await db
    .select({ id: ReferenceItem.id })
    .from(ReferenceItem)
    .where(
      and(
        eq(ReferenceItem.type, type),
        sql`lower(${ReferenceItem.name}) = lower(${trimmed})`
      )
    )
    .limit(1);

  if (existing) return;

  const slug = await uniqueReferenceSlug(type, trimmed);
  await db
    .insert(ReferenceItem)
    .values({ type, name: trimmed, slug, status: "PENDING", createdById: userId })
    .onConflictDoNothing();
}

// ---------------- مدیریت ادمین ----------------
export async function adminListReference(filters: {
  type?: ReferenceTypeValue;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  q?: string;
}): Promise<ReferenceItemDTO[]> {
  const conds = [];
  if (filters.type) conds.push(eq(ReferenceItem.type, filters.type));
  if (filters.status) conds.push(eq(ReferenceItem.status, filters.status));
  if (filters.q?.trim())
    conds.push(ilike(ReferenceItem.name, `%${filters.q.trim()}%`));

  const rows = await db
    .select(REFERENCE_COLUMNS)
    .from(ReferenceItem)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(ReferenceItem.createdAt))
    .limit(500);

  return rows as ReferenceItemDTO[];
}

export async function adminCreateReference(
  type: ReferenceTypeValue,
  name: string
): Promise<ReferenceItemDTO> {
  const trimmed = name.trim();

  const [existing] = await db
    .select()
    .from(ReferenceItem)
    .where(
      and(
        eq(ReferenceItem.type, type),
        sql`lower(${ReferenceItem.name}) = lower(${trimmed})`
      )
    )
    .limit(1);

  if (existing) {
    // اگر از قبل بود: تأیید + اطمینان از وجود اسلاگ
    const patch: Partial<typeof ReferenceItem.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (existing.status !== "APPROVED") patch.status = "APPROVED";
    if (!existing.slug) patch.slug = await uniqueReferenceSlug(type, trimmed, existing.id);
    const [updated] = await db
      .update(ReferenceItem)
      .set(patch)
      .where(eq(ReferenceItem.id, existing.id))
      .returning(REFERENCE_COLUMNS);
    return updated as ReferenceItemDTO;
  }

  const slug = await uniqueReferenceSlug(type, trimmed);
  const [created] = await db
    .insert(ReferenceItem)
    .values({ type, name: trimmed, slug, status: "APPROVED" })
    .returning(REFERENCE_COLUMNS);
  return created as ReferenceItemDTO;
}

export async function adminUpdateReference(
  id: string,
  input: UpdateReferenceInput
): Promise<void> {
  const [current] = await db
    .select({ type: ReferenceItem.type, slug: ReferenceItem.slug })
    .from(ReferenceItem)
    .where(eq(ReferenceItem.id, id))
    .limit(1);
  if (!current) throw new ReferenceError("مورد یافت نشد", 404);

  const set: Partial<typeof ReferenceItem.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (input.name !== undefined) set.name = input.name.trim();
  if (input.coverImage !== undefined) set.coverImage = input.coverImage || null;
  if (input.bannerImage !== undefined) set.bannerImage = input.bannerImage || null;
  if (input.description !== undefined) set.description = input.description || null;
  if (input.status !== undefined) set.status = input.status;

  // اسلاگ: اگر ادمین صریح داده، یکتاسازی می‌کنیم؛ اگر نام عوض شده و اسلاگ خالی
  // بوده، از روی نام می‌سازیم. اسلاگ موجود را خودسرانه عوض نمی‌کنیم تا لینک نشکند.
  if (input.slug !== undefined && input.slug.trim()) {
    set.slug = await uniqueReferenceSlug(current.type, input.slug, id);
  } else if (!current.slug && (input.name || set.name)) {
    set.slug = await uniqueReferenceSlug(
      current.type,
      (set.name as string) ?? "",
      id
    );
  }

  await db.update(ReferenceItem).set(set).where(eq(ReferenceItem.id, id));
}

export async function adminDeleteReference(id: string): Promise<void> {
  await db.delete(ReferenceItem).where(eq(ReferenceItem.id, id));
}

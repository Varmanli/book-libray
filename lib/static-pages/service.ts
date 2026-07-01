import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { StaticPage } from "@/db/schema";
import { sanitizeRichTextHtml } from "@/lib/content/rich-text";
import {
  CORE_STATIC_PAGE_SLUGS,
  DEFAULT_STATIC_PAGES,
  isCoreStaticPageSlug,
} from "@/lib/static-pages/defaults";
import type { StaticPageUpdateInput } from "@/lib/validations/static-pages";

export interface AdminStaticPageRow {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  status: "DRAFT" | "PUBLISHED";
  updatedAt: Date;
  createdAt: Date;
}

export interface AdminStaticPageDetail extends AdminStaticPageRow {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface PublicStaticPage {
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
}

/**
 * صفحه‌های هسته‌ای را در صورت نبود می‌سازد (idempotent). محتوای موجود را
 * بازنویسی نمی‌کند تا ویرایش‌های ادمین حفظ شوند. روی قید یکتاییِ اسلاگ تکیه
 * می‌کند تا در شرایط همزمانی هم رکورد تکراری ساخته نشود.
 */
export async function ensureDefaultStaticPages(): Promise<void> {
  const existing = await db
    .select({ slug: StaticPage.slug })
    .from(StaticPage);
  const have = new Set(existing.map((row) => row.slug));

  const missing = DEFAULT_STATIC_PAGES.filter((page) => !have.has(page.slug));
  if (missing.length === 0) return;

  await db
    .insert(StaticPage)
    .values(
      missing.map((page) => ({
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle,
        content: sanitizeRichTextHtml(page.content),
        status: "PUBLISHED" as const,
      })),
    )
    .onConflictDoNothing({ target: StaticPage.slug });
}

/** صفحه‌ی عمومی بر اساس اسلاگ؛ فقط اگر منتشرشده باشد. */
export async function getStaticPageBySlug(
  slug: string,
): Promise<PublicStaticPage | null> {
  const [page] = await db
    .select({
      slug: StaticPage.slug,
      title: StaticPage.title,
      subtitle: StaticPage.subtitle,
      content: StaticPage.content,
      seoTitle: StaticPage.seoTitle,
      seoDescription: StaticPage.seoDescription,
      status: StaticPage.status,
      updatedAt: StaticPage.updatedAt,
    })
    .from(StaticPage)
    .where(eq(StaticPage.slug, slug))
    .limit(1);

  if (!page || page.status !== "PUBLISHED") return null;

  const { status: _status, ...rest } = page;
  return rest;
}

/** فهرست همه‌ی صفحات برای پنل ادمین؛ به ترتیب اسلاگ‌های هسته‌ای. */
export async function getAdminStaticPages(): Promise<AdminStaticPageRow[]> {
  await ensureDefaultStaticPages();

  const rows = await db
    .select({
      id: StaticPage.id,
      slug: StaticPage.slug,
      title: StaticPage.title,
      subtitle: StaticPage.subtitle,
      status: StaticPage.status,
      updatedAt: StaticPage.updatedAt,
      createdAt: StaticPage.createdAt,
    })
    .from(StaticPage)
    .orderBy(asc(StaticPage.slug));

  // اسلاگ‌های هسته‌ای را به ترتیب تعریف‌شده مرتب می‌کند؛ بقیه در انتها.
  const order = new Map(
    CORE_STATIC_PAGE_SLUGS.map((slug, index) => [slug, index] as const),
  );
  return rows.sort((a, b) => {
    const ai = order.get(a.slug as never) ?? Number.MAX_SAFE_INTEGER;
    const bi = order.get(b.slug as never) ?? Number.MAX_SAFE_INTEGER;
    return ai - bi || a.slug.localeCompare(b.slug);
  });
}

/** جزئیات کامل یک صفحه برای فرم ویرایش ادمین. */
export async function getAdminStaticPageBySlug(
  slug: string,
): Promise<AdminStaticPageDetail | null> {
  const [page] = await db
    .select({
      id: StaticPage.id,
      slug: StaticPage.slug,
      title: StaticPage.title,
      subtitle: StaticPage.subtitle,
      content: StaticPage.content,
      seoTitle: StaticPage.seoTitle,
      seoDescription: StaticPage.seoDescription,
      status: StaticPage.status,
      updatedAt: StaticPage.updatedAt,
      createdAt: StaticPage.createdAt,
    })
    .from(StaticPage)
    .where(eq(StaticPage.slug, slug))
    .limit(1);

  return page ?? null;
}

/**
 * به‌روزرسانی محتوای یک صفحه بر اساس اسلاگ. اسلاگ هرگز تغییر نمی‌کند و محتوای
 * HTML پیش از ذخیره پاک‌سازی می‌شود. اگر صفحه وجود نداشته باشد null برمی‌گرداند.
 */
export async function updateStaticPage(
  slug: string,
  input: StaticPageUpdateInput,
): Promise<AdminStaticPageDetail | null> {
  const [updated] = await db
    .update(StaticPage)
    .set({
      title: input.title.trim(),
      subtitle: input.subtitle?.trim() || null,
      content: sanitizeRichTextHtml(input.content),
      seoTitle: input.seoTitle?.trim() || null,
      seoDescription: input.seoDescription?.trim() || null,
      status: input.status,
      updatedAt: new Date(),
    })
    .where(eq(StaticPage.slug, slug))
    .returning({
      id: StaticPage.id,
      slug: StaticPage.slug,
      title: StaticPage.title,
      subtitle: StaticPage.subtitle,
      content: StaticPage.content,
      seoTitle: StaticPage.seoTitle,
      seoDescription: StaticPage.seoDescription,
      status: StaticPage.status,
      updatedAt: StaticPage.updatedAt,
      createdAt: StaticPage.createdAt,
    });

  return updated ?? null;
}

export { isCoreStaticPageSlug };

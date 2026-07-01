import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { BlogCategory, BlogPost, User } from "@/db/schema";
import { slugify } from "@/lib/book/slug";
import { sanitizeRichTextHtml } from "@/lib/content/rich-text";
import type {
  BlogCategoryInput,
  BlogPostInput,
} from "@/lib/validations/blog";

export const BLOG_PAGE_SIZE = 9;
export const ADMIN_BLOG_PAGE_SIZE = 12;

export interface AdminBlogPostRow {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  bannerImage: string;
  status: "DRAFT" | "PUBLISHED";
  authorName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  publishedAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
  readingTime: number | null;
}

export interface AdminBlogPostDetail extends AdminBlogPostRow {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface PublicBlogPostPreview {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  bannerImage: string;
  publishedAt: Date;
  readingTime: number | null;
  authorName: string | null;
  categoryName: string | null;
  categorySlug: string | null;
}

export interface PublicBlogPost extends PublicBlogPostPreview {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
}

export interface AdminBlogCategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BlogCategoryOption {
  id: string;
  name: string;
  slug: string;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateReadingTime(html: string) {
  const plain = stripHtml(html);
  if (!plain) return 1;
  const words = plain.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function generateUniqueBlogSlug(title: string, excludeId?: string) {
  const base = slugify(title) || "blog-post";
  const rows = await db
    .select({ slug: BlogPost.slug, id: BlogPost.id })
    .from(BlogPost)
    .where(sql`${BlogPost.slug} = ${base} or ${BlogPost.slug} like ${`${base}-%`}`);

  const taken = new Set(
    rows
      .filter((row) => row.id !== excludeId)
      .map((row) => row.slug)
      .filter(Boolean),
  );

  if (!taken.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

async function generateUniqueCategorySlug(name: string, excludeId?: string) {
  const base = slugify(name) || "category";
  const rows = await db
    .select({ slug: BlogCategory.slug, id: BlogCategory.id })
    .from(BlogCategory)
    .where(
      sql`${BlogCategory.slug} = ${base} or ${BlogCategory.slug} like ${`${base}-%`}`,
    );

  const taken = new Set(
    rows
      .filter((row) => row.id !== excludeId)
      .map((row) => row.slug)
      .filter(Boolean),
  );

  if (!taken.has(base)) return base;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base}-${index}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

/** آیا دسته‌بندیِ بلاگ با این شناسه وجود دارد؟ (برای اعتبارسنجی ورودی فرم نوشته). */
export async function blogCategoryExists(id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: BlogCategory.id })
    .from(BlogCategory)
    .where(eq(BlogCategory.id, id))
    .limit(1);
  return !!row;
}

function normalizeInput(input: BlogPostInput) {
  const sanitizedContent = sanitizeRichTextHtml(input.content);
  const publishedAt =
    input.status === "PUBLISHED"
      ? input.publishedAt
        ? new Date(input.publishedAt)
        : new Date()
      : null;

  return {
    title: input.title.trim(),
    categoryId: input.categoryId,
    excerpt: input.excerpt.trim(),
    content: sanitizedContent,
    bannerImage: input.bannerImage.trim(),
    status: input.status,
    publishedAt,
    readingTime: estimateReadingTime(sanitizedContent),
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
  };
}

export async function listAdminBlogPosts({
  q,
  status,
  limit = ADMIN_BLOG_PAGE_SIZE,
  offset = 0,
}: {
  q?: string;
  status?: "DRAFT" | "PUBLISHED";
  limit?: number;
  offset?: number;
}): Promise<{ posts: AdminBlogPostRow[]; total: number }> {
  const conditions = [];
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(BlogPost.title, term),
        ilike(BlogPost.excerpt, term),
        ilike(BlogPost.slug, term),
      ),
    );
  }
  if (status) conditions.push(eq(BlogPost.status, status));
  const where = conditions.length ? and(...conditions) : undefined;

  const [posts, totalRows] = await Promise.all([
    db
      .select({
        id: BlogPost.id,
        title: BlogPost.title,
        slug: BlogPost.slug,
        excerpt: BlogPost.excerpt,
        bannerImage: BlogPost.bannerImage,
        status: BlogPost.status,
        authorName: User.name,
        categoryId: BlogPost.categoryId,
        categoryName: BlogCategory.name,
        publishedAt: BlogPost.publishedAt,
        updatedAt: BlogPost.updatedAt,
        createdAt: BlogPost.createdAt,
        readingTime: BlogPost.readingTime,
      })
      .from(BlogPost)
      .leftJoin(User, eq(BlogPost.createdById, User.id))
      .leftJoin(BlogCategory, eq(BlogPost.categoryId, BlogCategory.id))
      .where(where)
      .orderBy(desc(BlogPost.updatedAt))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(BlogPost).where(where),
  ]);

  return { posts, total: totalRows[0]?.total ?? 0 };
}

export async function getAdminBlogPostById(id: string): Promise<AdminBlogPostDetail | null> {
  const [post] = await db
    .select({
      id: BlogPost.id,
      title: BlogPost.title,
      slug: BlogPost.slug,
      excerpt: BlogPost.excerpt,
      content: BlogPost.content,
      bannerImage: BlogPost.bannerImage,
      status: BlogPost.status,
      authorName: User.name,
      categoryId: BlogPost.categoryId,
      categoryName: BlogCategory.name,
      publishedAt: BlogPost.publishedAt,
      updatedAt: BlogPost.updatedAt,
      createdAt: BlogPost.createdAt,
      readingTime: BlogPost.readingTime,
      seoTitle: BlogPost.seoTitle,
      seoDescription: BlogPost.seoDescription,
    })
    .from(BlogPost)
    .leftJoin(User, eq(BlogPost.createdById, User.id))
    .leftJoin(BlogCategory, eq(BlogPost.categoryId, BlogCategory.id))
    .where(eq(BlogPost.id, id))
    .limit(1);

  return post ?? null;
}

export async function createBlogPost(input: BlogPostInput, adminId: string) {
  const normalized = normalizeInput(input);
  const categoryOk = await blogCategoryExists(normalized.categoryId);
  if (!categoryOk) {
    throw new Error("BLOG_CATEGORY_NOT_FOUND");
  }
  // اسلاگ به‌صورت خودکار از عنوان ساخته می‌شود (یکتا).
  const slug = await generateUniqueBlogSlug(normalized.title);

  const [created] = await db
    .insert(BlogPost)
    .values({
      title: normalized.title,
      slug,
      categoryId: normalized.categoryId,
      excerpt: normalized.excerpt,
      content: normalized.content,
      bannerImage: normalized.bannerImage,
      status: normalized.status,
      createdById: adminId,
      publishedAt: normalized.publishedAt,
      readingTime: normalized.readingTime,
      seoTitle: normalized.seoTitle,
      seoDescription: normalized.seoDescription,
    })
    .returning({ id: BlogPost.id, slug: BlogPost.slug });

  return created;
}

export async function updateBlogPost(id: string, input: BlogPostInput) {
  const normalized = normalizeInput(input);
  const categoryOk = await blogCategoryExists(normalized.categoryId);
  if (!categoryOk) {
    throw new Error("BLOG_CATEGORY_NOT_FOUND");
  }

  // اسلاگ پس از ساخت پایدار می‌ماند؛ در ویرایش تغییر نمی‌کند تا URL عمومی نشکند.
  const [updated] = await db
    .update(BlogPost)
    .set({
      title: normalized.title,
      categoryId: normalized.categoryId,
      excerpt: normalized.excerpt,
      content: normalized.content,
      bannerImage: normalized.bannerImage,
      status: normalized.status,
      publishedAt: normalized.publishedAt,
      readingTime: normalized.readingTime,
      seoTitle: normalized.seoTitle,
      seoDescription: normalized.seoDescription,
      updatedAt: new Date(),
    })
    .where(eq(BlogPost.id, id))
    .returning({ id: BlogPost.id, slug: BlogPost.slug });

  return updated;
}

export async function deleteBlogPost(id: string) {
  await db.delete(BlogPost).where(eq(BlogPost.id, id));
}

export async function listPublicBlogPosts({
  q,
  categorySlug,
  page,
  pageSize = BLOG_PAGE_SIZE,
}: {
  q?: string;
  categorySlug?: string;
  page: number;
  pageSize?: number;
}): Promise<{
  posts: PublicBlogPostPreview[];
  total: number;
  page: number;
  pageCount: number;
}> {
  const conditions = [eq(BlogPost.status, "PUBLISHED")];
  if (q?.trim()) {
    const term = `%${q.trim()}%`;
    conditions.push(
      or(
        ilike(BlogPost.title, term),
        ilike(BlogPost.excerpt, term),
        ilike(BlogPost.content, term),
      )!,
    );
  }
  if (categorySlug?.trim()) {
    conditions.push(eq(BlogCategory.slug, categorySlug.trim()));
  }

  const where = and(...conditions);
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * pageSize;

  const [posts, totalRows] = await Promise.all([
    db
      .select({
        id: BlogPost.id,
        slug: BlogPost.slug,
        title: BlogPost.title,
        excerpt: BlogPost.excerpt,
        bannerImage: BlogPost.bannerImage,
        publishedAt: BlogPost.publishedAt,
        readingTime: BlogPost.readingTime,
        authorName: User.name,
        categoryName: BlogCategory.name,
        categorySlug: BlogCategory.slug,
      })
      .from(BlogPost)
      .leftJoin(User, eq(BlogPost.createdById, User.id))
      .leftJoin(BlogCategory, eq(BlogPost.categoryId, BlogCategory.id))
      .where(where)
      .orderBy(desc(BlogPost.publishedAt), desc(BlogPost.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ total: count() })
      .from(BlogPost)
      .leftJoin(BlogCategory, eq(BlogPost.categoryId, BlogCategory.id))
      .where(where),
  ]);

  const total = totalRows[0]?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const clampedPage = Math.min(safePage, pageCount);

  return {
    posts: posts.filter((post): post is PublicBlogPostPreview => Boolean(post.publishedAt)),
    total,
    page: clampedPage,
    pageCount,
  };
}

export async function getLatestPublishedBlogPosts(
  limit = 3,
): Promise<PublicBlogPostPreview[]> {
  const posts = await db
    .select({
      id: BlogPost.id,
      slug: BlogPost.slug,
      title: BlogPost.title,
      excerpt: BlogPost.excerpt,
      bannerImage: BlogPost.bannerImage,
      publishedAt: BlogPost.publishedAt,
      readingTime: BlogPost.readingTime,
      authorName: User.name,
      categoryName: BlogCategory.name,
      categorySlug: BlogCategory.slug,
    })
    .from(BlogPost)
    .leftJoin(User, eq(BlogPost.createdById, User.id))
    .leftJoin(BlogCategory, eq(BlogPost.categoryId, BlogCategory.id))
    .where(and(eq(BlogPost.status, "PUBLISHED"), sql`${BlogPost.publishedAt} is not null`))
    .orderBy(desc(BlogPost.publishedAt), desc(BlogPost.createdAt))
    .limit(limit);

  return posts.filter((post): post is PublicBlogPostPreview => Boolean(post.publishedAt));
}

export async function getPublicBlogPostBySlug(slug: string): Promise<PublicBlogPost | null> {
  const [post] = await db
    .select({
      id: BlogPost.id,
      slug: BlogPost.slug,
      title: BlogPost.title,
      excerpt: BlogPost.excerpt,
      content: BlogPost.content,
      bannerImage: BlogPost.bannerImage,
      publishedAt: BlogPost.publishedAt,
      readingTime: BlogPost.readingTime,
      authorName: User.name,
      categoryName: BlogCategory.name,
      categorySlug: BlogCategory.slug,
      seoTitle: BlogPost.seoTitle,
      seoDescription: BlogPost.seoDescription,
    })
    .from(BlogPost)
    .leftJoin(User, eq(BlogPost.createdById, User.id))
    .leftJoin(BlogCategory, eq(BlogPost.categoryId, BlogCategory.id))
    .where(and(eq(BlogPost.slug, slug), eq(BlogPost.status, "PUBLISHED")))
    .limit(1);

  if (!post || !post.publishedAt) return null;

  return {
    ...post,
    publishedAt: post.publishedAt,
  };
}

// ---------------- دسته‌بندی‌های بلاگ ----------------
export async function listBlogCategories(): Promise<AdminBlogCategoryRow[]> {
  return db
    .select({
      id: BlogCategory.id,
      name: BlogCategory.name,
      slug: BlogCategory.slug,
      description: BlogCategory.description,
      postCount: count(BlogPost.id),
      createdAt: BlogCategory.createdAt,
      updatedAt: BlogCategory.updatedAt,
    })
    .from(BlogCategory)
    .leftJoin(BlogPost, eq(BlogPost.categoryId, BlogCategory.id))
    .groupBy(BlogCategory.id)
    .orderBy(asc(BlogCategory.name));
}

/** فهرست سبک دسته‌بندی‌ها برای انتخاب در فرم نوشته و فیلتر آرشیو عمومی. */
export async function listBlogCategoryOptions(): Promise<BlogCategoryOption[]> {
  return db
    .select({
      id: BlogCategory.id,
      name: BlogCategory.name,
      slug: BlogCategory.slug,
    })
    .from(BlogCategory)
    .orderBy(asc(BlogCategory.name));
}

export async function getBlogCategoryById(
  id: string,
): Promise<AdminBlogCategoryRow | null> {
  const [row] = await db
    .select({
      id: BlogCategory.id,
      name: BlogCategory.name,
      slug: BlogCategory.slug,
      description: BlogCategory.description,
      postCount: count(BlogPost.id),
      createdAt: BlogCategory.createdAt,
      updatedAt: BlogCategory.updatedAt,
    })
    .from(BlogCategory)
    .leftJoin(BlogPost, eq(BlogPost.categoryId, BlogCategory.id))
    .where(eq(BlogCategory.id, id))
    .groupBy(BlogCategory.id)
    .limit(1);
  return row ?? null;
}

export async function getPublicBlogCategoryBySlug(
  slug: string,
): Promise<BlogCategoryOption | null> {
  const [row] = await db
    .select({
      id: BlogCategory.id,
      name: BlogCategory.name,
      slug: BlogCategory.slug,
    })
    .from(BlogCategory)
    .where(eq(BlogCategory.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function createBlogCategory(input: BlogCategoryInput) {
  const slug = await generateUniqueCategorySlug(input.name);
  const [created] = await db
    .insert(BlogCategory)
    .values({
      name: input.name.trim(),
      slug,
      description: input.description?.trim() || null,
    })
    .returning({ id: BlogCategory.id, slug: BlogCategory.slug });
  return created;
}

export async function updateBlogCategory(id: string, input: BlogCategoryInput) {
  // اسلاگ دسته‌بندی پس از ساخت پایدار می‌ماند.
  await db
    .update(BlogCategory)
    .set({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(BlogCategory.id, id));
}

/** حذف امن: اگر نوشته‌ای به این دسته متصل باشد، حذف مسدود می‌شود. */
export async function deleteBlogCategory(
  id: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const [{ total }] = await db
    .select({ total: count() })
    .from(BlogPost)
    .where(eq(BlogPost.categoryId, id));

  if (total > 0) {
    return {
      ok: false,
      reason: `این دسته‌بندی به ${total.toLocaleString("fa-IR")} نوشته متصل است. ابتدا نوشته‌ها را به دسته‌ی دیگری منتقل کن.`,
    };
  }

  await db.delete(BlogCategory).where(eq(BlogCategory.id, id));
  return { ok: true };
}

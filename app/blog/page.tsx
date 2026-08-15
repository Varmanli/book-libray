import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";

import BlogCard from "@/components/blog/BlogCard";
import PublicShell from "@/components/PublicShell";

import {
  BLOG_PAGE_SIZE,
  getPublicBlogCategoryBySlug,
  listBlogCategoryOptions,
  listPublicBlogPosts,
} from "@/lib/blog/service";

import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "مجله قفسه",
    description:
      "نوشته‌ها، یادداشت‌ها و مقاله‌های قفسه درباره خواندن و کشف کتاب.",
    path: "/blog",
    type: "website",
  });
}

export default async function BlogArchivePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;

  const q =
    typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";

  const category =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "";

  const page = Math.max(
    1,
    Number(
      typeof resolvedSearchParams.page === "string"
        ? resolvedSearchParams.page
        : "1",
    ) || 1,
  );

  const [archive, categories, activeCategory] = await Promise.all([
    listPublicBlogPosts({
      q,
      categorySlug: category,
      page,
      pageSize: BLOG_PAGE_SIZE,
    }),

    listBlogCategoryOptions(),

    category ? getPublicBlogCategoryBySlug(category) : Promise.resolve(null),
  ]);

  const isFiltering = Boolean(q || category);

  return (
    <PublicShell>
      <main
        dir="rtl"
        className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 sm:pt-9"
      >
        {/* PAGE HEADER */}
        <header className="border-b border-border/60 pb-6 sm:pb-8">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-extrabold text-primary">
              مجله قفسه
            </p>

            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
              برای بهتر خواندن
            </h1>

            <p className="mt-2 text-sm leading-7 text-muted-foreground sm:text-[15px]">
              یادداشت‌ها، راهنماها و پیشنهادهایی درباره کتاب و خواندن.
            </p>
          </div>
        </header>

        {/* DISCOVERY TOOLBAR */}
        <section className="mt-6">
          <form method="get">
            <div className="flex items-center gap-2">
              <div className="group relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />

                <input
                  type="search"
                  name="q"
                  dir="rtl"
                  defaultValue={q}
                  placeholder="جستجو در مجله..."
                  className="h-12 w-full rounded-2xl border border-border/70 bg-card pr-11 pl-11 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/35 focus:ring-[3px] focus:ring-primary/10"
                />

                {q ? (
                  <Link
                    href={buildArchiveHref("", 1, category)}
                    aria-label="پاک کردن جستجو"
                    className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Link>
                ) : null}

                {category ? (
                  <input type="hidden" name="category" value={category} />
                ) : null}
              </div>

              <button
                type="submit"
                className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground transition hover:bg-primary/90"
              >
                جستجو
              </button>
            </div>
          </form>

          {/* CATEGORIES */}
          {categories.length > 0 ? (
            <div className="-mx-4 mt-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              <nav
                aria-label="دسته‌بندی‌های مجله"
                className="flex w-max min-w-full items-center gap-2 sm:flex-wrap"
              >
                <CategoryPill
                  href={buildArchiveHref(q, 1, "")}
                  active={!category}
                  label="همه"
                />

                {categories.map((item) => (
                  <CategoryPill
                    key={item.id}
                    href={buildArchiveHref(q, 1, item.slug)}
                    active={category === item.slug}
                    label={item.name}
                  />
                ))}
              </nav>
            </div>
          ) : null}
        </section>

        {/* CONTENT */}
        <section className="mt-9 sm:mt-11">
          <div className="mb-5 flex min-w-0 items-end justify-between gap-4">
            <div className="min-w-0">
              <h2 className="truncate text-xl font-black tracking-tight text-foreground sm:text-2xl">
                {q
                  ? `نتایج برای «${q}»`
                  : activeCategory
                    ? activeCategory.name
                    : "تازه‌های مجله"}
              </h2>

              {isFiltering ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {archive.posts.length.toLocaleString("fa-IR")} نوشته در این
                  صفحه
                </p>
              ) : null}
            </div>

            {isFiltering ? (
              <Link
                href="/blog"
                className="shrink-0 text-xs font-bold text-muted-foreground transition hover:text-primary sm:text-sm"
              >
                پاک کردن فیلترها
              </Link>
            ) : null}
          </div>

          {archive.posts.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid gap-x-5 gap-y-8 md:grid-cols-2 xl:grid-cols-3">
                {archive.posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>

              {archive.pageCount > 1 ? (
                <Pagination
                  currentPage={archive.page}
                  pageCount={archive.pageCount}
                  previousHref={buildArchiveHref(q, archive.page - 1, category)}
                  nextHref={buildArchiveHref(q, archive.page + 1, category)}
                />
              ) : null}
            </>
          )}
        </section>
      </main>
    </PublicShell>
  );
}

function CategoryPill({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        active
          ? "inline-flex h-9 shrink-0 items-center rounded-full bg-foreground px-4 text-xs font-black text-background"
          : "inline-flex h-9 shrink-0 items-center rounded-full border border-border/70 bg-card px-4 text-xs font-bold text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
      }
    >
      {label}
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center border-y border-border/60 px-5 text-center">
      <Search className="h-6 w-6 text-muted-foreground/60" />

      <h2 className="mt-4 text-base font-black text-foreground">
        نوشته‌ای پیدا نشد
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
        عبارت دیگری را جستجو کن یا دسته‌بندی دیگری را انتخاب کن.
      </p>

      <Link
        href="/blog"
        className="mt-5 text-sm font-black text-primary hover:underline"
      >
        مشاهده همه نوشته‌ها
      </Link>
    </div>
  );
}

function Pagination({
  currentPage,
  pageCount,
  previousHref,
  nextHref,
}: {
  currentPage: number;
  pageCount: number;
  previousHref: string;
  nextHref: string;
}) {
  return (
    <nav
      aria-label="صفحه‌بندی مجله"
      className="mt-12 flex items-center justify-between border-t border-border/60 pt-5"
    >
      {currentPage > 1 ? (
        <Link
          href={previousHref}
          className="group inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-foreground transition hover:text-primary"
        >
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          قبلی
        </Link>
      ) : (
        <span className="w-16" />
      )}

      <span className="text-xs font-bold text-muted-foreground">
        {currentPage.toLocaleString("fa-IR")}
        <span className="mx-1.5 text-border">/</span>
        {pageCount.toLocaleString("fa-IR")}
      </span>

      {currentPage < pageCount ? (
        <Link
          href={nextHref}
          className="group inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-bold text-foreground transition hover:text-primary"
        >
          بعدی
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        </Link>
      ) : (
        <span className="w-16" />
      )}
    </nav>
  );
}

function buildArchiveHref(q: string, page: number, category: string) {
  const params = new URLSearchParams();

  if (q.trim()) {
    params.set("q", q.trim());
  }

  if (category.trim()) {
    params.set("category", category.trim());
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();

  return query ? `/blog?${query}` : "/blog";
}

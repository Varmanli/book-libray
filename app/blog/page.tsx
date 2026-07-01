import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

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
    title: "بلاگ",
    description: "نوشته‌ها، یادداشت‌ها و مقاله‌های قفسه درباره خواندن و کشف کتاب.",
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
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const category =
    typeof resolvedSearchParams.category === "string"
      ? resolvedSearchParams.category
      : "";
  const page = Math.max(
    1,
    Number(typeof resolvedSearchParams.page === "string" ? resolvedSearchParams.page : "1") || 1,
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

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 shadow-[0_28px_100px_-72px_rgba(0,0,0,0.75)] backdrop-blur-md">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(103,146,124,0.18),transparent_34%),radial-gradient(circle_at_80%_30%,rgba(103,146,124,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_28%)]"
          />
          <div className="relative px-5 py-6 sm:px-7 sm:py-8">
            <span className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              بلاگ قفسه
            </span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-[2.2rem]">
              نوشته‌هایی درباره خواندن و کشف کتاب
            </h1>
            {activeCategory ? (
              <p className="mt-3 text-sm text-muted-foreground">
                فیلتر فعال: {activeCategory.name}
              </p>
            ) : null}
          </div>
        </section>

        <form className="mt-6">
          <div className="relative">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="جست‌وجو در نوشته‌ها..."
              className="h-14 w-full rounded-[1.8rem] border border-border/70 bg-card/70 pr-12 pl-4 text-sm text-foreground shadow-[0_24px_80px_-60px_rgba(0,0,0,0.7)] outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15 sm:text-base"
            />
            {category ? <input type="hidden" name="category" value={category} /> : null}
          </div>
        </form>

        {categories.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
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
          </div>
        ) : null}

        <div className="mt-8">
          {archive.posts.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/50 px-6 py-14 text-center">
              <h2 className="text-xl font-black text-foreground">نوشته‌ای پیدا نشد</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                جست‌وجوی دیگری را امتحان کن یا بعداً دوباره سر بزن.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {archive.posts.map((post) => (
                  <BlogCard key={post.id} post={post} />
                ))}
              </div>

              {archive.pageCount > 1 ? (
                <div className="mt-8 flex items-center justify-between gap-3 rounded-[1.6rem] border border-border/75 bg-card/70 px-4 py-3">
                  <PaginationLink
                    disabled={archive.page <= 1}
                    href={buildArchiveHref(q, archive.page - 1, category)}
                    label="صفحه قبل"
                  />
                  <p className="text-sm text-muted-foreground">
                    صفحه {archive.page.toLocaleString("fa-IR")} از{" "}
                    {archive.pageCount.toLocaleString("fa-IR")}
                  </p>
                  <PaginationLink
                    disabled={archive.page >= archive.pageCount}
                    href={buildArchiveHref(q, archive.page + 1, category)}
                    label="صفحه بعد"
                  />
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </PublicShell>
  );
}

function buildArchiveHref(q: string, page: number, category: string) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (category.trim()) params.set("category", category.trim());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
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
          ? "inline-flex rounded-full border border-primary/20 bg-primary/12 px-3 py-1.5 text-xs font-bold text-primary"
          : "inline-flex rounded-full border border-border/70 bg-card/55 px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary/20 hover:text-primary"
      }
    >
      {label}
    </Link>
  );
}

function PaginationLink({
  href,
  label,
  disabled,
}: {
  href: string;
  label: string;
  disabled: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex h-10 items-center rounded-2xl border border-border/70 px-4 text-sm text-muted-foreground opacity-50">
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center rounded-2xl border border-border/70 px-4 text-sm text-foreground transition hover:border-primary/25 hover:text-primary"
    >
      {label}
    </Link>
  );
}

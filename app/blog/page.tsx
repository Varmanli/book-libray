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

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <section className="group relative isolate overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 shadow-[0_32px_110px_-70px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* Background atmosphere */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_20%,rgba(103,146,124,0.22),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(103,146,124,0.14),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.045),transparent_38%)]"
          />

          {/* Subtle grid pattern */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.14]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
              maskImage:
                "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent 82%)",
            }}
          />

          {/* Decorative glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-20 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-primary/[0.07] blur-3xl"
          />

          {/* Top highlight */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          />

          <div className="relative flex min-h-[250px] flex-col justify-center px-5 py-8 sm:min-h-[280px] sm:px-8 sm:py-10 lg:px-12 lg:py-12">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[11px] font-black text-primary shadow-sm backdrop-blur-md">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-50" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  بلاگ قفسه
                </span>

                {activeCategory ? (
                  <span className="inline-flex items-center rounded-full border border-border/80 bg-background/50 px-3 py-1.5 text-[11px] font-bold text-muted-foreground backdrop-blur-md">
                    دسته‌بندی:
                    <span className="mr-1 text-foreground">
                      {activeCategory.name}
                    </span>
                  </span>
                ) : null}
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-black leading-[1.35] tracking-tight text-foreground sm:text-4xl sm:leading-[1.3] lg:text-[2.8rem]">
                نوشته‌هایی درباره
                <span className="relative mx-2 inline-block text-primary">
                  خواندن
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-1 h-2 rounded-full bg-primary/15 blur-sm"
                  />
                </span>
                و کشف کتاب
              </h1>

              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-muted-foreground sm:text-base sm:leading-8">
                یادداشت‌ها، تجربه‌ها و پیشنهادهایی برای پیدا کردن کتاب‌های تازه
                و ساختن رابطه‌ای عمیق‌تر با دنیای مطالعه.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <div className="h-px w-12 bg-gradient-to-l from-primary/70 to-transparent sm:w-20" />

                <span className="text-[11px] font-bold tracking-wide text-muted-foreground">
                  بخوان، کشف کن، به اشتراک بگذار
                </span>
              </div>
            </div>
          </div>

          {/* Bottom fade */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/15 to-transparent"
          />
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
            {category ? (
              <input type="hidden" name="category" value={category} />
            ) : null}
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
              <h2 className="text-xl font-black text-foreground">
                نوشته‌ای پیدا نشد
              </h2>
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

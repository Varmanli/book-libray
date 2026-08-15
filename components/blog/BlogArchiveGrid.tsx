import Link from "next/link";
import { ArrowLeft, ArrowRight, Search } from "lucide-react";

import BlogCard from "@/components/blog/BlogCard";
import { buildBlogArchiveHref } from "@/components/blog/blog-archive";
import type { PublicBlogPostPreview } from "@/lib/blog/service";

export default function BlogArchiveGrid({
  posts,
  page,
  pageCount,
  q = "",
  category = "",
}: {
  posts: PublicBlogPostPreview[];
  page: number;
  pageCount: number;
  q?: string;
  category?: string;
}) {
  return (
    <section className="mt-8 sm:mt-10">
      {posts.length ? (
        <>
          <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {posts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>

          {pageCount > 1 ? (
            <Pagination
              currentPage={page}
              pageCount={pageCount}
              q={q}
              category={category}
            />
          ) : null}
        </>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center text-center">
          <Search className="h-6 w-6 text-muted-foreground/50" />

          <h3 className="mt-4 text-base font-black text-foreground">
            نوشته‌ای پیدا نشد
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            قفسه دیگری را امتحان کنید.
          </p>
        </div>
      )}
    </section>
  );
}

function Pagination({
  currentPage,
  pageCount,
  q,
  category,
}: {
  currentPage: number;
  pageCount: number;
  q: string;
  category: string;
}) {
  return (
    <nav
      aria-label="صفحه‌بندی مجله"
      className="mt-14 flex items-center justify-center gap-3"
    >
      {currentPage > 1 ? (
        <Link
          href={buildBlogArchiveHref({
            q,
            category,
            page: currentPage - 1,
          })}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary hover:text-primary"
          aria-label="صفحه قبل"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}

      <div className="flex h-10 items-center gap-1 rounded-full border border-border/70 px-2">
        {Array.from({ length: pageCount })
          .slice(
            Math.max(0, currentPage - 3),
            Math.min(pageCount, currentPage + 2),
          )
          .map((_, index) => {
            const pageNumber = Math.max(0, currentPage - 3) + index + 1;

            return (
              <Link
                key={pageNumber}
                href={buildBlogArchiveHref({
                  q,
                  category,
                  page: pageNumber,
                })}
                className={
                  pageNumber === currentPage
                    ? "flex h-7 min-w-7 items-center justify-center rounded-full bg-foreground px-2 text-xs font-black text-background"
                    : "flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                }
              >
                {pageNumber.toLocaleString("fa-IR")}
              </Link>
            );
          })}
      </div>

      {currentPage < pageCount ? (
        <Link
          href={buildBlogArchiveHref({
            q,
            category,
            page: currentPage + 1,
          })}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground transition hover:border-primary hover:text-primary"
          aria-label="صفحه بعد"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}

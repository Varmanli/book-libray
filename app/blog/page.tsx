import type { Metadata } from "next";

import BlogArchiveGrid from "@/components/blog/BlogArchiveGrid";
import BlogCategoryHeader from "@/components/blog/BlogCategoryHeader";
import BlogCategoryShelf from "@/components/blog/BlogCategoryShelf";
import BlogHero from "@/components/blog/BlogHero";
import BlogLatestSection from "@/components/blog/BlogLatestSection";
import PublicShell from "@/components/PublicShell";
import {
  BLOG_PAGE_SIZE,
  getLatestPublishedBlogPosts,
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
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const page = Math.max(
    1,
    Number(typeof params.page === "string" ? params.page : "1") || 1,
  );
  const [archive, categories, activeCategory, latestPosts] = await Promise.all([
    listPublicBlogPosts({
      q,
      categorySlug: category,
      page,
      pageSize: BLOG_PAGE_SIZE,
    }),
    listBlogCategoryOptions(),
    category ? getPublicBlogCategoryBySlug(category) : Promise.resolve(null),
    getLatestPublishedBlogPosts(3),
  ]);
  const isArchiveMode = Boolean(q || category || page > 1);

  return (
    <PublicShell>
      <main dir="rtl" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {isArchiveMode ? (
          <>
            <BlogCategoryHeader
              name={
                activeCategory?.name || (q ? `نتایج برای «${q}»` : "قفسهٔ مجله")
              }
              description={
                activeCategory?.description ||
                (q
                  ? "نتیجهٔ جستجو در مقاله‌ها و یادداشت‌های مجله قفسه."
                  : undefined)
              }
              slug={category}
              q={q}
            />
            <BlogArchiveGrid
              posts={archive.posts}
              page={archive.page}
              pageCount={archive.pageCount}
              q={q}
              category={category}
            />
          </>
        ) : (
          <>
            <BlogHero latestPosts={latestPosts} />
            <BlogCategoryShelf categories={categories} />
            <BlogLatestSection posts={archive.posts.slice(0, 5)} />
          </>
        )}
      </main>
    </PublicShell>
  );
}

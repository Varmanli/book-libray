import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlogContentRenderer from "@/components/blog/BlogContentRenderer";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import BlogCard from "@/components/blog/BlogCard";
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import ArticleReadingExperience, {
  ArticleDesktopToc,
} from "@/components/blog/ArticleReadingExperience";
import MagazineRelatedEntities from "@/components/blog/MagazineRelatedEntities";
import PublicShell from "@/components/PublicShell";
import {
  getMagazineRelatedEntities,
  getRelatedPublishedBlogPosts,
  getPublicBlogPostBySlug,
} from "@/lib/blog/service";
import { prepareArticleContent } from "@/lib/blog/article-content";
import { buildPageMetadata } from "@/lib/seo/metadata";
import {
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
import { toAbsoluteUrl } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(decodeURIComponent(slug));

  if (!post) {
    return { title: "نوشته پیدا نشد | قفسه" };
  }

  return buildPageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: post.canonicalUrl || `/blog/${encodeURIComponent(post.slug)}`,
    image: post.ogImage || post.bannerImage,
    type: "article",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublicBlogPostBySlug(decodeURIComponent(slug));
  if (!post) notFound();
  const [relatedPosts, relatedEntities] = await Promise.all([
    getRelatedPublishedBlogPosts(post),
    getMagazineRelatedEntities(post),
  ]);
  const preparedContent = prepareArticleContent(post.content);
  const canonicalUrl =
    post.canonicalUrl ||
    toAbsoluteUrl(`/blog/${encodeURIComponent(post.slug)}`);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "قفسه", url: toAbsoluteUrl("/") },
    { name: "مجله قفسه", url: toAbsoluteUrl("/blog") },
    ...(post.categoryName && post.categorySlug
      ? [
          {
            name: post.categoryName,
            url: toAbsoluteUrl(
              `/blog/category/${encodeURIComponent(post.categorySlug)}`,
            ),
          },
        ]
      : []),
    {
      name: post.title,
      url: toAbsoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
    },
  ]);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image:
      post.ogImage || post.bannerImage
        ? [toAbsoluteUrl(post.ogImage || post.bannerImage)]
        : undefined,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    articleSection: post.categoryName || undefined,
    author: post.authorName
      ? [{ "@type": "Person", name: post.authorName }]
      : undefined,
    mainEntityOfPage: canonicalUrl,
  };

  return (
    <PublicShell>
      <ReadingProgressBar targetId="article-content-column" />
      <article className="mx-auto w-full max-w-7xl px-3 pb-24 sm:px-6">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(breadcrumbJsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd(articleJsonLd),
          }}
        />

        <ArticleReadingExperience headings={preparedContent.headings}>
          {/* Breadcrumb */}
          <nav
            aria-label="مسیر صفحه"
            className="
          article-breadcrumb
          mb-6 flex flex-wrap items-center mt-4 gap-2
          text-xs text-muted-foreground
          sm:text-sm
        "
          >
            <Link href="/" className="hover:text-primary">
              خانه
            </Link>

            <span>/</span>

            <Link href="/blog" className="hover:text-primary">
              مجله قفسه
            </Link>

            {post.categoryName && post.categorySlug && (
              <>
                <span>/</span>
                <Link
                  href={`/blog/category/${post.categorySlug}`}
                  className="hover:text-primary"
                >
                  {post.categoryName}
                </Link>
              </>
            )}
          </nav>

          {/* Hero */}
          <header
            className="
    article-hero
    relative
    overflow-hidden
    rounded-[2rem]
    border border-border/50
    bg-card
    shadow-xl
  "
          >
            <div
              data-magazine-hero-image
              className="
      relative
      min-h-[520px]
      w-full
      overflow-hidden
      sm:min-h-[600px]
    "
            >
              <BlogCoverImage
                src={post.bannerImage}
                alt={post.title}
                sizes="(max-width: 768px) 100vw, 1280px"
                priority
                className="
        object-cover
        transition-transform
        duration-700
        hover:scale-105
      "
              />

              {/* cinematic overlays */}
              <div
                className="
        absolute inset-0
        bg-gradient-to-t
        from-black/85
        via-black/45
        to-black/10
      "
              />

              <div
                className="
        absolute inset-x-0 bottom-0
        p-6
        sm:p-10
        lg:p-14
      "
              >
                <div
                  className="
          mb-6
          flex flex-wrap items-center gap-3
          text-xs font-bold
          text-white/80
        "
                >
                  {post.categoryName && (
                    <span
                      className="
              rounded-full
              border border-white/20
              bg-white/10
              px-4 py-1.5
              text-white
              backdrop-blur-md
            "
                    >
                      {post.categoryName}
                    </span>
                  )}

                  <span className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-white/60" />
                    {post.publishedAt.toLocaleDateString("fa-IR")}
                  </span>

                  {post.readingTime && (
                    <span className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-white/60" />
                      {post.readingTime.toLocaleString("fa-IR")}
                      دقیقه مطالعه
                    </span>
                  )}
                </div>

                <h1
                  className="
          max-w-5xl
          text-3xl
          font-black
          leading-[1.35]
          tracking-tight
          text-white
          sm:text-5xl
          lg:text-6xl
        "
                >
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p
                    className="
            mt-6
            max-w-3xl
            text-base
            leading-8
            text-white/80
            sm:text-lg
          "
                  >
                    {post.excerpt}
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* Article */}
          <div
            className="
          article-reading-layout
          mt-12
          grid
          gap-10
        "
            dir="rtl"
          >
            <ArticleDesktopToc headings={preparedContent.headings} />

            <main
              id="article-content-column"
              dir="rtl"
              className="
            article-content-column
            min-w-0
          "
            >
              <BlogContentRenderer content={preparedContent.html} />
            </main>
          </div>

          {/* Extras */}
          <div data-reading-extras className="mt-16">
            <MagazineRelatedEntities entities={relatedEntities} />

            {relatedPosts.length > 0 && (
              <section className="mt-14">
                <h2
                  className="
                mb-6
                text-2xl
                font-black
              "
                >
                  مطالب مرتبط
                </h2>

                <div
                  className="
                grid
                gap-6
                sm:grid-cols-2
                xl:grid-cols-3
              "
                >
                  {relatedPosts.map((item) => (
                    <BlogCard key={item.id} post={item} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </ArticleReadingExperience>
      </article>
    </PublicShell>
  );
}

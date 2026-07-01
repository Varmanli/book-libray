import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlogContentRenderer from "@/components/blog/BlogContentRenderer";
import PublicShell from "@/components/PublicShell";
import { getPublicBlogPostBySlug } from "@/lib/blog/service";
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
    path: `/blog/${encodeURIComponent(post.slug)}`,
    image: post.bannerImage,
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
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "قفسه", url: toAbsoluteUrl("/") },
    { name: "بلاگ", url: toAbsoluteUrl("/blog") },
    {
      name: post.title,
      url: toAbsoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
    },
  ]);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.bannerImage ? [toAbsoluteUrl(post.bannerImage)] : undefined,
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.publishedAt.toISOString(),
    articleSection: post.categoryName || undefined,
    author: post.authorName
      ? [{ "@type": "Person", name: post.authorName }]
      : undefined,
    mainEntityOfPage: toAbsoluteUrl(`/blog/${encodeURIComponent(post.slug)}`),
  };

  return (
    <PublicShell>
      <article className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
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
        <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 shadow-[0_28px_100px_-72px_rgba(0,0,0,0.75)] backdrop-blur-md">
          <div className="relative aspect-[16/7] overflow-hidden">
            <Image
              src={post.bannerImage}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
          </div>
          <div className="relative -mt-20 px-5 pb-6 sm:px-7 sm:pb-8">
            <div className="max-w-4xl rounded-[1.8rem] border border-border/70 bg-background/75 p-5 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-7">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
                {post.categoryName && post.categorySlug ? (
                  <>
                    <Link
                      href={`/blog?category=${encodeURIComponent(post.categorySlug)}`}
                      className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] text-primary transition hover:border-primary/25"
                    >
                      {post.categoryName}
                    </Link>
                    <span>•</span>
                  </>
                ) : null}
                <span>{post.publishedAt.toLocaleDateString("fa-IR")}</span>
                {post.readingTime ? <span>•</span> : null}
                {post.readingTime ? (
                  <span>{post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه</span>
                ) : null}
                {post.authorName ? <span>•</span> : null}
                {post.authorName ? <span>{post.authorName}</span> : null}
              </div>
              <h1 className="mt-4 text-3xl font-black leading-[1.35] tracking-tight text-foreground sm:text-4xl">
                {post.title}
              </h1>
              {post.excerpt ? (
                <p className="mt-4 max-w-3xl text-sm leading-8 text-muted-foreground sm:text-base">
                  {post.excerpt}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-4xl rounded-[2rem] border border-border/70 bg-card/55 px-5 py-7 shadow-[0_24px_90px_-60px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-8 sm:py-9">
          <BlogContentRenderer content={post.content} />
        </div>
      </article>
    </PublicShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlogContentRenderer from "@/components/blog/BlogContentRenderer";
import BlogCoverImage from "@/components/blog/BlogCoverImage";
import BlogCard from "@/components/blog/BlogCard";
import MagazineRelatedEntities from "@/components/blog/MagazineRelatedEntities";
import PublicShell from "@/components/PublicShell";
import { getMagazineRelatedEntities, getRelatedPublishedBlogPosts, getPublicBlogPostBySlug } from "@/lib/blog/service";
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
  const [relatedPosts, relatedEntities] = await Promise.all([getRelatedPublishedBlogPosts(post), getMagazineRelatedEntities(post)]);
  const preparedContent = prepareArticleContent(post.content);
  const canonicalUrl = post.canonicalUrl || toAbsoluteUrl(`/blog/${encodeURIComponent(post.slug)}`);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: "قفسه", url: toAbsoluteUrl("/") },
    { name: "مجله قفسه", url: toAbsoluteUrl("/blog") },
    ...(post.categoryName && post.categorySlug ? [{ name: post.categoryName, url: toAbsoluteUrl(`/blog/category/${encodeURIComponent(post.categorySlug)}`) }] : []),
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
    image: (post.ogImage || post.bannerImage) ? [toAbsoluteUrl(post.ogImage || post.bannerImage)] : undefined,
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
        <nav aria-label="مسیر صفحه" className="mb-5 flex flex-wrap gap-1 text-xs text-muted-foreground sm:text-sm">
          <Link href="/">خانه</Link><span>/</span><Link href="/blog">مجله قفسه</Link>
          {post.categoryName && post.categorySlug ? <><span>/</span><Link href={`/blog/category/${encodeURIComponent(post.categorySlug)}`}>{post.categoryName}</Link></> : null}
          <span>/</span><span className="line-clamp-1 text-foreground">{post.title}</span>
        </nav>
        <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/60 shadow-[0_28px_100px_-72px_rgba(0,0,0,0.75)] backdrop-blur-md">
          <div className="relative aspect-[16/7] overflow-hidden">
            <BlogCoverImage
              src={post.bannerImage}
              alt={post.title}
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
                      href={`/blog/category/${encodeURIComponent(post.categorySlug)}`}
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

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
          <div className="rounded-[2rem] border border-border/70 bg-card/55 px-5 py-7 shadow-[0_24px_90px_-60px_rgba(0,0,0,0.9)] backdrop-blur-md sm:px-8 sm:py-9">
            <BlogContentRenderer content={preparedContent.html} />
          </div>
          {preparedContent.headings.length >= 3 ? <aside className="rounded-2xl border border-border/70 bg-card/55 p-4 lg:sticky lg:top-24"><h2 className="text-sm font-black text-foreground">در این مطلب</h2><ol className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">{preparedContent.headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? "pr-3" : ""}><a className="transition hover:text-primary" href={`#${heading.id}`}>{heading.text}</a></li>)}</ol></aside> : null}
        </div>
        <MagazineRelatedEntities entities={relatedEntities} />
        {relatedPosts.length ? <section className="mx-auto mt-12 max-w-7xl" aria-labelledby="related-articles"><h2 id="related-articles" className="mb-5 text-2xl font-black text-foreground">مطالب مرتبط</h2><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{relatedPosts.map((item) => <BlogCard key={item.id} post={item} />)}</div></section> : null}
      </article>
    </PublicShell>
  );
}

import Link from "next/link";

import BlogCoverImage from "@/components/blog/BlogCoverImage";
import BlogSearchForm from "@/components/blog/BlogSearchForm";
import type { PublicBlogPostPreview } from "@/lib/blog/service";

export default function BlogHero({
  q = "",
  latestPosts,
}: {
  q?: string;
  latestPosts: PublicBlogPostPreview[];
}) {
  return (
    <section
      aria-labelledby="magazine-title"
      className="relative overflow-hidden py-6 sm:py-10"
    >
      <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div className="max-w-xl">
          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
            مجله قفسه
          </span>

          <h1
            id="magazine-title"
            className="mt-3 text-2xl font-black leading-[1.5] tracking-tight text-foreground sm:text-4xl"
          >
            داستان‌ها، نویسندگان و جهان کتاب‌ها
          </h1>

          <p className="mt-2 max-w-md text-xs leading-6 text-muted-foreground sm:text-sm sm:leading-7">
            مقاله‌ها، معرفی کتاب‌ها و یادداشت‌هایی برای کشف دنیای تازه‌ای از
            خواندن.
          </p>

          <div className="mt-4 max-w-lg">
            <BlogSearchForm q={q} />
          </div>
        </div>

        {latestPosts.length > 0 ? (
          <div className="hidden lg:block">
            <LatestArticlesPreview posts={latestPosts} />
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LatestArticlesPreview({
  posts,
}: {
  posts: PublicBlogPostPreview[];
}) {
  const [lead, ...supporting] = posts;

  return (
    <section
      aria-labelledby="hero-latest-title"
      className="rounded-3xl border border-border/60 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2
          id="hero-latest-title"
          className="text-sm font-black text-foreground"
        >
          تازه‌های مجله
        </h2>

        <Link
          href="/blog"
          className="text-xs font-bold text-muted-foreground transition hover:text-primary"
        >
          مشاهده همه
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr]">
        <LeadPreview post={lead} />

        <div className="flex flex-col gap-4">
          {supporting.slice(0, 2).map((post) => (
            <CompactPreview key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadPreview({
  post,
}: {
  post: PublicBlogPostPreview;
}) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="group block"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        <BlogCoverImage
          src={post.bannerImage}
          alt={post.title}
          priority
          sizes="(max-width:1024px) 100vw, 40vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
          <p className="text-[11px] font-black text-white/80">
            {post.categoryName || "مجله قفسه"}
          </p>

          <h3 className="mt-1 line-clamp-2 text-base font-black leading-7 text-white">
            {post.title}
          </h3>
        </div>
      </div>
    </Link>
  );
}

function CompactPreview({
  post,
}: {
  post: PublicBlogPostPreview;
}) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="group flex gap-3 rounded-2xl p-1 transition hover:bg-muted/40"
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">
        <BlogCoverImage
          src={post.bannerImage}
          alt={post.title}
          sizes="80px"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <article className="min-w-0 py-1">
        <p className="text-[10px] font-black text-primary">
          {post.categoryName || "مجله قفسه"}
        </p>

        <h3 className="mt-1 line-clamp-2 text-xs font-black leading-5 text-foreground transition group-hover:text-primary sm:text-sm sm:leading-6">
          {post.title}
        </h3>

        <p className="mt-1 text-[10px] font-bold text-muted-foreground">
          {post.publishedAt.toLocaleDateString("fa-IR")}
        </p>
      </article>
    </Link>
  );
}
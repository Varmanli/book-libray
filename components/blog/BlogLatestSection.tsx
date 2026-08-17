import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";

import BlogCoverImage from "@/components/blog/BlogCoverImage";
import type { PublicBlogPostPreview } from "@/lib/blog/service";

export default function BlogLatestSection({
  posts,
}: {
  posts: PublicBlogPostPreview[];
}) {
  if (!posts.length) return null;

  const [lead, ...supporting] = posts;

  return (
    <section
      className="mt-14 sm:mt-16 lg:mt-20"
      aria-labelledby="latest-magazine-title"
    >
      {/* Section header */}
      <div className="mb-6 flex items-end justify-between gap-4 lg:mb-7">
        <div>
          <p className="text-[11px] font-bold text-primary sm:text-xs">
            خواندنی‌های تازه
          </p>

          <h2
            id="latest-magazine-title"
            className="mt-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl"
          >
            تازه‌های مجله
          </h2>
        </div>

        <Link
          href="/blog"
          className="group inline-flex shrink-0 items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          آرشیو مجله
          <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
        </Link>
      </div>

      {/* Editorial layout */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:gap-6">
        <LeadArticle post={lead} />

        {supporting.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {supporting.slice(0, 4).map((post) => (
              <SupportingArticle key={post.id} post={post} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function LeadArticle({ post }: { post: PublicBlogPostPreview }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="group relative isolate block min-h-[390px] overflow-hidden rounded-[1.75rem] bg-muted sm:min-h-[480px] lg:min-h-[620px]"
    >
      <BlogCoverImage
        src={post.bannerImage}
        alt={post.title}
        sizes="(max-width: 1024px) 100vw, 65vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.025]"
      />

      {/* Image overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/5" />

      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 to-transparent" />

      {/* Category */}
      <div className="absolute right-5 top-5 sm:right-6 sm:top-6">
        <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[10px] font-bold text-white/90 backdrop-blur-md">
          {post.categoryName || "مجله قفسه"}
        </span>
      </div>

      {/* Content */}
      <article className="absolute inset-x-0 bottom-0 p-5 sm:p-7 lg:p-8">
        <div className="max-w-2xl">
          <h3 className="text-xl font-black leading-9 tracking-tight text-white sm:text-3xl sm:leading-[1.55] lg:text-[2rem]">
            {post.title}
          </h3>

          {post.excerpt ? (
            <p className="mt-3 line-clamp-2 max-w-xl text-xs leading-6 text-white/70 sm:text-sm sm:leading-7">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <PostMeta post={post} inverted />

            <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 text-xs font-bold text-white backdrop-blur-md transition-colors group-hover:bg-white group-hover:text-black">
              مطالعه مقاله
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function SupportingArticle({ post }: { post: PublicBlogPostPreview }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="group overflow-hidden rounded-[1.6rem] border border-border/60 bg-card/40 transition-colors hover:bg-card/70"
    >
      {/* Mobile / tablet image */}
      <div className="relative aspect-[16/9] overflow-hidden lg:hidden">
        <BlogCoverImage
          src={post.bannerImage}
          alt={post.title}
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      {/* Desktop horizontal card */}
      <div className="lg:flex lg:min-h-[135px] lg:items-stretch">
        <div className="relative hidden w-[138px] shrink-0 overflow-hidden lg:block">
          <BlogCoverImage
            src={post.bannerImage}
            alt={post.title}
            sizes="140px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        <article className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-primary">
              {post.categoryName || "مجله قفسه"}
            </span>

            <span className="h-1 w-1 rounded-full bg-border" />

            <span className="text-[10px] text-muted-foreground">
              {post.publishedAt.toLocaleDateString("fa-IR")}
            </span>
          </div>

          <h3 className="mt-2 line-clamp-2 text-xl font-black leading-7 text-foreground transition-colors group-hover:text-primary sm:text-base">
            {post.title}
          </h3>

          {post.excerpt ? (
            <p className="mt-2 line-clamp-2 text-xs leading-6 text-muted-foreground lg:hidden">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-3 flex items-center justify-between gap-3">
            {post.readingTime ? (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                <Clock3 className="h-3 w-3" />
                {post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه
              </span>
            ) : (
              <span />
            )}

            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:-translate-x-1 group-hover:text-primary" />
          </div>
        </article>
      </div>
    </Link>
  );
}

function PostMeta({
  post,
  inverted = false,
}: {
  post: PublicBlogPostPreview;
  inverted?: boolean;
}) {
  const textClass = inverted ? "text-white/65" : "text-muted-foreground";

  return (
    <div
      className={`flex flex-wrap items-center gap-2 text-[10px] font-medium sm:text-xs ${textClass}`}
    >
      <span>{post.publishedAt.toLocaleDateString("fa-IR")}</span>

      {post.readingTime ? (
        <>
          <span className={inverted ? "text-white/30" : "text-border"}>•</span>

          <span className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3 w-3" />
            {post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه
          </span>
        </>
      ) : null}
    </div>
  );
}

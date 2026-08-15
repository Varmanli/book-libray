import Link from "next/link";

import BlogCard from "@/components/blog/BlogCard";
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
    <section className="mt-12 sm:mt-16" aria-labelledby="latest-magazine-title">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black text-primary">خواندنی‌های تازه</p>

          <h2
            id="latest-magazine-title"
            className="mt-1 text-2xl font-black tracking-tight text-foreground sm:text-3xl"
          >
            تازه‌های مجله
          </h2>
        </div>

        <Link
          href="/blog"
          className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-2 text-xs font-black text-foreground transition hover:border-primary/30 hover:text-primary"
        >
          آرشیو مجله
          <span className="text-sm transition-transform group-hover:-translate-x-1">
            ←
          </span>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <LeadArticle post={lead} />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {supporting.slice(0, 4).map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LeadArticle({ post }: { post: PublicBlogPostPreview }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="group relative block min-h-[340px] overflow-hidden rounded-3xl bg-muted shadow-sm transition hover:shadow-md sm:min-h-[430px]"
    >
      <BlogCoverImage
        src={post.bannerImage}
        alt={post.title}
        sizes="(max-width:1024px) 100vw,55vw"
        className="object-cover transition duration-700 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

      <article className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-black text-white backdrop-blur">
            {post.categoryName || "مجله قفسه"}
          </span>
        </div>

        <h3 className="mt-3 max-w-xl text-xl font-black leading-9 text-white sm:text-3xl">
          {post.title}
        </h3>

        {post.excerpt ? (
          <p className="mt-3 line-clamp-2 max-w-xl text-sm leading-7 text-white/75">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-white/70">
          <span>{post.publishedAt.toLocaleDateString("fa-IR")}</span>

          {post.readingTime ? (
            <>
              <span>•</span>
              <span>
                {post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه
              </span>
            </>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

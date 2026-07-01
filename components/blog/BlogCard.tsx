import Image from "next/image";
import Link from "next/link";

import type { PublicBlogPostPreview } from "@/lib/blog/service";

const FALLBACK_BANNER = "/placeholder-cover.svg";

export default function BlogCard({ post }: { post: PublicBlogPostPreview }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="group block overflow-hidden rounded-[1.8rem] border border-border/70 bg-card/60 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card/75"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-background/60">
        <Image
          src={post.bannerImage || FALLBACK_BANNER}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      </div>

      <article className="space-y-4 p-5 text-right">
        {post.categoryName && post.categorySlug ? (
          <div>
            <span className="inline-flex rounded-full border border-primary/15 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
              {post.categoryName}
            </span>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground">
          <span>{post.publishedAt.toLocaleDateString("fa-IR")}</span>
          {post.readingTime ? <span>•</span> : null}
          {post.readingTime ? (
            <span>{post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه</span>
          ) : null}
        </div>

        <h2 className="line-clamp-2 text-lg font-black leading-8 text-foreground transition group-hover:text-primary">
          {post.title}
        </h2>

        {post.excerpt ? (
          <p className="line-clamp-3 text-sm leading-7 text-muted-foreground">
            {post.excerpt}
          </p>
        ) : null}
      </article>
    </Link>
  );
}

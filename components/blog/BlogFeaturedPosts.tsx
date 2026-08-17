import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";

import BlogCoverImage from "@/components/blog/BlogCoverImage";
import type { PublicBlogPostPreview } from "@/lib/blog/service";

export default function BlogFeaturedPosts({
  posts,
}: {
  posts: PublicBlogPostPreview[];
}) {
  if (!posts.length) return null;

  const featuredPosts = posts.slice(0, 4);

  return (
    <section
      className="mt-14 sm:mt-16 lg:mt-20"
      aria-labelledby="featured-magazine-title"
    >
      {/* Header */}
      <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
        <div>
          <p className="text-[11px] font-bold text-primary sm:text-xs">
            انتخاب مجله قفسه
          </p>

          <h2
            id="featured-magazine-title"
            className="mt-1.5 text-2xl font-black tracking-tight text-foreground sm:text-3xl"
          >
            برگزیده‌های این هفته
          </h2>
        </div>

        <Link
          href="/blog"
          className="group inline-flex shrink-0 items-center gap-2 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          مشاهده همه
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
        </Link>
      </div>

      {/* Posts */}
      <div
        className="
          -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto
          px-4 pb-2
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden

          sm:-mx-6 sm:gap-4 sm:px-6

          lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-4
          lg:overflow-visible lg:px-0 lg:pb-0
        "
      >
        {featuredPosts.map((post) => (
          <FeaturedCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

function FeaturedCard({ post }: { post: PublicBlogPostPreview }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="
        group relative isolate block
        min-h-[290px] w-[78vw] max-w-[310px] shrink-0
        snap-start overflow-hidden rounded-[1.65rem]
        bg-muted

        sm:w-[300px]

        lg:min-h-[320px] lg:w-auto lg:max-w-none
      "
    >
      {/* Cover */}
      <BlogCoverImage
        src={post.bannerImage}
        alt={post.title}
        sizes="(max-width: 640px) 78vw, (max-width: 1024px) 300px, 25vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/5" />

      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/55 to-transparent" />

      {/* Category */}
      <div className="absolute right-4 top-4">
        <span className="inline-flex rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[9px] font-bold text-white/85 backdrop-blur-md">
          {post.categoryName || "مجله قفسه"}
        </span>
      </div>

      {/* Content */}
      <article className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        <h3 className="line-clamp-3 text-base font-black leading-7 text-white sm:text-[17px]">
          {post.title}
        </h3>

        {post.excerpt ? (
          <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/65">
            {post.excerpt}
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2 text-[9px] font-medium text-white/55">
            {post.readingTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {post.readingTime.toLocaleString("fa-IR")} دقیقه
              </span>
            ) : null}

            <span className="hidden h-1 w-1 rounded-full bg-white/30 sm:block" />

            <span className="hidden sm:inline">
              {post.publishedAt.toLocaleDateString("fa-IR")}
            </span>
          </div>

          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md transition-all group-hover:bg-white group-hover:text-black">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          </span>
        </div>
      </article>
    </Link>
  );
}

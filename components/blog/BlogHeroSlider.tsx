"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";

type SliderPost = {
  id: string;
  slug: string;
  title: string;
  bannerImage: string | null;
  categoryName?: string | null;
  readingTime?: number | null;
};

export default function BlogHeroSlider({ posts }: { posts: SliderPost[] }) {
  const post = posts[0];

  if (!post) return null;

  return (
    <section className="min-w-0">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />

        <p className="text-[11px] font-black text-foreground">
          تازه‌ترین نوشته‌ها
        </p>
      </div>

      <HeroCard post={post} />
    </section>
  );
}

function HeroCard({ post }: { post: SliderPost }) {
  return (
    <Link
      href={`/blog/${encodeURIComponent(post.slug)}`}
      className="
        group
        relative
        isolate
        block
        h-[420px]
        w-full
        overflow-hidden
        rounded-[1.75rem]
        bg-muted

        sm:h-[480px]
        lg:h-[500px]
      "
    >
      {/* Image */}
      {post.bannerImage ? (
        <div className="absolute inset-0">
          <Image
            src={post.bannerImage}
            alt={post.title}
            fill
            priority
            sizes="100vw"
            quality={90}
            className="
              object-cover
              object-center
              transition-transform
              duration-700
              ease-out
              group-hover:scale-[1.02]
            "
          />
        </div>
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* Overlay */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/85
          via-black/25
          to-transparent
        "
      />

      {/* Category */}
      {post.categoryName ? (
        <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
          <span
            className="
              inline-flex
              rounded-full
              border
              border-white/10
              bg-black/30
              px-3
              py-1.5
              text-[10px]
              font-bold
              text-white/90
              backdrop-blur-md
            "
          >
            {post.categoryName}
          </span>
        </div>
      ) : null}

      {/* Content */}
      <article
        className="
          absolute
          inset-x-0
          bottom-0
          p-5

          sm:p-6
          lg:p-7
        "
      >
        <div className="max-w-3xl">
          <h2
            className="
              line-clamp-3
              text-lg
              font-black
              leading-8
              text-white

              sm:text-2xl
              sm:leading-10
            "
          >
            {post.title}
          </h2>

          {post.readingTime ? (
            <div
              className="
                mt-4
                flex
                items-center
                gap-1.5
                text-[11px]
                text-white/65

                sm:text-xs
              "
            >
              <Clock3 className="h-3.5 w-3.5" />

              <span>
                {post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه
              </span>
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

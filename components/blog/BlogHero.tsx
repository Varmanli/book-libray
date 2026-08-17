import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import BlogHeroSlider from "@/components/blog/BlogHeroSlider";
import type { PublicBlogPostPreview } from "@/lib/blog/service";

export default function BlogHero({
  latestPosts,
}: {
  latestPosts: PublicBlogPostPreview[];
}) {
  if (!latestPosts.length) return null;

  const sliderPosts = latestPosts.slice(0, 6).map((post) => ({
    id: post.id,
    slug: post.slug,
    title: post.title,
    bannerImage: post.bannerImage,
    categoryName: post.categoryName,
    readingTime: post.readingTime,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
  }));

  return (
    <section className="pt-7 sm:pt-9 lg:pt-10">
      <div
        className="
          grid
          gap-8
          lg:grid-cols-[320px_minmax(0,1fr)]
          lg:items-center
          lg:gap-10
        "
      >
        {/* Intro — right side on desktop */}
        <div className="order-1 lg:order-none">
          <div className="flex items-center gap-2">
            <span className="h-px w-7 bg-primary/60" />

            <span className="text-[11px] font-black text-primary">
              مجله قفسه
            </span>
          </div>

          <h1
            className="
              mt-5
              max-w-md
              text-3xl
              font-black
              leading-[1.6]
              tracking-tight
              text-foreground

              sm:text-4xl

              lg:text-[2.6rem]
              lg:leading-[1.55]
            "
          >
            داستان‌ها،
            <br className="hidden lg:block" />
            نویسندگان و
            <br className="hidden lg:block" />
            جهان کتاب‌ها
          </h1>

          <p
            className="
              mt-5
              max-w-sm
              text-sm
              leading-8
              text-muted-foreground
            "
          >
            جایی برای خواندن، کشف و تأمل درباره کتاب‌ها، نویسندگان و زندگی ادبی.
          </p>

          <Link
            href="/blog"
            className="
              group
              mt-6
              inline-flex
              items-center
              gap-2
              text-xs
              font-black
              text-foreground
              transition-colors
              hover:text-primary
            "
          >
            کشف نوشته‌های مجله
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        {/* Big slider */}
        <div className="order-2 min-w-0 lg:order-none">
          <BlogHeroSlider posts={sliderPosts} />
        </div>
      </div>
    </section>
  );
}

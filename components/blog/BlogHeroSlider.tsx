"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

type SliderPost = {
  id: string;
  slug: string;
  title: string;
  bannerImage: string | null;
  categoryName?: string | null;
  readingTime?: number | null;
};

export default function BlogHeroSlider({ posts }: { posts: SliderPost[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: posts.length > 1,
    direction: "rtl",
    slidesToScroll: 1,
    align: "start",
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!posts.length) return null;

  return (
    <section className="min-w-0">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />

          <p className="text-[11px] font-black text-foreground">
            تازه‌ترین نوشته‌ها
          </p>
        </div>

        {posts.length > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={scrollPrev}
              aria-label="مطلب قبلی"
              className="
                flex h-8 w-8 items-center justify-center
                rounded-full border border-border/60
                text-muted-foreground
                transition
                hover:border-primary/30
                hover:bg-primary/5
                hover:text-primary
              "
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={scrollNext}
              aria-label="مطلب بعدی"
              className="
                flex h-8 w-8 items-center justify-center
                rounded-full border border-border/60
                text-muted-foreground
                transition
                hover:border-primary/30
                hover:bg-primary/5
                hover:text-primary
              "
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Embla viewport */}
      <div
        ref={emblaRef}
        dir="rtl"
        className="overflow-hidden rounded-[1.75rem]"
      >
        <div className="flex touch-pan-y">
          {posts.map((post, index) => (
            <div key={post.id} className="min-w-0 flex-[0_0_100%]">
              <SliderCard post={post} priority={index === 0} />
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {posts.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {posts.map((post, index) => (
            <button
              key={post.id}
              type="button"
              aria-label={`رفتن به اسلاید ${index + 1}`}
              onClick={() => scrollTo(index)}
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                selectedIndex === index
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-border hover:bg-muted-foreground/50",
              ].join(" ")}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SliderCard({
  post,
  priority = false,
}: {
  post: SliderPost;
  priority?: boolean;
}) {
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
      {post.bannerImage ? (
        <Image
          src={post.bannerImage}
          alt={post.title}
          fill
          priority={priority}
          quality={95}
          sizes="
            (max-width: 640px) 100vw,
            (max-width: 1024px) 100vw,
            70vw
          "
          className="
            object-cover
            object-center
            transition-transform
            duration-700
            ease-out
            group-hover:scale-[1.025]
          "
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      {/* فقط یک overlay؛ قبلاً دو gradient روی هم تصویر را خراب‌تر می‌کرد */}
      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-black/85
          via-black/20
          to-transparent
        "
      />

      {/* Category */}
      {post.categoryName ? (
        <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
          <span
            className="
              rounded-full
              border border-white/10
              bg-black/30
              px-2.5 py-1
              text-[9px]
              font-bold
              text-white/85
              backdrop-blur-md
            "
          >
            {post.categoryName}
          </span>
        </div>
      ) : null}

      {/* Content */}
      <article className="absolute inset-x-0 bottom-0 p-5 sm:p-6 lg:p-7">
        <div className="max-w-2xl">
          <h3
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
          </h3>

          {post.readingTime ? (
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-white/60 sm:text-xs">
              <Clock3 className="h-3 w-3" />
              {post.readingTime.toLocaleString("fa-IR")} دقیقه مطالعه
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

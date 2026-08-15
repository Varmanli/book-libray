"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, BookOpen } from "lucide-react";

import { getPublicBookHref } from "@/lib/book/public-href";
import { cn } from "@/lib/utils";
import type { HeroSlideBook, HeroSlideView } from "@/lib/home/service";

const PLACEHOLDER = "/placeholder-cover.svg";
const AUTOPLAY_DELAY = 7000;

export default function HomeHeroSlider({
  slides,
}: {
  slides: HeroSlideView[];
}) {
  const emblaOptions = useMemo(
    () => ({
      direction: "rtl" as const,
      loop: slides.length > 1,
      align: "start" as const,
      containScroll: "trimSnaps" as const,
    }),
    [slides.length],
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const syncSelectedIndex = useCallback(() => {
    if (!emblaApi) return;

    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    syncSelectedIndex();

    emblaApi.on("select", syncSelectedIndex);
    emblaApi.on("reInit", syncSelectedIndex);

    return () => {
      emblaApi.off("select", syncSelectedIndex);
      emblaApi.off("reInit", syncSelectedIndex);
    };
  }, [emblaApi, syncSelectedIndex]);

  useEffect(() => {
    if (!emblaApi || slides.length < 2) return;

    let timer: number | undefined;

    const stop = () => {
      if (timer === undefined) return;

      window.clearInterval(timer);
      timer = undefined;
    };

    const start = () => {
      stop();

      if (document.hidden) return;

      timer = window.setInterval(() => {
        emblaApi.scrollNext();
      }, AUTOPLAY_DELAY);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
        return;
      }

      start();
    };

    start();

    document.addEventListener("visibilitychange", handleVisibilityChange);
    emblaApi.on("pointerDown", stop);
    emblaApi.on("pointerUp", start);

    return () => {
      stop();

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      emblaApi.off("pointerDown", stop);
      emblaApi.off("pointerUp", start);
    };
  }, [emblaApi, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[1.75rem]
        border
        border-border/60
        bg-card
        shadow-[0_18px_50px_-26px_rgba(0,0,0,0.28)]
        sm:rounded-[2rem]
        lg:rounded-[2.4rem]
        lg:shadow-[0_32px_90px_-54px_rgba(0,0,0,0.45)]
      "
    >
      {/* top light */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-10
          top-0
          z-20
          h-px
          bg-gradient-to-r
          from-transparent
          via-primary/35
          to-transparent
        "
      />

      <div ref={emblaRef} className="overflow-hidden" dir="rtl">
        <div className="flex touch-pan-y will-change-transform">
          {slides.map((slide, index) => (
            <div key={slide.id} className="min-w-0 shrink-0 grow-0 basis-full">
              <HeroSlide
                slide={slide}
                priority={index === 0}
                active={selectedIndex === index}
              />
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <HeroPagination
          count={slides.length}
          selectedIndex={selectedIndex}
          onSelect={(index) => emblaApi?.scrollTo(index)}
        />
      ) : null}
    </section>
  );
}

function HeroSlide({
  slide,
  priority,
  active,
}: {
  slide: HeroSlideView;
  priority: boolean;
  active: boolean;
}) {
  return (
    <article
      className="
        relative
        isolate
        flex
        min-h-[560px]
        flex-col
        overflow-hidden
        p-4
        pb-16

        sm:min-h-[600px]
        sm:p-6
        sm:pb-16

        lg:grid
        lg:min-h-[500px]
        lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]
        lg:items-center
        lg:gap-12
        lg:p-10
        lg:pb-10
      "
    >
      <HeroBackground slide={slide} priority={priority} />

      {/* Mobile visual */}
      <div
        className={cn(
          `
            relative
            z-10
            order-1
            mb-5
            transition-all
            duration-700
            motion-reduce:transition-none

            lg:order-2
            lg:mb-0
          `,
          active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-90",
        )}
      >
        <HeroVisual books={slide.books} priority={priority} />
      </div>

      {/* Content */}
      <div
        className={cn(
          `
            relative
            z-10
            order-2
            flex
            flex-1
            flex-col
            justify-center
            px-1

            transition-all
            duration-700
            ease-out
            motion-reduce:transition-none

            sm:px-2

            lg:order-1
            lg:px-0
          `,
          active ? "translate-y-0 opacity-100" : "translate-y-2 opacity-90",
        )}
      >
        {slide.badge ? (
          <div>
            <span
              className="
                inline-flex
                h-7
                items-center
                rounded-full
                border
                border-primary/15
                bg-primary/[0.07]
                px-3
                text-[10px]
                font-bold
                tracking-wide
                text-primary
                backdrop-blur-sm

                sm:h-8
                sm:text-[11px]
              "
            >
              {slide.badge}
            </span>
          </div>
        ) : null}

        <h1
          className="
            mt-3
            max-w-2xl
            text-[1.8rem]
            font-black
            leading-[1.35]
            tracking-[-0.035em]
            text-foreground

            sm:mt-4
            sm:text-[2.4rem]
            sm:leading-[1.3]

            lg:text-[3.15rem]
            lg:leading-[1.22]
          "
        >
          {slide.title}
        </h1>

        {slide.description ? (
          <p
            className="
              mt-3
              max-w-xl
              text-[13px]
              leading-7
              text-muted-foreground

              sm:mt-4
              sm:text-[15px]
              sm:leading-8

              lg:text-base
            "
          >
            {slide.description}
          </p>
        ) : null}

        {(slide.primaryLabel && slide.primaryHref) ||
        (slide.secondaryLabel && slide.secondaryHref) ? (
          <div
            className="
              mt-5
              grid
              grid-cols-2
              gap-2.5

              sm:mt-7
              sm:flex
              sm:flex-wrap
              sm:gap-3
            "
          >
            {slide.primaryLabel && slide.primaryHref ? (
              <Link
                href={slide.primaryHref}
                className="
                  group
                  inline-flex
                  h-12
                  min-w-0
                  items-center
                  justify-center
                  gap-2
                  rounded-[1rem]
                  bg-primary
                  px-4
                  text-xs
                  font-bold
                  text-primary-foreground
                  shadow-[0_8px_22px_-10px_var(--primary)]
                  outline-none
                  transition-all
                  duration-200

                  active:scale-[0.97]

                  focus-visible:ring-2
                  focus-visible:ring-primary/40
                  focus-visible:ring-offset-2

                  sm:h-12
                  sm:min-w-36
                  sm:px-6
                  sm:text-sm

                  hover:bg-primary/90
                "
              >
                <span className="truncate">{slide.primaryLabel}</span>

                <ArrowLeft
                  aria-hidden="true"
                  className="
                    size-4
                    shrink-0
                    transition-transform
                    duration-200
                    group-hover:-translate-x-0.5
                  "
                />
              </Link>
            ) : null}

            {slide.secondaryLabel && slide.secondaryHref ? (
              <Link
                href={slide.secondaryHref}
                className="
                  inline-flex
                  h-12
                  min-w-0
                  items-center
                  justify-center
                  rounded-[1rem]
                  border
                  border-border/70
                  bg-background/55
                  px-4
                  text-xs
                  font-bold
                  text-foreground
                  backdrop-blur-md
                  outline-none
                  transition-all
                  duration-200

                  active:scale-[0.97]

                  focus-visible:ring-2
                  focus-visible:ring-primary/30

                  sm:min-w-32
                  sm:px-6
                  sm:text-sm

                  hover:border-primary/20
                  hover:bg-primary/[0.05]
                  hover:text-primary
                "
              >
                <span className="truncate">{slide.secondaryLabel}</span>
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function HeroBackground({
  slide,
  priority,
}: {
  slide: HeroSlideView;
  priority: boolean;
}) {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-card"
      />

      {slide.imageUrl ? (
        <Image
          aria-hidden="true"
          src={slide.imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          quality={60}
          className="
            pointer-events-none
            -z-10
            scale-110
            object-cover
            opacity-[0.08]
            blur-[2px]

            sm:opacity-[0.1]
            lg:opacity-[0.12]
          "
        />
      ) : null}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          bg-gradient-to-b
          from-background/15
          via-card/70
          to-card

          lg:bg-gradient-to-l
          lg:from-transparent
          lg:via-card/80
          lg:to-card
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -right-24
          -top-28
          -z-10
          size-72
          rounded-full
          bg-primary/[0.10]
          blur-[80px]

          sm:size-96
          lg:-right-16
          lg:-top-40
          lg:size-[30rem]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-28
          -left-24
          -z-10
          size-64
          rounded-full
          bg-primary/[0.06]
          blur-[80px]
        "
      />
    </>
  );
}

function HeroVisual({
  books,
  priority,
}: {
  books: HeroSlideBook[];
  priority: boolean;
}) {
  const visibleBooks = books.slice(0, 3);

  return (
    <div
      className="
        relative
        flex
        h-[220px]
        items-center
        justify-center
        overflow-hidden
        rounded-[1.5rem]
        border
        border-border/55
        bg-background/35
        shadow-inner
        backdrop-blur-sm

        sm:h-[270px]
        sm:rounded-[1.8rem]

        lg:h-[360px]
        lg:rounded-[2rem]
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          bg-gradient-to-br
          from-primary/[0.04]
          via-transparent
          to-primary/[0.08]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-32
          w-48
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-primary/10
          blur-[55px]

          sm:h-40
          sm:w-64
          lg:h-52
          lg:w-80
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-x-7
          bottom-5
          h-10
          rounded-[50%]
          bg-black/10
          blur-xl
          dark:bg-black/30
        "
      />

      {visibleBooks.length > 0 ? (
        <div
          className="
            relative
            z-10
            flex
            h-full
            items-center
            justify-center
            px-5
            py-5

            sm:px-8
            sm:py-6
          "
        >
          {visibleBooks.map((book, index) => (
            <HeroBookCover
              key={book.id}
              book={book}
              index={index}
              count={visibleBooks.length}
              priority={priority && index === 1}
            />
          ))}
        </div>
      ) : (
        <HeroFallbackVisual />
      )}
    </div>
  );
}

function HeroFallbackVisual() {
  return (
    <div className="relative z-10 flex flex-col items-center gap-4">
      <div
        className="
          flex
          aspect-[2/3]
          w-24
          items-center
          justify-center
          overflow-hidden
          rounded-[1rem]
          border
          border-border/60
          bg-muted/50
          shadow-[0_18px_45px_-24px_rgba(0,0,0,0.4)]

          sm:w-32
        "
      >
        <BookOpen
          aria-hidden="true"
          className="size-7 text-muted-foreground sm:size-8"
        />
      </div>

      <div className="text-center">
        <p className="text-[11px] font-bold text-primary">قفسه</p>

        <p className="mt-1 text-sm font-black text-foreground">
          آرام، منظم، خواندنی
        </p>
      </div>
    </div>
  );
}

function HeroBookCover({
  book,
  index,
  count,
  priority = false,
}: {
  book: HeroSlideBook;
  index: number;
  count: number;
  priority?: boolean;
}) {
  const [hasImageError, setHasImageError] = useState(false);

  const href = getPublicBookHref(book);

  if (!href) return null;

  const src = !hasImageError && book.coverImage ? book.coverImage : PLACEHOLDER;

  const isCenter = count === 1 || (count >= 3 && index === 1);

  const position =
    count === 1
      ? "z-20"
      : index === 0
        ? "z-10 -me-5 -rotate-[7deg] translate-y-2 sm:-me-7"
        : index === count - 1
          ? "z-10 -ms-5 rotate-[7deg] translate-y-2 sm:-ms-7"
          : "z-20";

  return (
    <Link
      href={href}
      aria-label={book.title}
      className={cn(
        `
          group
          relative
          block
          w-[92px]
          shrink-0
          outline-none
          transition-all
          duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]

          active:scale-[0.97]

          focus-visible:ring-2
          focus-visible:ring-primary/40
          focus-visible:ring-offset-2

          sm:w-[116px]
          lg:w-[132px]

          lg:hover:z-30
          lg:hover:-translate-y-2
          lg:hover:rotate-0
          lg:hover:scale-[1.04]
        `,
        position,
        isCenter && "scale-[1.06] sm:scale-[1.08]",
      )}
    >
      <div
        className="
          overflow-hidden
          rounded-[0.95rem]
          border
          border-white/15
          bg-card
          p-1.5
          shadow-[0_20px_40px_-18px_rgba(0,0,0,0.45)]

          transition-shadow
          duration-500

          sm:rounded-[1.15rem]
          sm:p-2

          lg:group-hover:shadow-[0_28px_55px_-20px_rgba(0,0,0,0.55)]
        "
      >
        <div
          className="
            relative
            aspect-[2/3]
            overflow-hidden
            rounded-[0.7rem]
            bg-muted/50

            sm:rounded-[0.85rem]
          "
        >
          <Image
            src={src}
            alt={book.title}
            fill
            priority={priority}
            sizes="
              (max-width: 640px) 92px,
              (max-width: 1024px) 116px,
              132px
            "
            quality={78}
            onError={() => setHasImageError(true)}
            className="
              object-cover
              transition-transform
              duration-700
              ease-out
              lg:group-hover:scale-[1.035]
            "
          />

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              inset-0
              bg-gradient-to-t
              from-black/10
              via-transparent
              to-white/[0.06]
            "
          />
        </div>

        <div className="px-0.5 pb-0.5 pt-1.5 sm:pt-2">
          <p
            className="
              line-clamp-1
              text-[10px]
              font-bold
              leading-4
              text-foreground

              sm:text-[11px]
              lg:text-xs
            "
          >
            {book.title}
          </p>

          {book.author ? (
            <p
              className="
                mt-0.5
                line-clamp-1
                text-[9px]
                text-muted-foreground

                sm:text-[10px]
                lg:text-[11px]
              "
            >
              {book.author}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function HeroPagination({
  count,
  selectedIndex,
  onSelect,
}: {
  count: number;
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      className="
        absolute
        inset-x-0
        bottom-4
        z-30
        flex
        items-center
        justify-center
        gap-1.5

        lg:bottom-5
      "
    >
      {Array.from({ length: count }).map((_, index) => {
        const active = selectedIndex === index;

        return (
          <button
            key={index}
            type="button"
            aria-label={`رفتن به اسلاید ${index + 1}`}
            aria-current={active ? "true" : undefined}
            onClick={() => onSelect(index)}
            className="
              group
              flex
              h-6
              items-center
              justify-center
              rounded-full
              px-0.5
              outline-none

              focus-visible:ring-2
              focus-visible:ring-primary/40
            "
          >
            <span
              className={cn(
                `
                  block
                  h-1.5
                  rounded-full
                  transition-all
                  duration-300
                  ease-[cubic-bezier(0.22,1,0.36,1)]
                  motion-reduce:transition-none
                `,
                active
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-foreground/20 group-hover:bg-foreground/35",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

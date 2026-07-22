"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { BookOpen } from "lucide-react";

import { getPublicBookHref } from "@/lib/book/public-href";
import { cn } from "@/lib/utils";
import type { HeroSlideBook, HeroSlideView } from "@/lib/home/service";

const PLACEHOLDER = "/placeholder-cover.svg";

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

  useEffect(() => {
    if (!emblaApi || slides.length < 2) return;

    let timer: number | undefined;

    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const start = () => {
      stop();
      if (document.hidden) return;
      timer = window.setInterval(() => emblaApi.scrollNext(), 7000);
    };
    const handleVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
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
    <section className="relative overflow-hidden rounded-[2.35rem] border border-border/70 bg-card/95 shadow-[0_32px_90px_-56px_rgba(0,0,0,0.6)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/35 to-transparent"
      />

      <div className="overflow-hidden" ref={emblaRef} dir="rtl">
        <div className="flex will-change-transform">
          {slides.map((slide, index) => (
            <div key={slide.id} className="min-w-0 shrink-0 grow-0 basis-full">
              <HeroSlide slide={slide} priority={index === 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HeroSlide({
  slide,
  priority,
}: {
  slide: HeroSlideView;
  priority: boolean;
}) {
  return (
    <article className="relative grid min-h-[540px] gap-8 overflow-hidden p-5 sm:min-h-[500px] sm:p-7 lg:min-h-[480px] lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center lg:gap-10 lg:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-95"
        style={{
          backgroundImage:
            "radial-gradient(circle at top right, rgba(128,167,150,0.18), transparent 34%), radial-gradient(circle at bottom left, rgba(43,98,82,0.12), transparent 30%), linear-gradient(135deg, var(--card) 0%, var(--surface-2) 100%)",
        }}
      />

      {slide.imageUrl ? (
        <Image
          aria-hidden="true"
          src={slide.imageUrl}
          alt=""
          fill
          priority={priority}
          sizes="100vw"
          quality={75}
          className="pointer-events-none object-cover opacity-[0.16]"
        />
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-px bg-gradient-to-b from-transparent via-border to-transparent lg:block"
      />

      <div className="relative flex flex-col justify-center pt-6 lg:pt-0">
        {slide.badge ? (
          <span className="inline-flex w-fit rounded-full border border-border/70 bg-background/70 px-3 py-1 text-[11px] font-bold tracking-[0.18em] text-primary">
            {slide.badge}
          </span>
        ) : null}

        <h1 className="mt-4 max-w-xl text-[2rem] font-black leading-[1.25] tracking-tight text-foreground sm:text-[2.65rem] lg:text-[3.2rem]">
          {slide.title}
        </h1>

        {slide.description ? (
          <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground sm:text-base">
            {slide.description}
          </p>
        ) : null}

        {(slide.primaryLabel && slide.primaryHref) ||
        (slide.secondaryLabel && slide.secondaryHref) ? (
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            {slide.primaryLabel && slide.primaryHref ? (
              <Link
                href={slide.primaryHref}
                className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {slide.primaryLabel}
              </Link>
            ) : null}

            {slide.secondaryLabel && slide.secondaryHref ? (
              <Link
                href={slide.secondaryHref}
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-border bg-background/70 px-6 text-sm font-bold text-foreground transition-colors hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
              >
                {slide.secondaryLabel}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      <HeroVisual books={slide.books} priority={priority} />
    </article>
  );
}

/**
 * ناحیه‌ی بصری اسلاید:
 * کاور کتاب‌های انتخابی به‌صورت استک ظریف، یا fallback تزئینی.
 */
function HeroVisual({
  books,
  priority,
}: {
  books: HeroSlideBook[];
  priority: boolean;
}) {
  const visibleBooks = books.slice(0, 3);

  return (
    <div className="relative flex min-h-[260px] items-center justify-center sm:min-h-[300px]">
      <div className="absolute inset-0 rounded-[2rem] border border-border/70 bg-background/40" />

      <div
        aria-hidden="true"
        className="absolute inset-4 rounded-[1.7rem] border border-white/10"
        style={{
          backgroundImage:
            "linear-gradient(145deg, rgba(255,255,255,0.08), transparent 35%), radial-gradient(circle at bottom left, rgba(128,167,150,0.18), transparent 45%)",
        }}
      />

      {visibleBooks.length > 0 ? (
        <div className="relative flex items-center justify-center gap-0 py-6">
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
    <div className="relative flex flex-col items-center gap-4">
      <div className="relative aspect-[2/3] w-[140px] overflow-hidden rounded-[1.3rem] border border-border/70 bg-muted/40 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.5)]">
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <BookOpen className="h-8 w-8" />
        </div>
      </div>

      <div className="rounded-[1.2rem] border border-border/70 bg-card/90 px-4 py-2.5 text-center shadow-lg shadow-black/10 backdrop-blur">
        <p className="text-xs font-bold text-primary">قفسه</p>
        <p className="mt-0.5 text-sm font-black text-foreground">
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
  const src = !hasImageError && book.coverImage ? book.coverImage : PLACEHOLDER;

  if (!href) return null;

  const rotation =
    count === 1
      ? "rotate-0"
      : index === 0
        ? "rotate-[-6deg]"
        : index === count - 1
          ? "rotate-[6deg]"
          : "rotate-0";

  const overlap = index === 0 ? "" : "-ms-6 sm:-ms-7";
  const emphasis = count >= 3 && index === 1 ? "z-20 scale-105" : "z-10";

  return (
    <Link
      href={href}
      className={cn(
        "group relative block w-[108px] shrink-0 transition-transform hover:z-30 hover:-translate-y-1 sm:w-[124px]",
        rotation,
        overlap,
        emphasis,
      )}
    >
      <div className="overflow-hidden rounded-[1.3rem] border border-border/70 bg-card p-2 shadow-[0_22px_55px_-30px_rgba(0,0,0,0.6)]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[1rem] bg-muted/40">
          <Image
            src={src}
            alt={book.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 108px, 124px"
            quality={75}
            onError={() => setHasImageError(true)}
            className="object-cover"
          />
        </div>

        <p className="mt-2 line-clamp-1 text-xs font-bold text-foreground">
          {book.title}
        </p>

        {book.author ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
            {book.author}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import { BookOpen, ChevronLeft, ChevronRight } from "lucide-react";

import { getPublicBookHref } from "@/lib/book/public-href";
import { cn } from "@/lib/utils";
import type { HeroSlideBook, HeroSlideView } from "@/lib/home/service";

const PLACEHOLDER = "/placeholder-cover.svg";

export default function HomeHeroSlider({
  slides,
}: {
  slides: HeroSlideView[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    direction: "rtl",
    loop: slides.length > 1,
    align: "start",
  });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (emblaApi) setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi || slides.length < 2) return;
    const timer = window.setInterval(() => emblaApi.scrollNext(), 7000);
    return () => window.clearInterval(timer);
  }, [emblaApi, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-[2.35rem] border border-border/70 bg-card/95 shadow-[0_32px_90px_-56px_rgba(0,0,0,0.6)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/35 to-transparent"
      />

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div key={slide.id} className="min-w-0 shrink-0 grow-0 basis-full">
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
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-[0.16]"
                    style={{
                      backgroundImage: `url(${slide.imageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
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

                <HeroVisual books={slide.books} />
              </article>
            </div>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="اسلاید قبلی"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-lg shadow-black/10 backdrop-blur transition-colors hover:border-primary/20 hover:bg-background sm:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="اسلاید بعدی"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/85 text-foreground shadow-lg shadow-black/10 backdrop-blur transition-colors hover:border-primary/20 hover:bg-background sm:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border/70 bg-background/85 px-3 py-2 shadow-lg shadow-black/5 backdrop-blur">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`رفتن به اسلاید ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  index === selected
                    ? "w-6 bg-primary"
                    : "w-2 bg-border hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

/** ناحیه‌ی بصری اسلاید: کاور کتاب‌های انتخابی به‌صورت استک ظریف، یا fallback تزئینی. */
function HeroVisual({ books }: { books: HeroSlideBook[] }) {
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

      {books.length > 0 ? (
        <div className="relative flex items-center justify-center gap-0 py-6">
          {books.slice(0, 3).map((book, index) => (
            <HeroBookCover key={book.id} book={book} index={index} count={books.length} />
          ))}
        </div>
      ) : (
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
      )}
    </div>
  );
}

function HeroBookCover({
  book,
  index,
  count,
}: {
  book: HeroSlideBook;
  index: number;
  count: number;
}) {
  const [error, setError] = useState(false);
  const src = !error && book.coverImage ? book.coverImage : PLACEHOLDER;
  const href = getPublicBookHref(book);

  if (!href) return null;

  // چینش ظریف: کارت میانی کمی بزرگ‌تر و جلوتر؛ کناری‌ها با چرخش ملایم و هم‌پوشانی.
  const rotation =
    count === 1
      ? "rotate-0"
      : index === 0
        ? "rotate-[-6deg]"
        : index === count - 1
          ? "rotate-[6deg]"
          : "rotate-0";
  const overlap = index === 0 ? "" : "-ms-6 sm:-ms-7";
  const emphasis =
    count >= 3 && index === 1 ? "z-20 scale-105" : "z-10";

  return (
    <Link
      href={href}
      className={cn(
        "group relative block w-[108px] shrink-0 transition-transform hover:z-30 hover:-translate-y-1 sm:w-[124px]",
        rotation,
        overlap,
        emphasis
      )}
    >
      <div className="overflow-hidden rounded-[1.3rem] border border-border/70 bg-card p-2 shadow-[0_22px_55px_-30px_rgba(0,0,0,0.6)]">
        <div className="relative aspect-[2/3] overflow-hidden rounded-[1rem] bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={book.title}
            onError={() => setError(true)}
            className="h-full w-full object-cover"
          />
        </div>
        <p className="mt-2 line-clamp-1 text-xs font-bold text-foreground">
          {book.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">
          {book.author}
        </p>
      </div>
    </Link>
  );
}

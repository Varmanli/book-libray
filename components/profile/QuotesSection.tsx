"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpenText, Quote } from "lucide-react";

import { Carousel } from "@/components/ui/Carousel";
import QuoteCard from "@/components/profile/QuoteCard";
import type { PublicQuote } from "@/lib/quotes/service";

export default function QuotesSection({
  quotes,
  isOwner,
  canLike,
  username,
  initialHasMore,
}: {
  quotes: PublicQuote[];
  isOwner: boolean;
  canLike: boolean;
  username: string;
  initialHasMore: boolean;
}) {
  const hasQuotes = quotes.length > 0;
  const [limit, setLimit] = useState(3);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!isMobile) {
      setLimit(quotes.length);
      return;
    }

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLimit((prev) => Math.min(prev + 3, quotes.length));
        }
      },
      {
        rootMargin: "200px",
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [quotes.length, limit]);

  return (
    <section className="relative" dir="rtl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:mb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="
              grid h-10 w-10 shrink-0 place-items-center
              rounded-xl
              bg-primary/10
              text-primary
              ring-1 ring-primary/15
            "
          >
            <Quote className="h-4.5 w-4.5" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-black text-foreground sm:text-base">
                تکه‌های کتاب
              </h2>

              {hasQuotes ? (
                <span
                  className="
                    inline-flex h-6 items-center
                    rounded-full
                    bg-foreground/[0.045]
                    px-2
                    text-[10px] font-bold
                    text-muted-foreground
                  "
                >
                  {quotes.length.toLocaleString("fa-IR")} تکه
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {initialHasMore ? (
          <Link
            href={`/${encodeURIComponent(username)}/quotes`}
            className="
              inline-flex h-8 items-center justify-center rounded-lg
              border border-border/50
              bg-background/20
              px-3
              text-[11px] font-bold
              text-muted-foreground
              transition-colors
              hover:border-primary/20
              hover:bg-primary/5
              hover:text-primary
              shrink-0
            "
          >
            مشاهده کامل
          </Link>
        ) : null}
      </div>

      {/* Content */}
      {!hasQuotes ? (
        <EmptyQuotesState isOwner={isOwner} />
      ) : (
        <div className="relative">
          <Carousel
            className="px-1 sm:px-2"
            ariaLabel="تکه‌های کتاب کاربر"
            slideClassName="
              w-[min(84vw,320px)]
              flex-none
              snap-start
              px-1
              md:w-auto
              sm:basis-1/2
              lg:basis-1/3
            "
            containerClassName="gap-3 sm:gap-4"
            slides={(() => {
              const carouselSlides = quotes.slice(0, limit).map((quote, index) => (
                <QuoteCard
                  key={quote.id}
                  quote={quote}
                  canLike={canLike}
                  background={quote.background}
                  priority={index === 0}
                />
              ));
              if (limit < quotes.length) {
                carouselSlides.push(
                  <div
                    ref={sentinelRef}
                    key="sentinel"
                    className="w-1 h-full shrink-0 flex items-center justify-center"
                  />
                );
              }
              return carouselSlides;
            })()}
          />
        </div>
      )}
    </section>
  );
}

function EmptyQuotesState({ isOwner }: { isOwner: boolean }) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-[1.5rem]
        border border-dashed border-border/65
        bg-card/35
        px-5 py-10
        text-center
      "
    >
      {/* subtle glow */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute left-1/2 top-0
          h-32 w-48
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-primary/[0.08]
          blur-3xl
        "
      />

      {/* tiny top highlight */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-16 top-0 h-px
          bg-gradient-to-r
          from-transparent via-primary/25 to-transparent
        "
      />

      <div className="relative">
        <span
          className="
            mx-auto grid h-12 w-12
            place-items-center
            rounded-2xl
            bg-primary/[0.08]
            text-primary
            ring-1 ring-primary/15
          "
        >
          <BookOpenText className="h-5 w-5" />
        </span>

        <p className="mt-4 text-sm font-black text-foreground">
          {isOwner ? "هنوز تکه‌ای منتشر نکرده‌ای" : "هنوز تکه‌ای منتشر نشده"}
        </p>

        <p
          className="
            mx-auto mt-1.5
            max-w-sm
            text-[11px] leading-6
            text-muted-foreground
          "
        >
          {isOwner
            ? "جمله یا بخشی از کتابی که دوستش داری منتشر کن؛ تکه‌ها اینجا جمع می‌شوند."
            : "این کاربر هنوز جمله یا بخشی از کتاب‌هایش را منتشر نکرده است."}
        </p>
      </div>
    </div>
  );
}

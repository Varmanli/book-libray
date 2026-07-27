"use client";

import { useEffect, useRef, useState } from "react";
import { Quote } from "lucide-react";

import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import QuoteCard from "@/components/profile/QuoteCard";
import { Carousel } from "@/components/ui/Carousel";
import type { HomeQuotePreview } from "@/lib/home/service";

export default function HomeQuotesSection({
  quotes,
  isLoggedIn,
}: {
  quotes: HomeQuotePreview[];
  isLoggedIn: boolean;
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
        rootMargin: "200px", // Preload next slides early when 200px close
      }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, [quotes.length, limit]);

  const carouselSlides = quotes.slice(0, limit).map((quote, index) => (
    <QuoteCard
      key={quote.id}
      quote={quote}
      canLike={isLoggedIn}
      showAuthor
      showBook
      background={quote.background}
      priority={index === 0} // Eager load only the first visible card
      className="
        min-h-[440px]
        w-full
        lg:min-h-[480px]
      "
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

  return (
    <section className="relative">
      <div className="mb-4 sm:mb-5">
        <HomeSectionHeader icon={Quote} title="تکه‌های تازه" />
      </div>

      {hasQuotes ? (
        <div className="relative">
          <Carousel
            ariaLabel="تازه‌ترین تکه‌های کتاب"
            className="px-1 py-1 sm:px-2"
            slideClassName="
              flex
              w-[min(82vw,300px)]
              flex-none
              px-1
              md:w-auto
              md:basis-1/2
              xl:basis-1/3
            "
            containerClassName="items-stretch gap-3 sm:gap-4 lg:gap-5"
            slides={carouselSlides}
          />
        </div>
      ) : (
        <EmptyQuotesState />
      )}
    </section>
  );
}

function EmptyQuotesState() {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-[1.5rem]
        border border-dashed border-border/65
        bg-card/30
        px-5 py-10
        text-center
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute left-1/2 top-0
          h-28 w-44
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-primary/[0.08]
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-20 top-0 h-px
          bg-gradient-to-r
          from-transparent via-primary/20 to-transparent
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
          <Quote className="h-5 w-5" />
        </span>

        <p className="mt-4 text-sm font-black text-foreground">
          هنوز تکه‌ای منتشر نشده
        </p>

        <p
          className="
            mx-auto mt-1.5
            max-w-sm
            text-[11px] leading-6
            text-muted-foreground
          "
        >
          وقتی کاربران جمله‌ها و بخش‌های مورد علاقه‌شان از کتاب‌ها را منتشر
          کنند، تازه‌ترین‌ها اینجا نمایش داده می‌شوند.
        </p>
      </div>
    </div>
  );
}

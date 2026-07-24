"use client";

import { useState } from "react";
import { BookOpenText, Loader2, Plus, Quote } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const [items, setItems] = useState(quotes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  const hasQuotes = items.length > 0;

  async function loadMore() {
    if (loading || !hasMore) return;

    setLoading(true);

    try {
      const response = await fetch(
        `/api/profile/${encodeURIComponent(
          username,
        )}/quotes?limit=10&offset=${items.length}`,
      );

      const data = await response.json();

      if (!response.ok || !Array.isArray(data.quotes)) {
        throw new Error();
      }

      setItems((current) => [
        ...current,
        ...data.quotes.filter(
          (item: PublicQuote) => !current.some((old) => old.id === item.id),
        ),
      ]);

      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative">
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
                  {items.length.toLocaleString("fa-IR")} تکه
                </span>
              ) : null}
            </div>
          </div>
        </div>
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
              basis-full
              px-1
              sm:basis-1/2
              lg:basis-1/3
            "
            containerClassName="gap-3 sm:gap-4"
            slides={items.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                canLike={canLike}
                background={quote.background}
              />
            ))}
          />
        </div>
      )}

      {/* Load more */}
      {hasMore ? (
        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void loadMore()}
            disabled={loading}
            className="
              h-9 rounded-full
              border border-border/60
              bg-background/30
              px-4
              text-xs font-bold
              text-muted-foreground
              transition-colors
              hover:border-primary/20
              hover:bg-primary/5
              hover:text-primary
            "
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            مشاهده بیشتر
          </Button>
        </div>
      ) : null}
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

        {isOwner ? (
          <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold text-primary/80">
            <Plus className="h-3.5 w-3.5" />
            اولین تکه را منتشر کن
          </div>
        ) : null}
      </div>
    </div>
  );
}

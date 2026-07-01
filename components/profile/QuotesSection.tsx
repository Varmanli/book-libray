import { BookOpenText, Quote } from "lucide-react";

import { Carousel } from "@/components/ui/Carousel";
import QuoteCard from "@/components/profile/QuoteCard";
import type { PublicQuote } from "@/lib/quotes/service";

export default function QuotesSection({
  quotes,
  isOwner,
  canLike,
}: {
  quotes: PublicQuote[];
  isOwner: boolean;
  canLike: boolean;
}) {
  const hasQuotes = quotes.length > 0;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/75 shadow-[0_22px_70px_-52px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-emerald-300/5 blur-3xl" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.13) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative overflow-hidden border-b border-border/70 px-5 py-5 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-primary/10 via-transparent to-transparent" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm shadow-black/5">
              <Quote className="h-5 w-5" />
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <h2 className="text-lg font-black text-foreground">
                  تکه‌های کتاب
                </h2>

                {hasQuotes ? (
                  <span className="rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-[11px] font-black text-muted-foreground backdrop-blur">
                    {quotes.length.toLocaleString("fa-IR")} تکه
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 py-5 sm:px-5">
        {!hasQuotes ? (
          <EmptyQuotesState isOwner={isOwner} />
        ) : (
          <div className="relative overflow-visible">
            <Carousel
              className="px-7 sm:px-9 lg:px-10"
              ariaLabel="تکه‌های کتاب کاربر"
              slideClassName="basis-full px-1 sm:basis-1/2 lg:basis-1/3"
              containerClassName="gap-3 sm:gap-4"
              slides={quotes.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} canLike={canLike} />
              ))}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyQuotesState({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-dashed border-border/80 bg-background/45 px-4 py-8 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%, transparent)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <BookOpenText className="h-6 w-6" />
        </div>

        <p className="mt-4 text-sm font-black text-foreground">
          {isOwner ? "هنوز تکه‌ای منتشر نکرده‌ای" : "هنوز تکه‌ای منتشر نشده"}
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-muted-foreground">
          {isOwner
            ? "وقتی از یک کتاب جمله یا بخشی منتشر کنی، اینجا نمایش داده می‌شود."
            : "این کاربر هنوز تکه‌ای از کتاب‌ها را عمومی نکرده است."}
        </p>
      </div>
    </div>
  );
}

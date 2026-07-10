"use client";

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
  return (
    <section>
      <HomeSectionHeader
        icon={Quote}
        eyebrow="تازه‌ترین نقل‌قول‌ها"
        title="تکه‌های تازه"
      />

      {quotes.length > 0 ? (
        <div className="relative">
          <Carousel
            ariaLabel="تازه‌ترین تکه‌های کتاب"
            className="py-1 ps-10 pe-10 sm:ps-11 sm:pe-11 lg:ps-12 lg:pe-12"
            slideClassName="flex basis-full md:basis-1/2 xl:basis-1/3"
            containerClassName="items-stretch gap-4 lg:gap-5"
            slides={quotes.map((quote) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                canLike={isLoggedIn}
                showAuthor
                showBook
                className="min-h-[460px] w-full lg:min-h-[500px]"
              />
            ))}
          />
        </div>
      ) : (
        <div className="rounded-[1.6rem] border border-dashed border-border bg-card/75 px-5 py-8 text-center text-sm leading-7 text-muted-foreground">
          هنوز تکه عمومی تازه‌ای برای نمایش در صفحه اصلی وجود ندارد.
        </div>
      )}
    </section>
  );
}

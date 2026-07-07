import Link from "next/link";
import { BookMarked } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { Carousel } from "@/components/ui/Carousel";
import { getPublicBookHref } from "@/lib/book/public-href";
import type { HomeBookCard } from "@/lib/home/service";

const PLACEHOLDER_COVER = "/placeholder-cover.svg";

const STATUS_LABELS: Record<string, string> = {
  UNREAD: "خوانده‌نشده",
  READING: "در حال خواندن",
  FINISHED: "خوانده‌شده",
};

function BookCard({ book }: { book: HomeBookCard }) {
  const meta = book.genre || (book.status ? STATUS_LABELS[book.status] : null);
  const href = getPublicBookHref(book);

  if (!href) return null;

  return (
    <Link
      href={href}
      className="group block rounded-[1.55rem] border border-border/75 bg-card/90 p-3 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:border-primary/25"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-secondary">
        <BookCoverImage
          src={book.coverImage || PLACEHOLDER_COVER}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 200px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="px-1 pb-1 pt-4">
        <h3 className="line-clamp-1 text-sm font-black text-foreground">
          {book.title}
        </h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {book.author}
        </p>

        {meta ? (
          <span className="mt-3 inline-flex rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

export default function HomeBookCarousel({
  books,
  isFallback = false,
}: {
  books: HomeBookCard[];
  isFallback?: boolean;
}) {
  return (
    <section className="rounded-[2rem] border border-border/65 bg-secondary/25 px-4 py-6 sm:px-6 sm:py-7">
      <HomeSectionHeader
        icon={BookMarked}
        eyebrow={isFallback ? "تازه‌ترین‌ها" : "انتخاب سردبیر"}
        title="کتاب‌های پیشنهادی"
      />

      {books.length > 0 ? (
        <Carousel
          ariaLabel="کتاب‌های پیشنهادی"
          slideClassName="basis-[165px] sm:basis-[200px] lg:basis-[220px]"
          containerClassName="gap-4"
          slides={books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        />
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-border bg-card/75 px-5 py-8 text-center text-sm leading-7 text-muted-foreground">
          هنوز کتاب عمومی کافی برای پیشنهاد در صفحه اصلی ثبت نشده است.
        </div>
      )}
    </section>
  );
}

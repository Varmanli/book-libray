import Link from "next/link";
import { BookMarked } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { Carousel } from "@/components/ui/Carousel";
import { getPublicBookHref } from "@/lib/book/public-href";
import { resolveBookPresentation } from "@/lib/book/presentation";
import type { HomeBookCard } from "@/lib/home/service";

const PLACEHOLDER_COVER = "/placeholder-cover.svg";

function BookCard({ book }: { book: HomeBookCard }) {
  const presentation = resolveBookPresentation(book, book.displayEdition);
  const href = getPublicBookHref({
    ...book,
    editionId: presentation.linkEditionId,
  });

  if (!href) return null;

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-[1.55rem] border border-border/75 bg-card/90 p-3 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_28px_65px_-40px_rgba(0,0,0,0.45)]"
    >
      <div className="relative aspect-[5/8] overflow-hidden rounded-[1.25rem] bg-secondary/80">
        <BookCoverImage
          src={presentation.coverImage || PLACEHOLDER_COVER}
          alt={presentation.title}
          fill
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 220px"
          className="object-contain transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="flex min-h-[5.75rem] flex-1 flex-col px-1 pb-1 pt-4">
        <h3 className="line-clamp-2 min-h-10 text-sm font-black leading-5 text-foreground">
          {presentation.title}
        </h3>
        <p className="mt-2 line-clamp-1 text-sm leading-5 text-muted-foreground">
          {book.author}
        </p>
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
      <HomeSectionHeader icon={BookMarked} title="کتاب‌های پیشنهادی" />

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

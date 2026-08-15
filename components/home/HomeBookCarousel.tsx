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
      className="group flex h-full flex-col rounded-2xl border border-border/40 bg-card/45 p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card/75 hover:shadow-md"
    >
      <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-xl bg-secondary/20 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.25)] transition-all duration-300 group-hover:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.35)]">
        <BookCoverImage
          src={presentation.coverImage || PLACEHOLDER_COVER}
          alt={presentation.title}
          fill
          sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3 text-right">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-black leading-6 text-foreground transition-colors duration-200 group-hover:text-primary">
          {presentation.title}
        </h3>
        <p className="mt-1.5 line-clamp-1 text-xs font-medium text-muted-foreground/85">
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
  if (!books.length) return null;
  return (
    <section className="relative">
      <div className="mb-4 sm:mb-5">
        <HomeSectionHeader
          icon={BookMarked}
          title="کتاب های پیشنهادی"
          href="/books"
        />
      </div>

      <Carousel
        ariaLabel="کتاب‌های پیشنهادی"
        slideClassName="basis-[145px] sm:basis-[175px] lg:basis-[195px]"
        containerClassName="gap-4"
        slides={books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      />
    </section>
  );
}

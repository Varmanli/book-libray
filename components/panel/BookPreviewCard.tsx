"use client";

import Link from "next/link";
import { Star } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import { getPublicBookHref } from "@/lib/book/public-href";
import { cn } from "@/lib/utils";

export default function BookPreviewCard({
  book,
  compact = false,
}: {
  book: {
    id: string;
    slug?: string | null;
    title: string;
    author: string;
    coverImage: string | null;
    rating?: number | null;
    status?: string;
  };
  compact?: boolean;
}) {
  const href = getPublicBookHref(book) ?? `/book/${encodeURIComponent(book.id)}`;

  return (
    <Link
      href={href}
      className={cn(
        "group flex gap-3 overflow-hidden rounded-2xl border border-border/70 bg-card/50 transition hover:border-primary/30 hover:bg-card/70",
        compact ? "p-2.5" : "p-3"
      )}
    >
      <div className="relative aspect-[2/3] w-14 shrink-0 overflow-hidden rounded-lg bg-muted sm:w-16">
        <BookCoverImage
          src={book.coverImage}
          alt={book.title}
          fill
          className="object-cover transition group-hover:scale-[1.03]"
          sizes="64px"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground transition-colors group-hover:text-primary">
          {book.title}
        </h3>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
          {book.status ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
              {book.status}
            </span>
          ) : null}
          {book.rating ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 text-amber-600 dark:text-amber-300">
              <Star className="h-3 w-3 fill-current" />
              {book.rating}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

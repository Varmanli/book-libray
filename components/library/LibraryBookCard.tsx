"use client";

import Link from "next/link";
import { BookOpen, Heart, Pencil, RefreshCw, Star, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import BookCoverImage from "@/components/books/BookCoverImage";
import { getPublicBookHref } from "@/lib/book/public-href";
import { cn } from "@/lib/utils";
import type { LibraryBook } from "@/lib/library/service";

const STATUS_LABELS: Record<LibraryBook["status"], string> = {
  UNREAD: "خوانده‌نشده",
  READING: "درحال خواندن",
  PAUSED: "متوقف‌شده",
  FINISHED: "خوانده‌شده",
};

const STATUS_STYLES: Record<LibraryBook["status"], string> = {
  UNREAD: "bg-background/80 text-muted-foreground ring-border",
  READING: "bg-primary/15 text-primary ring-primary/25",
  PAUSED: "bg-amber-500/15 text-amber-700 ring-amber-500/25 dark:text-amber-300",
  FINISHED:
    "bg-emerald-500/15 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300",
};

export default function LibraryBookCard({
  book,
  canManage,
  onCycleStatus,
  onDelete,
}: {
  book: LibraryBook;
  canManage: boolean;
  onCycleStatus?: (book: LibraryBook) => void;
  onDelete?: (book: LibraryBook) => void;
}) {
  const bookHref =
    getPublicBookHref(book) ?? `/book/${encodeURIComponent(book.id)}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <Link href={bookHref} className="block">
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <BookCoverImage
            src={book.coverImage}
            alt={book.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 18vw"
          />

          <span
            className={cn(
              "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 backdrop-blur-sm",
              STATUS_STYLES[book.status]
            )}
          >
            {STATUS_LABELS[book.status]}
          </span>

          {book.isFavorite ? (
            <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/85 text-white">
              <Heart className="h-3 w-3 fill-current" />
            </span>
          ) : null}

          {book.rating ? (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-amber-200 backdrop-blur-sm">
              <Star className="h-3 w-3 fill-current" />
              {book.rating}
            </span>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link href={bookHref} className="block">
          <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-foreground transition-colors group-hover:text-primary">
            {book.title}
          </h3>
        </Link>
        <p className="line-clamp-1 text-xs text-muted-foreground">{book.author}</p>

        {canManage ? (
          <div className="mt-auto flex items-center gap-1.5 pt-2.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onCycleStatus?.(book)}
              className="h-8 flex-1 gap-1.5 rounded-lg px-2 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              وضعیت
            </Button>
            <Button
              asChild
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <Link href={`/books/edit/${book.id}`} aria-label={`ویرایش ${book.title}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onDelete?.(book)}
              className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label={`حذف ${book.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

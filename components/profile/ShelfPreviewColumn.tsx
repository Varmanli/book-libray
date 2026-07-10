import Link from "next/link";
import { ArrowUpLeft, Library } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder-cover.svg";

export interface ShelfBook {
  id: string;
  title: string;
  coverImage: string | null;
}

export default function ShelfPreviewColumn({
  title,
  count,
  books,
  href,
  accentClassName = "text-primary",
}: {
  title: string;
  count: number;
  books: ShelfBook[];
  href: string;
  accentClassName?: string;
}) {
  const covers = books.slice(0, 4);
  const emptySlots = Math.max(0, 4 - covers.length);

  return (
    <Link
      href={href}
      aria-label={`${title} (${count})`}
      className="group relative flex min-h-[210px] flex-col overflow-hidden rounded-[1.55rem] border border-border/80 bg-background/45 p-4 shadow-[0_18px_55px_-44px_rgba(0,0,0,0.42)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-background/60"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-black text-foreground">
            {title}
          </h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            مشاهده کتاب‌ها
          </p>
        </div>

        <span
          className={cn(
            "inline-flex min-w-8 shrink-0 items-center justify-center rounded-full border border-border/80 bg-card/70 px-2.5 py-1 text-[11px] font-black tabular-nums shadow-sm",
            accentClassName,
          )}
        >
          {count.toLocaleString("fa-IR")}
        </span>
      </div>

      <div className="relative mt-4 grid flex-1 grid-cols-2 gap-2.5">
        {covers.length === 0 ? (
          <EmptyShelf />
        ) : (
          <>
            {covers.map((book, index) => (
              <span
                key={book.id}
                className={cn(
                  "relative aspect-[3/4] overflow-hidden rounded-xl border border-border/80 bg-white/[0.04] shadow-[0_16px_34px_-22px_rgba(0,0,0,0.95)] ring-1 ring-black/20 transition-transform duration-300 group-hover:-translate-y-0.5",
                  "bg-card/85 shadow-[0_16px_34px_-22px_rgba(0,0,0,0.35)]",
                  index % 2 === 1 && "group-hover:-translate-y-1",
                )}
              >
                <BookCoverImage
                  src={book.coverImage || PLACEHOLDER}
                  alt={book.title}
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />

                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-white/10" />
                <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
              </span>
            ))}

            {Array.from({ length: emptySlots }).map((_, index) => (
              <span
                key={`empty-${index}`}
                aria-hidden="true"
                className="relative aspect-[3/4] overflow-hidden rounded-xl border border-dashed border-border/70 bg-white/[0.025]"
              >
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:14px_14px]" />
              </span>
            ))}
          </>
        )}
      </div>

      <div className="relative mt-3 flex items-center justify-between border-t border-border/70 pt-3">
        <span className="text-[11px] font-bold text-muted-foreground">
          ورود به قفسه
        </span>

        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15 transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
          <ArrowUpLeft className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

function EmptyShelf() {
  return (
    <div className="col-span-2 flex min-h-[126px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 bg-background/45 px-3 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] text-muted-foreground ring-1 ring-white/[0.08]">
        <Library className="h-4 w-4" />
      </span>

      <span className="text-[11px] font-bold text-muted-foreground">
        هنوز کتابی نیست
      </span>
    </div>
  );
}

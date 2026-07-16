import { BookOpen, LibraryBig } from "lucide-react";

import ShelfPreviewColumn, {
  type ShelfBook,
} from "@/components/profile/ShelfPreviewColumn";
import type { ReadingStats } from "@/lib/profile/service";

interface ShowcaseBook extends ShelfBook {
  status: string;
}

/**
 * Compact 3-column library preview:
 * خوانده‌شده / خوانده‌نشده / درحال خواندن.
 */
export default function LibraryShowcase({
  books,
  username,
  stats,
}: {
  books: ShowcaseBook[];
  username: string;
  stats: ReadingStats;
}) {
  const getBooksByStatus = (status: string) =>
    books.filter((book) => book.status === status);

  const unread = Math.max(stats.total - stats.reading - stats.finished, 0);

  const getHref = (filter: string) => `/books/${username}?filter=${filter}`;

  return (
    <section
      className="
        relative
        min-w-0
        overflow-hidden
        rounded-[2rem]
        border
        border-border/80
        bg-card/75
        p-2.5
        sm:p-5
        shadow-[0_22px_70px_-50px_rgba(0,0,0,0.42)]
      "
    >
      {/* top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />

      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

      {/* pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.13) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative min-w-0">
        {/* Header */}
        <div
          className="
            flex
            min-w-0
            items-center
            justify-between
            gap-2
          "
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-primary/10
                text-primary
                ring-1
                ring-primary/20
                sm:h-11
                sm:w-11
                sm:rounded-2xl
              "
            >
              <LibraryBig className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>

            <h2 className="truncate text-base font-black text-foreground sm:text-lg">
              کتابخانه
            </h2>
          </div>

          <div
            className="
              flex
              shrink-0
              items-center
              gap-1.5
              rounded-xl
              border
              border-border/80
              bg-background/60
              px-2
              py-1.5
              text-[10px]
              font-bold
              text-muted-foreground
              backdrop-blur
              sm:gap-2
              sm:rounded-2xl
              sm:px-3
              sm:py-2
              sm:text-xs
            "
          >
            <BookOpen className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />

            <span>{stats.total.toLocaleString("fa-IR")} کتاب</span>
          </div>
        </div>

        {/* Shelves */}
        <div
          className="
            relative
            mt-3
            grid
            min-w-0
            grid-cols-3
            gap-1.5
            sm:mt-5
            sm:gap-3
          "
        >
          <div className="min-w-0 overflow-hidden">
            <ShelfPreviewColumn
              title="خوانده‌شده"
              count={stats.finished}
              books={getBooksByStatus("FINISHED")}
              href={getHref("FINISHED")}
              accentClassName="text-lime-300"
            />
          </div>

          <div className="min-w-0 overflow-hidden">
            <ShelfPreviewColumn
              title="خوانده‌نشده"
              count={unread}
              books={getBooksByStatus("UNREAD")}
              href={getHref("UNREAD")}
              accentClassName="text-foreground"
            />
          </div>

          <div className="min-w-0 overflow-hidden">
            <ShelfPreviewColumn
              title="درحال خواندن"
              count={stats.reading}
              books={getBooksByStatus("READING")}
              href={getHref("READING")}
              accentClassName="text-sky-300"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

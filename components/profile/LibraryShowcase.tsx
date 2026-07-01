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
  const byStatus = (status: string) =>
    books.filter((book) => book.status === status);
  const unread = Math.max(stats.total - stats.reading - stats.finished, 0);
  const href = (filter: string) => `/books/${username}?filter=${filter}`;

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/75 p-5 shadow-[0_22px_70px_-50px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.13) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <LibraryBig className="h-5 w-5" />
          </span>

          <div>
            <h2 className="text-lg font-black text-foreground">کتابخانه</h2>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-background/60 px-3 py-2 text-xs font-bold text-muted-foreground backdrop-blur">
          <BookOpen className="h-4 w-4 text-primary" />
          <span>{stats.total.toLocaleString("fa-IR")} کتاب</span>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ShelfPreviewColumn
          title="خوانده‌شده"
          count={stats.finished}
          books={byStatus("FINISHED")}
          href={href("FINISHED")}
          accentClassName="text-lime-300"
        />

        <ShelfPreviewColumn
          title="خوانده‌نشده"
          count={unread}
          books={byStatus("UNREAD")}
          href={href("UNREAD")}
          accentClassName="text-foreground"
        />

        <ShelfPreviewColumn
          title="درحال خواندن"
          count={stats.reading}
          books={byStatus("READING")}
          href={href("READING")}
          accentClassName="text-sky-300"
        />
      </div>
    </section>
  );
}

import { ListChecks } from "lucide-react";

import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import type { HomeReadingListPreview } from "@/lib/home/service";

export default function HomeReadingListsPreview({
  lists,
}: {
  lists: HomeReadingListPreview[];
}) {
  return (
    <section>
      <HomeSectionHeader
        icon={ListChecks}
        eyebrow="برای توسعه بعدی"
        title="لیست‌های کتاب"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {lists.map((list) => (
          <article
            key={list.id}
            className="rounded-[1.7rem] border border-border/75 bg-card/90 p-5 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.35)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                  {list.mood}
                </span>
                <h3 className="mt-3 text-lg font-black tracking-tight text-foreground">
                  {list.title}
                </h3>
              </div>
              <span className="rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-bold text-primary">
                به‌زودی
              </span>
            </div>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {list.description}
            </p>

            <div className="mt-5 space-y-2">
              {list.books.map((book, index) => (
                <div
                  key={book}
                  className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-background/60 px-3 py-2 text-sm text-foreground"
                >
                  <span>{book}</span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {(index + 1).toLocaleString("fa-IR")}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

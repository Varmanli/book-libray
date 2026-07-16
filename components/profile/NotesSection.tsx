"use client";
import { useState } from "react";
import { Loader2, MessageSquareText, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";

import NoteCard from "@/components/profile/NoteCard";
import type { PublicNote } from "@/lib/notes/service";

/** "یادداشت‌ها" — published book notes. One-column premium list. */
export default function NotesSection({
  notes,
  isOwner,
  canLike = false,
  username,
  initialHasMore,
}: {
  notes: PublicNote[];
  isOwner: boolean;
  canLike?: boolean;
  username: string;
  initialHasMore: boolean;
}) {
  const [items, setItems] = useState(notes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const hasNotes = items.length > 0;
  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/profile/${encodeURIComponent(username)}/notes?limit=10&offset=${items.length}`);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.notes)) throw new Error();
      setItems((current) => [...current, ...data.notes.filter((item: PublicNote) => !current.some((old) => old.id === item.id))]);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/75 shadow-[0_22px_70px_-52px_rgba(0,0,0,0.42)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-sky-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.13) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative overflow-hidden border-b border-border/70 px-5 py-5 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-sky-400/10 via-transparent to-transparent" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20 shadow-sm shadow-black/5">
              <NotebookPen className="h-5 w-5" />
            </span>

            <div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <h2 className="text-lg font-black text-foreground">
                  یادداشت‌ها
                </h2>

                {hasNotes ? (
                  <span className="rounded-full border border-border/70 bg-background/50 px-2.5 py-1 text-[11px] font-black text-muted-foreground backdrop-blur">
                    {items.length.toLocaleString("fa-IR")} یادداشت
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-4 py-5 sm:px-5">
        {!hasNotes ? (
          <EmptyNotesState isOwner={isOwner} />
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                canLike={canLike}
                showAuthor={false}
                showBook
              />
            ))}
            {hasMore ? <Button type="button" variant="outline" onClick={() => void loadMore()} disabled={loading} className="mx-auto mt-1 rounded-xl">{loading && <Loader2 className="h-4 w-4 animate-spin" />}مشاهده بیشتر</Button> : null}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptyNotesState({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-dashed border-border/80 bg-background/45 px-4 py-8 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%, transparent)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20">
          <MessageSquareText className="h-6 w-6" />
        </div>

        <p className="mt-4 text-sm font-black text-foreground">
          {isOwner ? "هنوز یادداشتی منتشر نکرده‌ای" : "یادداشتی منتشر نشده"}
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-muted-foreground">
          {isOwner
            ? "وقتی درباره یک کتاب یادداشت عمومی منتشر کنی، اینجا نمایش داده می‌شود."
            : "این کاربر هنوز یادداشتی را به‌صورت عمومی منتشر نکرده است."}
        </p>
      </div>
    </div>
  );
}

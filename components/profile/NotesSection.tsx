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
      const response = await fetch(
        `/api/profile/${encodeURIComponent(
          username,
        )}/notes?limit=10&offset=${items.length}`,
      );

      const data = await response.json();

      if (!response.ok || !Array.isArray(data.notes)) {
        throw new Error();
      }

      setItems((current) => [
        ...current,
        ...data.notes.filter(
          (item: PublicNote) => !current.some((old) => old.id === item.id),
        ),
      ]);

      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3 px-1 sm:mb-5">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="
              grid h-10 w-10 shrink-0 place-items-center
              rounded-xl
              bg-primary/10
              text-primary
              ring-1 ring-primary/15
            "
          >
            <NotebookPen className="h-4.5 w-4.5" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-black text-foreground sm:text-base">
                یادداشت‌ها
              </h2>

              {hasNotes ? (
                <span
                  className="
                    inline-flex h-6 items-center
                    rounded-full
                    bg-foreground/[0.045]
                    px-2
                    text-[10px] font-bold
                    text-muted-foreground
                  "
                >
                  {items.length.toLocaleString("fa-IR")} یادداشت
                </span>
              ) : null}
            </div>

            <p className="mt-0.5 text-[10px] leading-5 text-muted-foreground sm:text-[11px]">
              نوشته‌ها و برداشت‌ها درباره کتاب‌ها
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
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
        </div>
      )}

      {/* Load more */}
      {hasMore ? (
        <div className="mt-5 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void loadMore()}
            disabled={loading}
            className="
              h-9 rounded-full
              border border-border/60
              bg-background/30
              px-4
              text-xs font-bold
              text-muted-foreground
              transition-colors
              hover:border-primary/20
              hover:bg-primary/5
              hover:text-primary
            "
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            مشاهده بیشتر
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function EmptyNotesState({ isOwner }: { isOwner: boolean }) {
  return (
    <div
      className="
        relative overflow-hidden
        rounded-[1.5rem]
        border border-dashed border-border/65
        bg-card/35
        px-5 py-10
        text-center
      "
    >
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute left-1/2 top-0
          h-32 w-48
          -translate-x-1/2 -translate-y-1/2
          rounded-full
          bg-primary/[0.08]
          blur-3xl
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-x-16 top-0 h-px
          bg-gradient-to-r
          from-transparent via-primary/25 to-transparent
        "
      />

      <div className="relative">
        <span
          className="
            mx-auto grid h-12 w-12
            place-items-center
            rounded-2xl
            bg-primary/[0.08]
            text-primary
            ring-1 ring-primary/15
          "
        >
          <MessageSquareText className="h-5 w-5" />
        </span>

        <p className="mt-4 text-sm font-black text-foreground">
          {isOwner ? "هنوز یادداشتی منتشر نکرده‌ای" : "یادداشتی منتشر نشده"}
        </p>

        <p
          className="
            mx-auto mt-1.5
            max-w-sm
            text-[11px] leading-6
            text-muted-foreground
          "
        >
          {isOwner
            ? "برداشت، نظر یا نوشته‌ای درباره کتابی که خوانده‌ای منتشر کن؛ یادداشت‌ها اینجا جمع می‌شوند."
            : "این کاربر هنوز یادداشتی درباره کتاب‌ها منتشر نکرده است."}
        </p>
      </div>
    </div>
  );
}

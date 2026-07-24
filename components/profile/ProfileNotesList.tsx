"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import NoteCard from "@/components/profile/NoteCard";
import type { PublicNote } from "@/lib/notes/service";

export default function ProfileNotesList({
  initialNotes,
  initialHasMore,
  username,
  canLike,
}: {
  initialNotes: PublicNote[];
  initialHasMore: boolean;
  username: string;
  canLike: boolean;
}) {
  const [items, setItems] = useState(initialNotes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/profile/${encodeURIComponent(username)}/notes?limit=10&offset=${items.length}`,
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
    } catch {
      // Ignore / handle error silently
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        هنوز یادداشتی منتشر نشده است.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8" dir="rtl">
      {/* List style layout for NoteCards */}
      <div className="flex flex-col gap-6">
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

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void loadMore()}
            disabled={loading}
            className="h-10 rounded-full border border-border/60 bg-background/30 px-6 text-xs font-bold text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-primary gap-2 cursor-pointer transition-colors"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            مشاهده بیشتر
          </Button>
        </div>
      )}
    </div>
  );
}

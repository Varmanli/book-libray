"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuoteCard from "@/components/profile/QuoteCard";
import type { PublicQuote } from "@/lib/quotes/service";

export default function ProfileQuotesList({
  initialQuotes,
  initialHasMore,
  username,
  canLike,
}: {
  initialQuotes: PublicQuote[];
  initialHasMore: boolean;
  username: string;
  canLike: boolean;
}) {
  const [items, setItems] = useState(initialQuotes);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const response = await fetch(
        `/api/profile/${encodeURIComponent(username)}/quotes?limit=12&offset=${items.length}`,
      );
      const data = await response.json();
      if (!response.ok || !Array.isArray(data.quotes)) {
        throw new Error();
      }

      setItems((current) => [
        ...current,
        ...data.quotes.filter(
          (item: PublicQuote) => !current.some((old) => old.id === item.id),
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
        هنوز تکه‌ای منتشر نشده است.
      </div>
    );
  }

  return (
    <div className="space-y-8" dir="rtl">
      {/* Responsive multi-column grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            canLike={canLike}
            background={quote.background}
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

"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Plus, BookOpen, PenLine } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AddToLibraryDialog } from "@/components/catalog/AddToLibraryDialog";
import {
  type CatalogEdition,
  type CatalogResult,
} from "@/components/catalog/types";

interface CatalogSearchProps {
  onManualFallback: () => void;
  initialQuery?: string;
}

export function CatalogSearch({
  onManualFallback,
  initialQuery = "",
}: CatalogSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<CatalogResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [selected, setSelected] = useState<{
    book: CatalogResult;
    edition: CatalogEdition;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/catalog/search?q=${encodeURIComponent(q)}`,
          { credentials: "include", signal: controller.signal }
        );
        const data = await res.json();
        setResults(data.results || []);
        setSearched(true);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setResults([]);
          setSearched(true);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const openAdd = (book: CatalogResult, edition: CatalogEdition) => {
    setSelected({ book, edition });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* نوار جست‌وجو */}
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جست‌وجو با عنوان، نویسنده، مترجم، ناشر یا شابک..."
          aria-label="جست‌وجوی کتاب در کاتالوگ"
          className="h-12 rounded-xl pr-11 text-base"
          autoFocus
        />
        {loading && (
          <Loader2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>

      {/* حالت اولیه (هنوز جست‌وجو نشده) */}
      {!searched && query.trim().length < 2 && (
        <div className="rounded-2xl border border-dashed border-border bg-black/20 px-6 py-12 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
            <BookOpen className="h-7 w-7" />
          </span>
          <h3 className="text-base font-semibold text-foreground">
            کتابت را در کاتالوگ پیدا کن
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
            اول جست‌وجو کن؛ اگر کتاب از قبل روی قفسه وجود داشته باشد، با یک کلیک به
            کتابخانه‌ات اضافه می‌شود.
          </p>
        </div>
      )}

      {/* نتایج */}
      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((book) => (
            <li
              key={book.id}
              className="overflow-hidden rounded-2xl border border-border bg-card/60 transition-colors hover:border-border"
            >
              <div className="flex gap-4 p-4">
                <div className="h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-muted shadow">
                  {book.editions[0]?.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.editions[0].coverImage}
                      alt={book.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                      <BookOpen className="h-7 w-7" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground">{book.title}</h3>
                  <p className="text-sm text-muted-foreground">{book.author}</p>
                  {book.genre && (
                    <span className="mt-2 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                      {book.genre}
                    </span>
                  )}

                  {/* نسخه‌ها */}
                  <div className="mt-3 space-y-2">
                    {book.editions.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        نسخه‌ای ثبت نشده است.
                      </p>
                    )}
                    {book.editions.map((ed) => {
                      const meta = [
                        ed.translator && `ترجمه‌ی ${ed.translator}`,
                        ed.publisher,
                        ed.editionLabel,
                        ed.publishedYear ? String(ed.publishedYear) : null,
                      ].filter(Boolean);
                      return (
                        <div
                          key={ed.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-black/20 px-3 py-2"
                        >
                          <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                            {meta.length > 0 ? meta.join(" · ") : "نسخه‌ی استاندارد"}
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => openAdd(book, ed)}
                            className="shrink-0 gap-1.5"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            افزودن
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* بدون نتیجه */}
      {searched && !loading && results.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-black/20 px-6 py-10 text-center">
          <h3 className="text-base font-semibold text-foreground">
            کتابی پیدا نشد
          </h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
            «{query.trim()}» در کاتالوگ نبود. می‌توانی آن را به‌صورت دستی بسازی تا
            هم به کتابخانه‌ات اضافه شود و هم برای بقیه در دسترس باشد.
          </p>
          <Button type="button" onClick={onManualFallback} className="mt-5 gap-2">
            <PenLine className="h-4 w-4" />
            ساخت دستی این کتاب
          </Button>
        </div>
      )}

      {/* CTA همیشگیِ ساخت دستی */}
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border pt-5 text-center text-sm text-muted-foreground">
        <span>کتابت را پیدا نکردی؟</span>
        <button
          type="button"
          onClick={onManualFallback}
          className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
        >
          <PenLine className="h-4 w-4" />
          ساخت دستی کتاب
        </button>
      </div>

      <AddToLibraryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        book={selected?.book ?? null}
        edition={selected?.edition ?? null}
      />
    </div>
  );
}

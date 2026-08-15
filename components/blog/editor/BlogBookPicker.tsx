"use client";

import { useEffect, useState } from "react";
import { BookOpen, Loader2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type BlogBookPickerResult = {
  id: string;
  title: string;
  originalTitle: string | null;
  author: string;
  coverImage: string | null;
  publisher: string | null;
  translator: string | null;
};

export function BlogBookPicker({ open, onOpenChange, onPick }: { open: boolean; onOpenChange: (open: boolean) => void; onPick: (book: BlogBookPickerResult) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BlogBookPickerResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/admin/home/books?q=${encodeURIComponent(q)}`, { credentials: "include", signal: controller.signal })
        .then(async (response) => response.ok ? (await response.json()) as { results?: BlogBookPickerResult[] } : { results: [] })
        .then((data) => setResults(data.results ?? []))
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [open, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-h-[80vh] overflow-y-auto rounded-3xl p-5 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>افزودن کتاب</DialogTitle>
          <DialogDescription>نام کتاب، نویسنده، مترجم یا عنوان اصلی را جست‌وجو کنید.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="جست‌وجوی کتاب…" className="h-10 pr-9" />
        </div>
        <div className="min-h-24 space-y-2">
          {loading ? <p className="flex items-center gap-2 py-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال جست‌وجو…</p> : null}
          {!loading && query.trim() && !results.length ? <p className="py-5 text-sm text-muted-foreground">کتابی پیدا نشد.</p> : null}
          {!query.trim() ? <p className="py-5 text-sm text-muted-foreground">برای شروع، نام کتاب یا نویسنده را وارد کنید.</p> : null}
          {results.map((book) => (
            <Button key={book.id} type="button" variant="ghost" onClick={() => { onPick(book); onOpenChange(false); setQuery(""); }} className="h-auto w-full justify-start gap-3 rounded-2xl border border-border p-2 text-right hover:bg-muted/70">
              {book.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={book.coverImage} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
              ) : <span className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><BookOpen className="h-4 w-4" /></span>}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-foreground">{book.title}</span>
                <span className="block truncate text-xs font-normal text-muted-foreground">{book.author}</span>
                {book.translator || book.publisher ? <span className="block truncate text-[11px] font-normal text-muted-foreground/85">{[book.translator ? `ترجمه: ${book.translator}` : null, book.publisher].filter(Boolean).join(" · ")}</span> : null}
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

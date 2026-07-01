"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPublicBookHref } from "@/lib/book/public-href";
import { cn } from "@/lib/utils";
import type { ReferenceBookCard } from "@/lib/reference/public-service";

type SortKey = "NEWEST" | "TITLE" | "RATING";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "NEWEST", label: "جدیدترین" },
  { key: "TITLE", label: "عنوان" },
  { key: "RATING", label: "امتیاز" },
];

export default function ReferenceBookGrid({
  books,
  subduedAuthor = false,
}: {
  books: ReferenceBookCard[];
  subduedAuthor?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("NEWEST");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = books.filter((book) => {
      if (!q) return true;
      return [book.title, book.author, book.translator, book.publisher]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(q));
    });
    return result.sort((a, b) => {
      if (sortBy === "TITLE") return a.title.localeCompare(b.title, "fa");
      if (sortBy === "RATING") return (b.rating ?? -1) - (a.rating ?? -1);
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [books, query, sortBy]);

  const canReset = query.trim() !== "" || sortBy !== "NEWEST";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="جست‌وجو در کتاب‌ها"
            className="h-14 w-full rounded-[1.8rem] border border-border/70 bg-card/70 pr-12 pl-4 text-sm text-foreground shadow-[0_24px_80px_-60px_rgba(0,0,0,0.7)] outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15 sm:text-base"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-black text-foreground">کتاب‌ها</h2>
            <span className="text-xs text-muted-foreground">
              {filtered.length.toLocaleString("fa-IR")} کتاب
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortKey)}
              className="h-10 rounded-2xl border border-border/70 bg-card/70 px-4 text-sm text-foreground outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15"
            >
              {SORTS.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>

            {canReset ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setQuery("");
                  setSortBy("NEWEST");
                }}
                className="h-10 rounded-2xl px-3 text-sm text-muted-foreground hover:text-foreground"
              >
                پاک کردن
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-w-0">
        {filtered.length === 0 ? (
          <div className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/50 px-6 py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-background/70 text-muted-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {books.length === 0
                ? "هنوز کتابی برای این مورد ثبت نشده."
                : "کتابی با این جست‌وجو پیدا نشد."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((book) => (
              <ReferenceCard
                key={book.id}
                book={book}
                subduedAuthor={subduedAuthor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReferenceCard({
  book,
  subduedAuthor,
}: {
  book: ReferenceBookCard;
  subduedAuthor: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const href = getPublicBookHref(book);
  const coverSrc =
    book.coverImage && !imgError ? book.coverImage : "/placeholder-cover.svg";

  if (!href) return null;

  return (
    <Link
      href={href}
      className="group block rounded-[1.55rem] border border-border/70 bg-card/55 p-3 shadow-[0_20px_70px_-58px_rgba(0,0,0,0.75)] transition hover:border-primary/20 hover:bg-card/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-emerald-950/35 via-background to-muted">
        <Image
          src={coverSrc}
          alt={book.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.025]"
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 29vw, (max-width: 1400px) 18vw, 14vw"
          onError={() => setImgError(true)}
        />
      </div>

      <div className="space-y-1.5 px-1 pt-3 text-right">
        <h3 className="line-clamp-2 text-sm font-black leading-6 text-foreground transition-colors group-hover:text-primary sm:text-[0.95rem]">
          {book.title}
        </h3>

        {!subduedAuthor ? (
          <p className="line-clamp-1 text-sm text-muted-foreground">
            {book.author}
          </p>
        ) : (
          <p className="line-clamp-1 text-xs text-muted-foreground/65">
            {book.author}
          </p>
        )}

        {book.rating !== null ? (
          <p className="text-xs font-bold text-muted-foreground">
            امتیاز: {book.rating.toLocaleString("fa-IR")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

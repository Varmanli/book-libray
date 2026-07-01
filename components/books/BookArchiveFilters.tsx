"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import BookArchiveFilterDrawer from "@/components/books/BookArchiveFilterDrawer";
import BookArchiveFiltersPanel from "@/components/books/BookArchiveFiltersPanel";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_BOOK_ARCHIVE_FILTERS,
  hasActiveBookArchiveFilters,
  toBookArchiveSearchParams,
  type BookArchiveFilterOptions,
  type BookArchiveFilters,
} from "@/lib/book/archive-search";
import { getPublicBookHref } from "@/lib/book/public-href";
import type {
  BookArchiveItem,
  BookArchiveResult,
} from "@/lib/book/archive-service";
import { FiStar } from "react-icons/fi";

function bookHref(book: BookArchiveItem) {
  return getPublicBookHref(book);
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/15"
    >
      <span>{label}</span>
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function ActiveFilters({
  filters,
  onPatch,
}: {
  filters: BookArchiveFilters;
  onPatch: (patch: Partial<BookArchiveFilters>) => void;
}) {
  const chips = [
    filters.q ? { label: `جست‌وجو: ${filters.q}`, patch: { q: "" } } : null,
    filters.genre
      ? { label: `ژانر: ${filters.genre}`, patch: { genre: "" } }
      : null,
    filters.author
      ? { label: `نویسنده: ${filters.author}`, patch: { author: "" } }
      : null,
    filters.translator
      ? { label: `مترجم: ${filters.translator}`, patch: { translator: "" } }
      : null,
    filters.publisher
      ? { label: `ناشر: ${filters.publisher}`, patch: { publisher: "" } }
      : null,
    filters.country
      ? { label: `کشور: ${filters.country}`, patch: { country: "" } }
      : null,
    filters.language
      ? { label: `زبان: ${filters.language}`, patch: { language: "" } }
      : null,
    filters.hasCover !== "any"
      ? {
          label: filters.hasCover === "with" ? "دارای جلد" : "بدون جلد",
          patch: { hasCover: "any" as const },
        }
      : null,
    filters.minPages !== null
      ? {
          label: `از ${filters.minPages.toLocaleString("fa-IR")} صفحه`,
          patch: { minPages: null },
        }
      : null,
    filters.maxPages !== null
      ? {
          label: `تا ${filters.maxPages.toLocaleString("fa-IR")} صفحه`,
          patch: { maxPages: null },
        }
      : null,
    filters.minRating !== null
      ? {
          label: `امتیاز از ${filters.minRating.toLocaleString("fa-IR")}`,
          patch: { minRating: null },
        }
      : null,
    filters.maxRating !== null
      ? {
          label: `امتیاز تا ${filters.maxRating.toLocaleString("fa-IR")}`,
          patch: { maxRating: null },
        }
      : null,
    filters.minYear !== null
      ? {
          label: `انتشار از ${filters.minYear.toLocaleString("fa-IR")}`,
          patch: { minYear: null },
        }
      : null,
    filters.maxYear !== null
      ? {
          label: `انتشار تا ${filters.maxYear.toLocaleString("fa-IR")}`,
          patch: { maxYear: null },
        }
      : null,
  ].filter(Boolean) as Array<{
    label: string;
    patch: Partial<BookArchiveFilters>;
  }>;

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <FilterChip
          key={chip.label}
          label={chip.label}
          onRemove={() => onPatch({ ...chip.patch, page: 1 })}
        />
      ))}
    </div>
  );
}

function BookArchiveCard({ book }: { book: BookArchiveItem }) {
  const href = bookHref(book);
  const [imgError, setImgError] = useState(false);
  const coverSrc = book.coverImage && !imgError
    ? book.coverImage
    : "/placeholder-cover.svg";

  const content = (
    <>
      <div className="relative aspect-[2/3] overflow-hidden rounded-[1.35rem] bg-gradient-to-br from-emerald-950/35 via-background to-muted">
        <Image
          src={coverSrc}
          alt={book.title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 29vw, (max-width: 1400px) 18vw, 14vw"
          className="object-cover transition duration-500 group-hover:scale-[1.025]"
          onError={() => setImgError(true)}
        />
      </div>

      <div className="space-y-2.5 px-1 pt-3 text-right">
        <h2 className="line-clamp-2 text-sm font-black leading-6 tracking-tight text-foreground transition-colors duration-200 group-hover:text-primary sm:text-[0.95rem]">
          {book.title}
        </h2>

        <div className="flex flex-col gap-2">
          <p className="line-clamp-1 min-w-0 text-xs font-semibold leading-5 text-muted-foreground transition-colors group-hover:text-foreground/80 sm:text-sm">
            {book.author}
          </p>

          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border/60 bg-card/55 px-2.5 py-1 text-[11px] font-bold text-muted-foreground shadow-[0_10px_28px_-24px_rgba(0,0,0,0.75)] backdrop-blur-sm">
            <FiStar
              className={
                book.averageRating != null
                  ? "h-3.5 w-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.25)]"
                  : "h-3.5 w-3.5 text-muted-foreground/60"
              }
            />

            <span className="tabular-nums leading-none text-foreground/85">
              {book.averageRating != null
                ? book.averageRating.toLocaleString("fa-IR")
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </>
  );

  const className =
    "block rounded-[1.55rem] border border-border/70 bg-card/55 p-3 shadow-[0_20px_70px_-58px_rgba(0,0,0,0.75)] transition hover:border-primary/20 hover:bg-card/75";

  return href ? (
    <Link
      href={href}
      className={`${className} group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30`}
    >
      {content}
    </Link>
  ) : (
    <div className={`${className} group`}>{content}</div>
  );
}

function Pagination({
  archive,
  onPatch,
}: {
  archive: BookArchiveResult;
  onPatch: (patch: Partial<BookArchiveFilters>) => void;
}) {
  if (archive.pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.6rem] border border-border/75 bg-card/70 px-4 py-3">
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-2xl"
        disabled={archive.page <= 1}
        onClick={() => onPatch({ page: archive.page - 1 })}
      >
        <ChevronRight className="h-4 w-4" />
        صفحه قبل
      </Button>
      <p className="text-sm text-muted-foreground">
        صفحه {archive.page.toLocaleString("fa-IR")} از{" "}
        {archive.pageCount.toLocaleString("fa-IR")}
      </p>
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-2xl"
        disabled={archive.page >= archive.pageCount}
        onClick={() => onPatch({ page: archive.page + 1 })}
      >
        صفحه بعد
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function BookArchiveFilters({
  filters,
  options,
  archive,
  searchPlaceholder = "جست‌وجو در عنوان، عنوان اصلی، نویسنده، مترجم یا ناشر",
  hideGenreFilter = false,
  hideAuthorFilter = false,
  hideTranslatorFilter = false,
  hidePublisherFilter = false,
  hideCountryFilter = false,
}: {
  filters: BookArchiveFilters;
  options: BookArchiveFilterOptions;
  archive: BookArchiveResult;
  searchPlaceholder?: string;
  hideGenreFilter?: boolean;
  hideAuthorFilter?: boolean;
  hideTranslatorFilter?: boolean;
  hidePublisherFilter?: boolean;
  hideCountryFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const currentParams = useMemo(
    () => toBookArchiveSearchParams(filters).toString(),
    [filters],
  );

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  useEffect(() => {
    const nextParams = toBookArchiveSearchParams(draft).toString();
    if (nextParams === currentParams) return;

    const delay = draft.q !== filters.q ? 220 : 0;
    const timer = window.setTimeout(() => {
      startTransition(() => {
        router.replace(nextParams ? `${pathname}?${nextParams}` : pathname, {
          scroll: false,
        });
      });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [currentParams, draft, filters.q, pathname, router, startTransition]);

  const hasActiveFilters = useMemo(
    () => hasActiveBookArchiveFilters(filters),
    [filters],
  );

  const navigateWithFilters = (
    nextFilters: BookArchiveFilters,
    method: "push" | "replace" = "push",
  ) => {
    startTransition(() => {
      const params = toBookArchiveSearchParams(nextFilters).toString();
      router[method](params ? `${pathname}?${params}` : pathname, {
        scroll: false,
      });
    });
  };

  const patchFilters = (patch: Partial<BookArchiveFilters>) => {
    const nextFilters = { ...filters, ...patch };
    setDraft(nextFilters);
    navigateWithFilters(nextFilters);
  };

  const resetFilters = () => {
    setDraft(DEFAULT_BOOK_ARCHIVE_FILTERS);
    navigateWithFilters(DEFAULT_BOOK_ARCHIVE_FILTERS, "replace");
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={draft.q}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                q: event.target.value,
                page: 1,
              }))
            }
            placeholder={searchPlaceholder}
            className="h-14 w-full rounded-[1.8rem] border border-border/70 bg-card/70 pr-12 pl-4 text-sm text-foreground shadow-[0_24px_80px_-60px_rgba(0,0,0,0.7)] outline-none transition focus:border-primary/30 focus:ring-2 focus:ring-primary/15 sm:text-base"
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="lg:hidden">
            <BookArchiveFilterDrawer
              open={drawerOpen}
              onOpenChange={setDrawerOpen}
              draft={draft}
              setDraft={setDraft}
              options={options}
              pending={isPending}
              onReset={resetFilters}
              hideGenreFilter={hideGenreFilter}
              hideAuthorFilter={hideAuthorFilter}
              hideTranslatorFilter={hideTranslatorFilter}
              hidePublisherFilter={hidePublisherFilter}
              hideCountryFilter={hideCountryFilter}
            />
          </div>
        </div>

        <ActiveFilters filters={filters} onPatch={patchFilters} />
      </section>

      <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4 rounded-[1.7rem] border border-border/75 bg-card/65 p-4 shadow-[0_24px_70px_-58px_rgba(0,0,0,0.75)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-foreground">فیلترها</p>
              <Button
                type="button"
                variant="ghost"
                onClick={resetFilters}
                className="h-9 rounded-2xl px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
              >
                حذف فیلترها
              </Button>
            </div>

            <BookArchiveFiltersPanel
              draft={draft}
              setDraft={setDraft}
              options={options}
              pending={isPending}
              hideGenreFilter={hideGenreFilter}
              hideAuthorFilter={hideAuthorFilter}
              hideTranslatorFilter={hideTranslatorFilter}
              hidePublisherFilter={hidePublisherFilter}
              hideCountryFilter={hideCountryFilter}
            />
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {archive.items.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-border/70 bg-card/50 px-6 py-14 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-border/70 bg-background/70 text-primary">
                <BookOpen className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-xl font-black text-foreground">
                کتابی با این فیلترها پیدا نشد
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                ترکیب فیلترها را تغییر بده یا همه‌شان را پاک کن تا آرشیو دوباره
                گسترده شود.
              </p>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 h-11 rounded-2xl"
                >
                  پاک کردن فیلترها
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {archive.items.map((book) => (
                  <BookArchiveCard key={book.id} book={book} />
                ))}
              </div>

              <Pagination archive={archive} onPatch={patchFilters} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

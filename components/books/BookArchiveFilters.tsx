"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { FiStar } from "react-icons/fi";

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
      aria-label={`حذف فیلتر ${label}`}
      className="group/chip inline-flex h-9 items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.08] px-3 text-xs font-bold text-primary shadow-sm transition hover:border-primary/25 hover:bg-primary/[0.12]"
    >
      <span className="max-w-44 truncate">{label}</span>
      <X className="h-3.5 w-3.5 opacity-70 transition group-hover/chip:opacity-100" />
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
    <div className="flex flex-wrap items-center gap-2">
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

  const coverSrc =
    book.coverImage && !imgError ? book.coverImage : "/placeholder-cover.svg";

  const ratingLabel =
    book.averageRating != null
      ? book.averageRating.toLocaleString("fa-IR", {
          maximumFractionDigits: 1,
        })
      : "—";

  const content = (
    <>
      <div className="relative overflow-hidden rounded-[1.35rem] bg-muted">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-background/30" />

        <div className="relative aspect-[2/3]">
          <Image
            src={coverSrc}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, (max-width: 1400px) 19vw, 15vw"
            className="object-cover transition duration-500 group-hover/card:scale-[1.035]"
            onError={() => setImgError(true)}
          />
        </div>
      </div>

      <div className="flex flex-col px-1 pt-3 text-right">
        <h2 className="line-clamp-2 min-h-[3rem] text-sm font-black leading-6 tracking-tight text-foreground transition-colors group-hover/card:text-primary sm:text-[0.95rem]">
          {book.title}
        </h2>

        <p className="mt-1.5 line-clamp-1 text-xs font-semibold leading-5 text-muted-foreground sm:text-sm">
          {book.author || "نویسنده نامشخص"}
        </p>

        <div className="mt-3 flex items-center justify-end">
          <div className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2.5 text-[11px] font-bold text-foreground shadow-sm backdrop-blur">
            <span className="tabular-nums leading-none">{ratingLabel}</span>

            <FiStar
              className={
                book.averageRating != null
                  ? "h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  : "h-3.5 w-3.5 text-muted-foreground/60"
              }
            />
          </div>
        </div>
      </div>
    </>
  );

  const className =
    "group/card block rounded-[1.65rem] border border-border/70 bg-card/70 p-3 shadow-[0_22px_70px_-60px_rgba(0,0,0,0.8)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_28px_80px_-62px_rgba(0,0,0,0.9)]";

  if (!href) {
    return <article className={className}>{content}</article>;
  }

  return (
    <Link
      href={href}
      className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30`}
    >
      {content}
    </Link>
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
    <nav
      aria-label="صفحه‌بندی کتاب‌ها"
      className="flex flex-col items-center justify-between gap-3 rounded-[1.6rem] border border-border/75 bg-card/70 p-3 shadow-[0_20px_70px_-60px_rgba(0,0,0,0.75)] sm:flex-row"
    >
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-2xl sm:w-auto"
        disabled={archive.page <= 1}
        onClick={() => onPatch({ page: archive.page - 1 })}
      >
        <ChevronRight className="h-4 w-4" />
        صفحه قبل
      </Button>

      <p className="order-first text-sm font-bold text-muted-foreground sm:order-none">
        صفحه{" "}
        <span className="text-foreground">
          {archive.page.toLocaleString("fa-IR")}
        </span>{" "}
        از{" "}
        <span className="text-foreground">
          {archive.pageCount.toLocaleString("fa-IR")}
        </span>
      </p>

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-2xl sm:w-auto"
        disabled={archive.page >= archive.pageCount}
        onClick={() => onPatch({ page: archive.page + 1 })}
      >
        صفحه بعد
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </nav>
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

  const hasActiveFilters = useMemo(
    () => hasActiveBookArchiveFilters(filters),
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

  const navigateWithFilters = (
    nextFilters: BookArchiveFilters,
    method: "push" | "replace" = "push",
  ) => {
    startTransition(() => {
      const params = toBookArchiveSearchParams(nextFilters).toString();
      const href = params ? `${pathname}?${params}` : pathname;

      if (method === "replace") {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
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
    <div className="space-y-6" dir="rtl">
      <section className="rounded-[2rem] border border-border/70 bg-card/55 p-3 shadow-[0_24px_90px_-72px_rgba(0,0,0,0.85)] backdrop-blur sm:p-4">
        <div className="flex flex-col gap-3">
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
              className="h-14 w-full rounded-[1.45rem] border border-border/70 bg-background/70 pr-12 pl-4 text-right text-sm font-semibold text-foreground outline-none transition placeholder:text-muted-foreground/75 focus:border-primary/35 focus:bg-background focus:ring-4 focus:ring-primary/10 sm:text-base"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-muted-foreground">
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {archive.items.length > 0
                  ? `${archive.items.length.toLocaleString(
                      "fa-IR",
                    )} کتاب در این صفحه`
                  : "نتیجه‌ای برای نمایش نیست"}
              </span>
            </div>

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
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 overflow-hidden rounded-[1.8rem] border border-border/75 bg-card/70 shadow-[0_24px_80px_-64px_rgba(0,0,0,0.85)] backdrop-blur">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-black text-foreground">فیلترها</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">
                    محدود کردن آرشیو کتاب‌ها
                  </p>
                </div>
              </div>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetFilters}
                  className="h-9 rounded-2xl px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  حذف
                </Button>
              ) : null}
            </div>

            <div className="p-4">
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
          </div>
        </aside>

        <main className="min-w-0 space-y-5">
          {archive.items.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-border/75 bg-card/45 px-6 py-16 text-center shadow-[0_24px_80px_-70px_rgba(0,0,0,0.8)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-border/70 bg-background/75 text-primary shadow-sm">
                <BookOpen className="h-7 w-7" />
              </div>

              <h2 className="mt-5 text-xl font-black tracking-tight text-foreground">
                کتابی با این فیلترها پیدا نشد
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-7 text-muted-foreground">
                ترکیب فیلترها را تغییر بده یا همه‌شان را پاک کن تا آرشیو دوباره
                گسترده شود.
              </p>

              {hasActiveFilters ? (
                <Button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 h-11 rounded-2xl px-5"
                >
                  پاک کردن فیلترها
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 items-stretch gap-x-3 gap-y-5 sm:grid-cols-3 sm:gap-x-4 lg:gap-x-5 xl:grid-cols-4 2xl:grid-cols-5">
                {archive.items.map((book) => (
                  <BookArchiveCard key={book.id} book={book} />
                ))}
              </div>

              <Pagination archive={archive} onPatch={patchFilters} />
            </>
          )}
        </main>
      </div>
    </div>
  );
}

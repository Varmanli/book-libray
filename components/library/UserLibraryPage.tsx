"use client";

import { type ElementType, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Heart,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

import EmptyPanelState from "@/components/panel/EmptyPanelState";
import LibraryHeader from "@/components/library/LibraryHeader";
import LibraryBookCard from "@/components/library/LibraryBookCard";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type {
  LibraryBook,
  LibraryByUsernameResult,
} from "@/lib/library/service";

type PublicLibraryResult = Extract<
  LibraryByUsernameResult,
  { found: true; isPrivate: false }
>;

type FilterKey = "ALL" | "READING" | "PAUSED" | "FINISHED" | "UNREAD" | "FAVORITES";
type SortKey = "NEWEST" | "TITLE" | "RATING";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "همه کتاب‌ها" },
  { key: "READING", label: "در حال خواندن" },
  { key: "PAUSED", label: "متوقف‌شده" },
  { key: "FINISHED", label: "خوانده‌شده" },
  { key: "UNREAD", label: "نخوانده" },
  { key: "FAVORITES", label: "علاقه‌مندی‌ها" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "NEWEST", label: "جدیدترین" },
  { key: "TITLE", label: "عنوان" },
  { key: "RATING", label: "امتیاز" },
];

function nextStatus(status: LibraryBook["status"]): LibraryBook["status"] {
  if (status === "UNREAD") return "READING";
  if (status === "READING") return "FINISHED";
  if (status === "PAUSED") return "READING";
  return "UNREAD";
}

const FILTER_KEYS: FilterKey[] = [
  "ALL",
  "READING",
  "PAUSED",
  "FINISHED",
  "UNREAD",
  "FAVORITES",
];

function normalizeFilter(value?: string): FilterKey {
  const upper = value?.toUpperCase();
  return FILTER_KEYS.find((key) => key === upper) ?? "ALL";
}

export default function UserLibraryPage({
  initialData,
  initialSearch = "",
  initialFilter,
}: {
  initialData: PublicLibraryResult;
  initialSearch?: string;
  initialFilter?: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [books, setBooks] = useState(initialData.books);
  const [query, setQuery] = useState(initialSearch);
  const [filter, setFilter] = useState<FilterKey>(
    normalizeFilter(initialFilter)
  );
  const [sortBy, setSortBy] = useState<SortKey>("NEWEST");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filteredBooks = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const results = books.filter((book) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "FAVORITES" && book.isFavorite) ||
        book.status === filter;

      if (!matchesFilter) return false;
      if (!normalized) return true;

      return [book.title, book.author, book.publisher, book.translator, book.genre]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalized));
    });

    return results.sort((left, right) => {
      if (sortBy === "TITLE") {
        return left.title.localeCompare(right.title, "fa");
      }
      if (sortBy === "RATING") {
        return (right.rating ?? -1) - (left.rating ?? -1);
      }
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
  }, [books, filter, query, sortBy]);

  const counts = useMemo(
    () => ({
      ALL: books.length,
      READING: books.filter((book) => book.status === "READING").length,
      PAUSED: books.filter((book) => book.status === "PAUSED").length,
      FINISHED: books.filter((book) => book.status === "FINISHED").length,
      UNREAD: books.filter((book) => book.status === "UNREAD").length,
      FAVORITES: books.filter((book) => book.isFavorite).length,
    }),
    [books]
  );

  const handleCycleStatus = async (book: LibraryBook) => {
    const status = nextStatus(book.status);
    setPendingId(book.id);
    try {
      const res = await fetch(`/api/books/${book.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "تغییر وضعیت ناموفق بود");
        return;
      }

      setBooks((current) =>
        current.map((item) => (item.id === book.id ? { ...item, status } : item))
      );
      router.refresh();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = (book: LibraryBook) => {
    void confirm({
      title: "حذف کتاب",
      description: `کتاب «${book.title}» حذف شود؟ این عملیات قابل بازگشت نیست.`,
      onConfirm: async () => {
        setPendingId(book.id);
        try {
          const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
          const data = await res.json();
          if (!res.ok) {
            toast.error(data.error || "حذف کتاب ناموفق بود.");
            return;
          }

          setBooks((current) => current.filter((item) => item.id !== book.id));
          toast.success("کتاب حذف شد.");
          router.refresh();
        } catch {
          toast.error("ارتباط با سرور برقرار نشد");
        } finally {
          setPendingId(null);
        }
      },
    });
  };

  const activeFilter = FILTERS.find((item) => item.key === filter)?.label || "همه";

  const canReset =
    query.trim() !== "" || filter !== "ALL" || sortBy !== "NEWEST";

  const handleReset = () => {
    setQuery("");
    setFilter("ALL");
    setSortBy("NEWEST");
  };

  const filterProps = {
    query,
    onQueryChange: setQuery,
    filter,
    onFilterChange: setFilter,
    sortBy,
    onSortChange: setSortBy,
    counts,
    canReset,
    onReset: handleReset,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pt-10 lg:pt-12">
      <LibraryHeader profile={initialData.profile} isOwner={initialData.isOwner} />

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <LibStat
          label="کل کتاب‌ها"
          value={initialData.stats.total}
          icon={BookOpen}
          tone="bg-primary/12 text-primary"
        />
        <LibStat
          label="درحال خواندن"
          value={initialData.stats.reading}
          icon={Clock3}
          tone="bg-sky-500/12 text-sky-500 dark:text-sky-300"
        />
        <LibStat
          label="خوانده‌شده"
          value={initialData.stats.finished}
          icon={CheckCircle2}
          tone="bg-emerald-500/12 text-emerald-600 dark:text-emerald-300"
        />
        <LibStat
          label="علاقه‌مندی‌ها"
          value={initialData.stats.favorites}
          icon={Heart}
          tone="bg-rose-500/12 text-rose-500 dark:text-rose-300"
        />
      </section>

      <div className="mt-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6">
        {/* سایدبار فیلتر — دسکتاپ */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border border-border/70 bg-card/50 p-4">
            <h2 className="mb-4 text-sm font-semibold text-foreground">فیلترها</h2>
            <LibraryFilters {...filterProps} />
          </div>
        </aside>

        {/* محتوا */}
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-lg font-bold text-foreground">کتابخانه</h2>
              <span className="text-xs text-muted-foreground">
                {filteredBooks.length} کتاب
              </span>
            </div>

            {/* دکمه فیلتر — موبایل */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 lg:hidden"
                  aria-label="فیلتر و مرتب‌سازی"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  فیلتر و مرتب‌سازی
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[88vh] rounded-t-2xl"
              >
                <SheetHeader className="pt-12">
                  <SheetTitle>فیلتر و مرتب‌سازی</SheetTitle>
                  <SheetDescription className="sr-only">
                    جست‌وجو، فیلتر وضعیت و مرتب‌سازی کتاب‌های کتابخانه.
                  </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-4">
                  <LibraryFilters {...filterProps} />
                </div>
                <SheetFooter>
                  <SheetClose asChild>
                    <Button className="w-full">اعمال</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          {filteredBooks.length === 0 ? (
            <EmptyState
              isOwner={initialData.isOwner}
              hasQuery={!!query.trim()}
              activeFilterLabel={activeFilter}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className={
                    pendingId === book.id ? "pointer-events-none opacity-60" : ""
                  }
                >
                  <LibraryBookCard
                    book={book}
                    canManage={initialData.isOwner}
                    onCycleStatus={handleCycleStatus}
                    onDelete={handleDelete}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** کنترل‌های فیلتر/جست‌وجو/مرتب‌سازی — مشترک بین سایدبار دسکتاپ و شیت موبایل. */
function LibraryFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  sortBy,
  onSortChange,
  counts,
  canReset,
  onReset,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  filter: FilterKey;
  onFilterChange: (key: FilterKey) => void;
  sortBy: SortKey;
  onSortChange: (key: SortKey) => void;
  counts: Record<FilterKey, number>;
  canReset: boolean;
  onReset: () => void;
}) {
  const searchId = useId();

  return (
    <div className="space-y-5 pb-4">
      <div>
        <label htmlFor={searchId} className="sr-only">
          جستجو در کتابخانه
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={searchId}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="جستجو در کتابخانه"
            className="h-10 pr-9"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">وضعیت</p>
        <div className="space-y-1">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onFilterChange(item.key)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? "border-primary/40 bg-primary/15 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                )}
              >
                <span>{item.label}</span>
                <span className="text-xs tabular-nums opacity-60">
                  {counts[item.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">مرتب‌سازی</p>
        <div className="grid grid-cols-3 gap-0.5 rounded-lg border border-border bg-card/40 p-0.5">
          {SORTS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onSortChange(item.key)}
              aria-pressed={sortBy === item.key}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                sortBy === item.key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {canReset ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          پاک کردن فیلترها
        </Button>
      ) : null}
    </div>
  );
}

/** کارت آمار فشرده با آیکن ملایم و توکن‌های معنایی. */
function LibStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: ElementType;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/50 p-3.5">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tone
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none text-foreground">{value}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({
  isOwner,
  hasQuery,
  activeFilterLabel,
}: {
  isOwner: boolean;
  hasQuery: boolean;
  activeFilterLabel: string;
}) {
  if (hasQuery) {
    return (
      <EmptyPanelState
        title="نتیجه‌ای پیدا نشد"
        description={`در فیلتر «${activeFilterLabel}» چیزی با این جست‌وجو پیدا نشد. واژه‌ی دیگری را امتحان کن یا فیلتر را عوض کن.`}
      />
    );
  }

  if (isOwner) {
    return (
      <EmptyPanelState
        title={`بخش «${activeFilterLabel}» فعلاً خالی است`}
        description="وقتی کتابی را به این وضعیت ببری، اینجا دیده می‌شود."
        ctaLabel="افزودن کتاب"
        ctaHref="/books/add"
      />
    );
  }

  return (
    <EmptyPanelState
      title={`در بخش «${activeFilterLabel}» چیزی برای نمایش نیست`}
      description="این کاربر هنوز کتاب عمومی‌ای در این بخش ندارد."
    />
  );
}

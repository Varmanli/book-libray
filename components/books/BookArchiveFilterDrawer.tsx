"use client";

import type { ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

import BookArchiveFiltersPanel from "@/components/books/BookArchiveFiltersPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  hasActiveBookArchiveFilters,
  type BookArchiveFilterOptions,
  type BookArchiveFilters,
} from "@/lib/book/archive-search";

export default function BookArchiveFilterDrawer({
  open,
  onOpenChange,
  draft,
  setDraft,
  options,
  pending,
  onReset,
  hideGenreFilter = false,
  hideAuthorFilter = false,
  hideTranslatorFilter = false,
  hidePublisherFilter = false,
  hideCountryFilter = false,
  trigger,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: BookArchiveFilters;
  setDraft: React.Dispatch<React.SetStateAction<BookArchiveFilters>>;
  options: BookArchiveFilterOptions;
  pending: boolean;
  onReset: () => void;
  hideGenreFilter?: boolean;
  hideAuthorFilter?: boolean;
  hideTranslatorFilter?: boolean;
  hidePublisherFilter?: boolean;
  hideCountryFilter?: boolean;
  trigger?: ReactNode;
}) {
  const hasActiveFilters = hasActiveBookArchiveFilters(draft);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            variant="outline"
            className="
              h-11 gap-2 rounded-xl
              border-border bg-card px-3.5
              text-xs font-black
            "
          >
            <SlidersHorizontal className="h-4 w-4" />
            فیلتر
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        dir="rtl"
        className="
          z-[80]
          flex
          h-[92dvh]
          max-h-[92dvh]
          flex-col
          overflow-hidden

          rounded-t-[1.75rem]
          border-x
          border-t
          border-border

          bg-background
          p-0

          text-right

          shadow-[0_-25px_80px_-35px_rgba(0,0,0,0.55)]

          sm:left-1/2
          sm:max-w-[640px]
          sm:-translate-x-1/2
        "
      >
        {/* handle */}
        <div className="flex shrink-0 justify-center pt-2.5">
          <span className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* header */}
        <SheetHeader
          className="
            shrink-0
            border-b border-border/70
            px-4
            pb-4
            pt-2
            text-right
          "
        >
          <div className="flex items-center justify-between gap-3 pl-10">
            <div className="min-w-0">
              <SheetTitle className="text-[15px] font-black">
                فیلتر کتاب‌ها
              </SheetTitle>

              <SheetDescription className="mt-1 text-[11px] font-medium">
                نتیجه را بر اساس نیازت محدود کن
              </SheetDescription>
            </div>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={onReset}
                disabled={pending}
                className="
                  shrink-0 rounded-lg px-2 py-1.5
                  text-[11px] font-bold
                  text-muted-foreground
                  transition

                  hover:bg-destructive/10
                  hover:text-destructive
                "
              >
                پاک کردن همه
              </button>
            ) : null}
          </div>
        </SheetHeader>

        {/* search */}
        <div className="shrink-0 px-4 pb-2 pt-4">
          <div className="group relative">
            <Search
              aria-hidden="true"
              className="
                pointer-events-none
                absolute right-3.5 top-1/2
                h-4 w-4
                -translate-y-1/2
                text-muted-foreground
                group-focus-within:text-primary
              "
            />

            <input
              type="search"
              dir="rtl"
              value={draft.q}
              onChange={(event) => {
                const value = event.target.value;

                setDraft((current) => ({
                  ...current,
                  q: value,
                  page: 1,
                }));
              }}
              placeholder="نام کتاب، نویسنده، مترجم یا ناشر..."
              className="
                h-11 w-full
                rounded-xl
                border border-border
                bg-card
                pr-10 pl-10

                text-sm font-semibold
                text-foreground
                outline-none

                transition

                placeholder:text-xs
                placeholder:font-medium
                placeholder:text-muted-foreground

                focus:border-primary/50
                focus:ring-2
                focus:ring-primary/10
              "
            />

            {draft.q ? (
              <button
                type="button"
                aria-label="پاک کردن جست‌وجو"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    q: "",
                    page: 1,
                  }))
                }
                className="
                  absolute left-2.5 top-1/2
                  flex h-7 w-7
                  -translate-y-1/2
                  items-center justify-center

                  rounded-lg
                  text-muted-foreground

                  hover:bg-muted
                  hover:text-foreground
                "
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* body */}
        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain

            px-4
            pb-8
            pt-3

            [scrollbar-width:thin]
          "
        >
          <BookArchiveFiltersPanel
            draft={draft}
            setDraft={setDraft}
            options={options}
            pending={pending}
            hideGenreFilter={hideGenreFilter}
            hideAuthorFilter={hideAuthorFilter}
            hideTranslatorFilter={hideTranslatorFilter}
            hidePublisherFilter={hidePublisherFilter}
            hideCountryFilter={hideCountryFilter}
          />
        </div>

        {/* footer */}
        <div
          className="
            shrink-0
            border-t border-border

            bg-background

            px-4
            pb-[max(1rem,env(safe-area-inset-bottom))]
            pt-3
          "
        >
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="
              h-12 w-full
              rounded-xl
              text-sm font-black
            "
          >
            {pending ? (
              <>
                <span className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                در حال به‌روزرسانی
              </>
            ) : (
              "مشاهده کتاب‌ها"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

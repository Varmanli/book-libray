"use client";

import { SlidersHorizontal } from "lucide-react";

import BookArchiveFiltersPanel from "@/components/books/BookArchiveFiltersPanel";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  BookArchiveFilterOptions,
  BookArchiveFilters,
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
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-10 rounded-2xl border-border/70 bg-card/70 px-3.5 text-sm font-bold lg:hidden"
        >
          <SlidersHorizontal className="h-4 w-4" />
          فیلترها
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full max-w-md border-border/80 bg-card/95 p-0 text-right backdrop-blur-xl"
      >
        <SheetHeader className="border-b border-border/80 px-5 pt-12">
          <div className="flex items-center justify-between gap-3 pl-10">
            <SheetTitle>فیلترها</SheetTitle>
            <Button
              type="button"
              variant="ghost"
              onClick={onReset}
              className="h-9 rounded-2xl px-3 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              حذف فیلترها
            </Button>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
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
      </SheetContent>
    </Sheet>
  );
}

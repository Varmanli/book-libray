"use client";

import type { Dispatch, SetStateAction } from "react";

import {
  BOOK_ARCHIVE_SORT_OPTIONS,
  type BookArchiveFilterOptions,
  type BookArchiveFilters,
} from "@/lib/book/archive-search";
import { cn } from "@/lib/utils";

interface BookArchiveFiltersPanelProps {
  draft: BookArchiveFilters;
  setDraft: Dispatch<SetStateAction<BookArchiveFilters>>;
  options: BookArchiveFilterOptions;
  pending?: boolean;
  className?: string;
  hideGenreFilter?: boolean;
  hideAuthorFilter?: boolean;
  hideTranslatorFilter?: boolean;
  hidePublisherFilter?: boolean;
  hideCountryFilter?: boolean;
}

function updateNumber(
  value: string,
  setter: (value: number | null) => void,
  min?: number,
  max?: number,
) {
  const trimmed = value.trim();
  if (!trimmed) {
    setter(null);
    return;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return;

  let next = Math.trunc(parsed);
  if (typeof min === "number") next = Math.max(min, next);
  if (typeof max === "number") next = Math.min(max, next);
  setter(next);
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-[1.35rem] border border-border/70 bg-background/55 p-4"
    >
      <summary className="cursor-pointer list-none text-sm font-bold text-foreground">
        <div className="flex items-center justify-between gap-4">
          <span>{title}</span>
          <span className="text-xs text-muted-foreground transition-transform group-open:rotate-180">
            ⌃
          </span>
        </div>
      </summary>
      <div className="mt-4 space-y-3">{children}</div>
    </details>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  max,
}: {
  value: string | number | null;
  onChange: (value: string) => void;
  placeholder: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
}) {
  return (
    <input
      type={type}
      min={min}
      max={max}
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-10 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/15"
    />
  );
}

function SelectField({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-10 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/15"
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export default function BookArchiveFiltersPanel({
  draft,
  setDraft,
  options,
  pending = false,
  className,
  hideGenreFilter = false,
  hideAuthorFilter = false,
  hideTranslatorFilter = false,
  hidePublisherFilter = false,
  hideCountryFilter = false,
}: BookArchiveFiltersPanelProps) {
  return (
    <div className={cn("space-y-4", pending && "opacity-80", className)}>
      <FilterSection title="مرتب‌سازی">
        <select
          value={draft.sort}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              sort: event.target.value as BookArchiveFilters["sort"],
              page: 1,
            }))
          }
          className="h-10 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/15"
        >
          {BOOK_ARCHIVE_SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </FilterSection>

      <FilterSection title="مشخصات کتاب">
        {!hideGenreFilter ? (
          <SelectField
            value={draft.genre}
            onChange={(value) =>
              setDraft((current) => ({ ...current, genre: value, page: 1 }))
            }
            placeholder="همه ژانرها"
            options={options.genres}
          />
        ) : null}
        {!hideAuthorFilter ? (
          <SelectField
            value={draft.author}
            onChange={(value) =>
              setDraft((current) => ({ ...current, author: value, page: 1 }))
            }
            placeholder="همه نویسنده‌ها"
            options={options.authors}
          />
        ) : null}
        {!hideCountryFilter ? (
          <SelectField
            value={draft.country}
            onChange={(value) =>
              setDraft((current) => ({ ...current, country: value, page: 1 }))
            }
            placeholder="همه کشورها"
            options={options.countries}
          />
        ) : null}
        <SelectField
          value={draft.language}
          onChange={(value) =>
            setDraft((current) => ({ ...current, language: value, page: 1 }))
          }
          placeholder="همه زبان‌ها"
          options={options.languages}
        />
      </FilterSection>

      <FilterSection title="نسخه و انتشار">
        {!hideTranslatorFilter ? (
          <SelectField
            value={draft.translator}
            onChange={(value) =>
              setDraft((current) => ({ ...current, translator: value, page: 1 }))
            }
            placeholder="همه مترجم‌ها"
            options={options.translators}
          />
        ) : null}
        {!hidePublisherFilter ? (
          <SelectField
            value={draft.publisher}
            onChange={(value) =>
              setDraft((current) => ({ ...current, publisher: value, page: 1 }))
            }
            placeholder="همه ناشرها"
            options={options.publishers}
          />
        ) : null}
        <select
          value={draft.hasCover}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              hasCover: event.target.value as BookArchiveFilters["hasCover"],
              page: 1,
            }))
          }
          className="h-10 w-full rounded-2xl border border-border/70 bg-background/80 px-4 text-sm text-foreground outline-none transition focus:border-primary/35 focus:ring-2 focus:ring-primary/15"
        >
          <option value="any">همه جلدها</option>
          <option value="with">فقط دارای جلد</option>
          <option value="without">فقط بدون جلد</option>
        </select>
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            type="number"
            min={0}
            max={3000}
            value={draft.minYear}
            onChange={(value) =>
              updateNumber(value, (next) =>
                setDraft((current) => ({ ...current, minYear: next, page: 1 })),
              )
            }
            placeholder="سال از"
          />
          <TextInput
            type="number"
            min={0}
            max={3000}
            value={draft.maxYear}
            onChange={(value) =>
              updateNumber(value, (next) =>
                setDraft((current) => ({ ...current, maxYear: next, page: 1 })),
              )
            }
            placeholder="سال تا"
          />
        </div>
      </FilterSection>

      <FilterSection title="امتیاز و حجم">
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            type="number"
            min={1}
            max={5}
            value={draft.minRating}
            onChange={(value) =>
              updateNumber(value, (next) =>
                setDraft((current) => ({ ...current, minRating: next, page: 1 })),
              )
            }
            placeholder="امتیاز از ۱"
          />
          <TextInput
            type="number"
            min={1}
            max={5}
            value={draft.maxRating}
            onChange={(value) =>
              updateNumber(value, (next) =>
                setDraft((current) => ({ ...current, maxRating: next, page: 1 })),
              )
            }
            placeholder="امتیاز تا ۵"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextInput
            type="number"
            min={1}
            value={draft.minPages}
            onChange={(value) =>
              updateNumber(value, (next) =>
                setDraft((current) => ({ ...current, minPages: next, page: 1 })),
              )
            }
            placeholder="صفحه از"
          />
          <TextInput
            type="number"
            min={1}
            value={draft.maxPages}
            onChange={(value) =>
              updateNumber(value, (next) =>
                setDraft((current) => ({ ...current, maxPages: next, page: 1 })),
              )
            }
            placeholder="صفحه تا"
          />
        </div>
      </FilterSection>
    </div>
  );
}

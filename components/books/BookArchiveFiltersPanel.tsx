"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";

import type {
  BookArchiveFilterOptions,
  BookArchiveFilters,
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

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

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

  if (typeof min === "number") {
    next = Math.max(min, next);
  }

  if (typeof max === "number") {
    next = Math.min(max, next);
  }

  setter(next);
}

/* -------------------------------------------------------------------------- */
/*                                  Section                                   */
/* -------------------------------------------------------------------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="py-5 first:pt-1">
      <div className="mb-3">
        <h3 className="text-[13px] font-black text-foreground">{title}</h3>

        {description ? (
          <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

function Separator() {
  return <div className="h-px bg-border/70" />;
}

/* -------------------------------------------------------------------------- */
/*                                   Select                                   */
/* -------------------------------------------------------------------------- */

function SelectField({
  label,
  value,
  placeholder,
  options,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[10px] font-bold text-muted-foreground">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="
          h-10 w-full
          appearance-none
          rounded-xl

          border border-border
          bg-card

          px-3

          text-[12px]
          font-bold
          text-foreground

          outline-none

          transition

          hover:border-foreground/20

          focus:border-primary/45
          focus:ring-2
          focus:ring-primary/10
        "
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Number                                    */
/* -------------------------------------------------------------------------- */

function NumberField({
  value,
  placeholder,
  onChange,
  min,
  max,
}: {
  value: number | null;
  placeholder: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value ?? ""}
      min={min}
      max={max}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
      className="
        h-10 w-full
        rounded-xl

        border border-border
        bg-card

        px-3

        text-center
        text-xs
        font-bold
        tabular-nums

        text-foreground

        outline-none

        transition

        placeholder:font-medium
        placeholder:text-muted-foreground/70

        hover:border-foreground/20

        focus:border-primary/45
        focus:ring-2
        focus:ring-primary/10
      "
    />
  );
}

/* -------------------------------------------------------------------------- */
/*                             Selection button                               */
/* -------------------------------------------------------------------------- */

function ChoiceGroup<T extends string>({
  value,
  items,
  onChange,
  columns = 3,
}: {
  value: T;
  items: Array<{
    value: T;
    label: string;
  }>;
  onChange: (value: T) => void;
  columns?: number;
}) {
  return (
    <div
      className="
        grid gap-1
        rounded-xl
        bg-muted/60
        p-1
      "
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {items.map((item) => {
        const active = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              `
                min-w-0
                rounded-lg

                px-2
                py-2.5

                text-[10px]
                font-black

                transition-all
                duration-200
              `,
              active
                ? `
                  bg-card
                  text-foreground
                  shadow-sm
                `
                : `
                  text-muted-foreground
                  hover:text-foreground
                `,
            )}
          >
            <span className="block truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Range component                               */
/* -------------------------------------------------------------------------- */

function RangeFields({
  fromLabel,
  toLabel,
  fromValue,
  toValue,
  fromPlaceholder,
  toPlaceholder,
  onFromChange,
  onToChange,
  min,
  max,
}: {
  fromLabel: string;
  toLabel: string;
  fromValue: number | null;
  toValue: number | null;
  fromPlaceholder: string;
  toPlaceholder: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <label className="min-w-0">
        <span className="mb-1.5 block text-[10px] font-bold text-muted-foreground">
          {fromLabel}
        </span>

        <NumberField
          value={fromValue}
          placeholder={fromPlaceholder}
          onChange={onFromChange}
          min={min}
          max={max}
        />
      </label>

      <label className="min-w-0">
        <span className="mb-1.5 block text-[10px] font-bold text-muted-foreground">
          {toLabel}
        </span>

        <NumberField
          value={toValue}
          placeholder={toPlaceholder}
          onChange={onToChange}
          min={min}
          max={max}
        />
      </label>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Panel                                   */
/* -------------------------------------------------------------------------- */

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
    <div
      className={cn(
        "transition-opacity duration-200",
        pending && "opacity-60",
        className,
      )}
    >
      {/* Basic information */}

      <Section title="مشخصات کتاب" description="ژانر، نویسنده، کشور و زبان">
        <div className="space-y-3">
          {!hideGenreFilter ? (
            <SelectField
              label="ژانر"
              value={draft.genre}
              placeholder="همه ژانرها"
              options={options.genres}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  genre: value,
                  page: 1,
                }))
              }
            />
          ) : null}

          {!hideAuthorFilter ? (
            <SelectField
              label="نویسنده"
              value={draft.author}
              placeholder="همه نویسنده‌ها"
              options={options.authors}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  author: value,
                  page: 1,
                }))
              }
            />
          ) : null}

          <div className="grid grid-cols-2 gap-2.5">
            {!hideCountryFilter ? (
              <SelectField
                label="کشور"
                value={draft.country}
                placeholder="همه کشورها"
                options={options.countries}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    country: value,
                    page: 1,
                  }))
                }
              />
            ) : null}

            <SelectField
              label="زبان"
              value={draft.language}
              placeholder="همه زبان‌ها"
              options={options.languages}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  language: value,
                  page: 1,
                }))
              }
            />
          </div>
        </div>
      </Section>

      <Separator />

      {/* Edition */}

      <Section title="نسخه و انتشار" description="اطلاعات نسخه فارسی و انتشار">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {!hideTranslatorFilter ? (
              <SelectField
                label="مترجم"
                value={draft.translator}
                placeholder="همه مترجم‌ها"
                options={options.translators}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    translator: value,
                    page: 1,
                  }))
                }
              />
            ) : null}

            {!hidePublisherFilter ? (
              <SelectField
                label="ناشر"
                value={draft.publisher}
                placeholder="همه ناشرها"
                options={options.publishers}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    publisher: value,
                    page: 1,
                  }))
                }
              />
            ) : null}
          </div>

          <div>
            <span className="mb-1.5 block text-[10px] font-bold text-muted-foreground">
              وضعیت جلد
            </span>

            <ChoiceGroup
              value={draft.hasCover}
              columns={3}
              onChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  hasCover: value,
                  page: 1,
                }))
              }
              items={[
                {
                  value: "any",
                  label: "همه",
                },
                {
                  value: "with",
                  label: "دارای جلد",
                },
                {
                  value: "without",
                  label: "بدون جلد",
                },
              ]}
            />
          </div>

          <RangeFields
            fromLabel="سال از"
            toLabel="سال تا"
            fromValue={draft.minYear}
            toValue={draft.maxYear}
            fromPlaceholder="مثلاً ۱۳۵۰"
            toPlaceholder="مثلاً ۱۴۰۵"
            min={0}
            max={3000}
            onFromChange={(value) =>
              updateNumber(
                value,
                (next) =>
                  setDraft((current) => ({
                    ...current,
                    minYear: next,
                    page: 1,
                  })),
                0,
                3000,
              )
            }
            onToChange={(value) =>
              updateNumber(
                value,
                (next) =>
                  setDraft((current) => ({
                    ...current,
                    maxYear: next,
                    page: 1,
                  })),
                0,
                3000,
              )
            }
          />
        </div>
      </Section>

      <Separator />

      {/* Rating */}

      <Section title="امتیاز">
        <RangeFields
          fromLabel="حداقل امتیاز"
          toLabel="حداکثر امتیاز"
          fromValue={draft.minRating}
          toValue={draft.maxRating}
          fromPlaceholder="۱"
          toPlaceholder="۵"
          min={1}
          max={5}
          onFromChange={(value) =>
            updateNumber(
              value,
              (next) =>
                setDraft((current) => ({
                  ...current,
                  minRating: next,
                  page: 1,
                })),
              1,
              5,
            )
          }
          onToChange={(value) =>
            updateNumber(
              value,
              (next) =>
                setDraft((current) => ({
                  ...current,
                  maxRating: next,
                  page: 1,
                })),
              1,
              5,
            )
          }
        />
      </Section>

      <Separator />

      {/* Page count */}

      <Section title="تعداد صفحات">
        <RangeFields
          fromLabel="حداقل صفحات"
          toLabel="حداکثر صفحات"
          fromValue={draft.minPages}
          toValue={draft.maxPages}
          fromPlaceholder="مثلاً ۱۰۰"
          toPlaceholder="مثلاً ۵۰۰"
          min={1}
          onFromChange={(value) =>
            updateNumber(
              value,
              (next) =>
                setDraft((current) => ({
                  ...current,
                  minPages: next,
                  page: 1,
                })),
              1,
            )
          }
          onToChange={(value) =>
            updateNumber(
              value,
              (next) =>
                setDraft((current) => ({
                  ...current,
                  maxPages: next,
                  page: 1,
                })),
              1,
            )
          }
        />
      </Section>
    </div>
  );
}

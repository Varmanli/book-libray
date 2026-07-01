"use client";

import { cn } from "@/lib/utils";
import { MOOD_TAGS } from "@/lib/book/moods";

/** چیپ‌های چندانتخابی حس کتاب. */
export default function MoodChips({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const toggle = (tag: string) => {
    if (disabled) return;
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]
    );
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MOOD_TAGS.map((tag) => {
        const active = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => toggle(tag)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60",
              active
                ? "border-primary/40 bg-primary/15 text-primary"
                : "border-border bg-background/50 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}

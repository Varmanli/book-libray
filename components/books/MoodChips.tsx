"use client";

import { cn } from "@/lib/utils";
import { MOOD_TAGS } from "@/lib/book/moods";

/** چیپ‌های چندانتخابی حس کتاب. */
export default function MoodChips({
  value,
  onChange,
  disabled,
  suggestedTags = [],
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /** Suggested tags are shown first; every supported tag remains selectable. */
  suggestedTags?: string[];
}) {
  const toggle = (tag: string) => {
    if (disabled) return;
    onChange(
      value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag]
    );
  };

  const orderedTags = [...MOOD_TAGS].sort((a, b) => {
    const aIndex = suggestedTags.indexOf(a);
    const bIndex = suggestedTags.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return (
    <div className="flex flex-wrap gap-2">
      {orderedTags.map((tag) => {
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

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BlogCategoryOption } from "@/lib/blog/service";

/** انتخابگرِ جست‌وجوپذیرِ دسته‌بندی بلاگ (تک‌انتخابی). */
export default function BlogCategorySelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string | null;
  onChange: (id: string) => void;
  options: BlogCategoryOption[];
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.id === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-border/70 bg-background/75 px-4 text-sm font-medium text-foreground outline-none transition-colors hover:border-border focus-visible:border-primary/50 focus-visible:ring-[3px] focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={cn(!selected && "text-muted-foreground")}>
          {selected ? selected.name : "انتخاب دسته‌بندی..."}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {open ? (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border/70 bg-popover shadow-[0_28px_80px_-50px_rgba(0,0,0,0.9)] backdrop-blur-md">
          <div className="relative border-b border-border/60 p-2">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی دسته‌بندی..."
              className="h-9 w-full rounded-xl border border-border/60 bg-background/60 pe-3 ps-9 text-sm outline-none focus-visible:border-primary/50"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto p-1.5" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                دسته‌بندی‌ای پیدا نشد. ابتدا از بخش «دسته‌بندی‌های بلاگ» یکی بساز.
              </li>
            ) : (
              filtered.map((o) => {
                const active = o.id === value;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onChange(o.id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary/15 text-primary"
                          : "text-foreground hover:bg-foreground/5",
                      )}
                    >
                      <span className="truncate">{o.name}</span>
                      {active ? <Check className="h-4 w-4 shrink-0" /> : null}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

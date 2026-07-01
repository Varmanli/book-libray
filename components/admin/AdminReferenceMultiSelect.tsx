"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ReferenceTypeValue } from "@/lib/validations/reference";

type Option = {
  id: string;
  name: string;
};

export default function AdminReferenceMultiSelect({
  type,
  values,
  onChange,
  placeholder,
  disabled = false,
  invalid = false,
}: {
  type: ReferenceTypeValue;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Option[]>([]);

  useEffect(() => {
    if (!open) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/reference?type=${type}&q=${encodeURIComponent(query.trim())}`,
          { credentials: "include", signal: ctrl.signal },
        );
        const data = (await response.json()) as { items?: Option[] };
        setItems(data.items ?? []);
      } catch (error) {
        if (!(error instanceof DOMException)) setItems([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
      setLoading(false);
    };
  }, [open, query, type]);

  const trimmedQuery = query.trim();
  const canCreate = trimmedQuery.length > 0 && !values.includes(trimmedQuery);
  const normalizedItems = useMemo(() => {
    const filtered = items.filter((item) => !values.includes(item.name));
    return canCreate
      ? [{ id: "__create__", name: trimmedQuery }, ...filtered]
      : filtered;
  }, [canCreate, items, trimmedQuery, values]);

  const addValue = (next: string) => {
    if (!next.trim()) return;
    if (values.includes(next.trim())) return;
    onChange([...values, next.trim()]);
    setQuery("");
  };

  return (
    <div className="relative" ref={wrapRef}>
      <div
        className={cn(
          "rounded-[1.35rem] border border-border/70 bg-background/75 p-3 transition focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/15",
          invalid && "border-destructive/60",
        )}
      >
        <div className="mb-2 flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary/15"
            >
              <span>{value}</span>
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            disabled={disabled}
            aria-invalid={invalid}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && trimmedQuery) {
                event.preventDefault();
                addValue(trimmedQuery);
                setOpen(false);
              }
            }}
            className="h-10 border-0 bg-transparent pr-7 pl-8 shadow-none focus-visible:ring-0"
          />
          <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        </div>
      </div>

      {open ? (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[1.2rem] border border-border/80 bg-card/95 p-1.5 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl">
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {normalizedItems.map((item) => {
              const isCreate = item.id === "__create__";
              const isSelected = values.includes(item.name);

              return (
                <button
                  key={`${item.id}-${item.name}`}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    addValue(item.name);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-right text-sm text-foreground transition hover:bg-white/5"
                >
                  <span className="truncate">
                    {isCreate ? `افزودن «${item.name}»` : item.name}
                  </span>
                  {isCreate ? (
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                  ) : isSelected ? (
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}

            {!loading && normalizedItems.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                موردی پیدا نشد
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ReferenceTypeValue } from "@/lib/validations/reference";

interface ReferenceItem {
  id: string;
  name: string;
}

interface ReferenceSelectProps {
  type: ReferenceTypeValue;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
}

/**
 * کمبوباکس مرجع: جست‌وجوی مقادیر تأییدشده + امکان پیشنهاد مقدار جدید.
 * مقدار نهایی همان متن داخل ورودی است (آزاد)، و سرور هنگام ثبت، مقدار تازه را
 * به‌صورت «در انتظار تأیید» ثبت می‌کند.
 */
export function ReferenceSelect({
  type,
  value,
  onChange,
  id,
  placeholder,
  invalid = false,
  disabled = false,
}: ReferenceSelectProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ReferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // بستن با کلیک بیرون / Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // جست‌وجوی پیشنهادها
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/reference?type=${type}&q=${encodeURIComponent(value.trim())}`,
          { credentials: "include", signal: ctrl.signal }
        );
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        if (!(err instanceof DOMException)) setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [open, value, type]);

  const trimmed = value.trim();
  const exactMatch = items.some(
    (i) => i.name.trim().toLowerCase() === trimmed.toLowerCase()
  );
  const showCreate = trimmed.length > 0 && !exactMatch;

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Input
          id={id}
          value={value}
          disabled={disabled}
          aria-invalid={invalid}
          aria-expanded={open}
          role="combobox"
          autoComplete="off"
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9"
        />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/40"
        >
          {items.map((item) => {
            const selected =
              item.name.trim().toLowerCase() === trimmed.toLowerCase();
            return (
              <li key={item.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(item.name);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-right text-sm text-foreground transition-colors hover:bg-white/5"
                >
                  <span className="truncate">{item.name}</span>
                  {selected && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}

          {showCreate && (
            <li>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm text-primary transition-colors hover:bg-primary/10"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  افزودن «{trimmed}» (پس از تأیید مدیر عمومی می‌شود)
                </span>
              </button>
            </li>
          )}

          {!loading && items.length === 0 && !showCreate && (
            <li className="px-3 py-2 text-center text-sm text-muted-foreground">
              موردی یافت نشد
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

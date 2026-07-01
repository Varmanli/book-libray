"use client";

import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  EXTERNAL_LINK_PROVIDERS,
  EXTERNAL_LINK_TYPES,
  PROVIDER_LABELS,
  TYPE_LABELS,
  type ExternalLinkProviderValue,
  type ExternalLinkTypeValue,
} from "@/lib/book/external-links-meta";

export interface ExternalLinkDraft {
  provider: ExternalLinkProviderValue;
  type: ExternalLinkTypeValue;
  url: string;
  label: string;
  isActive: boolean;
}

export function emptyExternalLinkDraft(): ExternalLinkDraft {
  return {
    provider: "taaghche",
    type: "ebook",
    url: "",
    label: "",
    isActive: true,
  };
}

const MAX_LINKS = 20;

/**
 * ویرایشگر مقیاس‌پذیرِ لینک‌های خرید/مطالعه برای فرم ادمین. در هر دو حالت
 * ساخت/ویرایش استفاده می‌شود. وضعیت لینک‌ها را والد نگه می‌دارد (controlled).
 */
export default function AdminBookExternalLinksEditor({
  value,
  onChange,
}: {
  value: ExternalLinkDraft[];
  onChange: (links: ExternalLinkDraft[]) => void;
}) {
  const update = (index: number, patch: Partial<ExternalLinkDraft>) =>
    onChange(value.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const remove = (index: number) =>
    onChange(value.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = () => {
    if (value.length >= MAX_LINKS) return;
    onChange([...value, emptyExternalLinkDraft()]);
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border/70 bg-background/40 px-4 py-6 text-center text-xs text-muted-foreground">
          هنوز لینکی اضافه نشده است.
        </p>
      ) : (
        <ul className="space-y-3">
          {value.map((link, index) => {
            const needsLabel = link.provider === "other" && !link.label.trim();
            return (
              <li
                key={index}
                className="rounded-[1.4rem] border border-border/70 bg-background/45 p-3 sm:p-4"
              >
                <div className="flex flex-col gap-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      value={link.provider}
                      onValueChange={(v) =>
                        update(index, {
                          provider: v as ExternalLinkProviderValue,
                        })
                      }
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="فروشگاه" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXTERNAL_LINK_PROVIDERS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {PROVIDER_LABELS[p]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={link.type}
                      onValueChange={(v) =>
                        update(index, { type: v as ExternalLinkTypeValue })
                      }
                    >
                      <SelectTrigger className="h-11 rounded-2xl">
                        <SelectValue placeholder="نوع نسخه" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXTERNAL_LINK_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Input
                    dir="ltr"
                    value={link.url}
                    onChange={(e) => update(index, { url: e.target.value })}
                    placeholder="https://..."
                    className="h-11 rounded-2xl border-border/70 bg-background/75"
                  />

                  <Input
                    value={link.label}
                    onChange={(e) => update(index, { label: e.target.value })}
                    placeholder={
                      link.provider === "other"
                        ? "برچسب (الزامی برای «سایر»)"
                        : "برچسب دلخواه (اختیاری)"
                    }
                    className={
                      "h-11 rounded-2xl border-border/70 bg-background/75" +
                      (needsLabel ? " border-destructive/60" : "")
                    }
                  />

                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <input
                        type="checkbox"
                        checked={link.isActive}
                        onChange={(e) =>
                          update(index, { isActive: e.target.checked })
                        }
                        className="h-4 w-4 accent-[var(--primary)]"
                      />
                      فعال
                    </label>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="بالا"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="پایین"
                        disabled={index === value.length - 1}
                        onClick={() => move(index, 1)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="حذف"
                        title="حذف"
                        onClick={() => remove(index)}
                        className="rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={add}
        disabled={value.length >= MAX_LINKS}
        className="h-11 w-full gap-2 rounded-2xl"
      >
        <Plus className="h-4 w-4" />
        افزودن لینک
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </div>
  );
}

"use client";

import { ChevronLeft } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getReaderRank, READER_RANKS } from "@/lib/profile/rank";

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

function thresholdLabel(min: number, max: number | null) {
  if (max === null) return `${fa(min)}+ کتاب`;
  if (min === max) return `${fa(min)} کتاب`;
  return `${fa(min)}–${fa(max)} کتاب`;
}

export default function ReaderRankBadge({ finished }: { finished: number }) {
  const { rank, next, toNext, progressPct, isMax } = getReaderRank(finished);
  const Icon = rank.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`رتبه‌ی کتاب‌خوانی: ${rank.title} — مشاهده‌ی جزئیات`}
          className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/70 px-2.5 py-1.5 shadow-sm shadow-black/5 backdrop-blur-sm transition-colors hover:border-primary/20 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <span
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full ring-1",
              rank.badgeClass,
              rank.accent
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="text-xs font-bold text-foreground">{rank.title}</span>
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
        </button>
      </DialogTrigger>

        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-[1.7rem] border-border/80 bg-card/95 shadow-[0_28px_80px_-44px_rgba(0,0,0,0.45)] sm:max-w-md">
        <DialogTitle className="sr-only">رتبه‌ی کتاب‌خوانی</DialogTitle>
        <DialogDescription className="sr-only">
          رتبه بر پایه‌ی تعداد کتاب‌های خوانده‌شده محاسبه می‌شود.
        </DialogDescription>

        {/* current rank */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1",
              rank.badgeClass,
              rank.accent
            )}
          >
            <Icon className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-black text-foreground">{rank.title}</h2>
            <p className="text-xs text-muted-foreground">
              {fa(finished)} کتاب خوانده‌شده
            </p>
          </div>
        </div>

        {/* progress to next */}
        <div className="rounded-[1.2rem] border border-border/80 bg-background/55 p-3">
          {isMax ? (
            <p className="text-sm font-medium text-primary">
              بالاترین رتبه را به‌دست آورده‌ای. 👑
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground">
                  {fa(toNext)} کتاب تا «{next?.title}»
                </span>
                <span className="tabular-nums text-muted-foreground">
                  {fa(Math.round(progressPct))}٪
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </>
          )}
        </div>

        {/* full ladder */}
        <ul className="space-y-1.5">
          {READER_RANKS.map((r) => {
            const RankIcon = r.icon;
            const isCurrent = r.level === rank.level;
            return (
              <li
                key={r.key}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors",
                  isCurrent
                    ? "bg-primary/8 ring-1 ring-primary/15"
                    : "opacity-70"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
                    r.badgeClass,
                    r.accent
                  )}
                >
                  <RankIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {r.title}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {thresholdLabel(r.min, r.max)}
                  </p>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-bold text-primary">
                    رتبه‌ی فعلی
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>

        <p className="text-center text-[11px] leading-5 text-muted-foreground">
          رتبه بر پایه‌ی تعداد کتاب‌های خوانده‌شده محاسبه می‌شود.
        </p>
      </DialogContent>
    </Dialog>
  );
}

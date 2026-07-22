"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  Check,
  ChevronLeft,
  Loader2,
  LogIn,
  LibraryBig,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import MoodChips from "@/components/books/MoodChips";
import { cn } from "@/lib/utils";
import type { BookStatus, ViewerLibraryEntry } from "@/lib/book/detail-service";

const STATUSES: { key: BookStatus; label: string; hint: string }[] = [
  { key: "UNREAD", label: "می‌خواهم بخوانم", hint: "برای بعد نگه‌دار" },
  { key: "READING", label: "درحال خواندن", hint: "در جریان مطالعه" },
  { key: "PAUSED", label: "متوقف‌شده", hint: "برای ادامه در زمان دیگر" },
  { key: "FINISHED", label: "خوانده‌شده", hint: "کتاب را تمام کرده‌ای" },
];

const STATUS_LABEL: Record<BookStatus, string> = {
  UNREAD: "می‌خواهم بخوانم",
  READING: "درحال خواندن",
  PAUSED: "متوقف‌شده",
  FINISHED: "خوانده‌شده",
};

export default function ReadingStatusControl({
  subjectBookId,
  bookTitle,
  viewer,
  isLoggedIn,
  loginHref,
  selectedEditionId = null,
  showPersonalBookLink = true,
  hidePersonalRating = false,
}: {
  subjectBookId: string;
  bookTitle: string;
  viewer: ViewerLibraryEntry | null;
  isLoggedIn: boolean;
  loginHref: string;
  averageRating?: number | null;
  ratingCount?: number;
  selectedEditionId?: string | null;
  showPersonalBookLink?: boolean;
  hidePersonalRating?: boolean;
}) {
  const router = useRouter();

  const [statusOpen, setStatusOpen] = useState(false);
  const [startOpen, setStartOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [followEntryId, setFollowEntryId] = useState<string | null>(null);
  const [followStatus, setFollowStatus] = useState<BookStatus | null>(null);
  const [followRating, setFollowRating] = useState(0);
  const [followNote, setFollowNote] = useState("");
  const [followMoods, setFollowMoods] = useState<string[]>([]);
  const [startingPage, setStartingPage] = useState("0");

  async function patch(entryId: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/books/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "خطا در ذخیره تغییرات");
    }
  }

  async function chooseStatus(status: BookStatus) {
    if (status === "READING") {
      setStartingPage(String(viewer?.currentPage ?? 0));
      setStatusOpen(false);
      setStartOpen(true);
      return;
    }
    setBusy(true);

    try {
      let entryId = viewer?.id ?? null;

      if (entryId) {
        await patch(entryId, { status });
      } else {
        const res = await fetch(`/api/book/${subjectBookId}/library`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            editionId: selectedEditionId ?? undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "خطا در افزودن کتاب");

        entryId = data.bookId as string;
      }

      setStatusOpen(false);
      toast.success("وضعیت خواندن ذخیره شد");

      if (status === "FINISHED") {
        setFollowEntryId(entryId);
        setFollowStatus(status);
        setFollowRating(viewer?.rating ?? 0);
        setFollowNote(viewer?.privateNote ?? "");
        setFollowMoods(viewer?.moodTags ?? []);
        setFollowOpen(true);
      } else {
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function startReading() {
    const page = Number(startingPage);
    if (
      !Number.isInteger(page) ||
      page < 0 ||
      (viewer?.pageCount && page > viewer.pageCount)
    ) {
      toast.error(
        viewer?.pageCount
          ? `شماره صفحه باید بین ۰ تا ${viewer.pageCount} باشد`
          : "شماره صفحه نامعتبر است",
      );
      return;
    }

    setBusy(true);
    try {
      let entryId = viewer?.id ?? null;
      if (entryId) {
        const response = await fetch(`/api/books/${entryId}/reading-progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "READING", currentPage: page }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "شروع مطالعه ناموفق بود");
      } else {
        const response = await fetch(`/api/book/${subjectBookId}/library`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "READING",
            editionId: selectedEditionId ?? undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "خطا در افزودن کتاب");
        entryId = data.bookId as string;
        const progressResponse = await fetch(
          `/api/books/${entryId}/reading-progress`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "READING", currentPage: page }),
          },
        );
        const progressData = await progressResponse.json();
        if (!progressResponse.ok)
          throw new Error(progressData.error || "ثبت صفحه‌ی شروع ناموفق بود");
      }
      setStartOpen(false);
      toast.success("مطالعه را شروع کردی");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "خطا در شروع مطالعه",
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveFollowup() {
    if (!followEntryId) return;

    setBusy(true);

    try {
      await patch(followEntryId, {
        rating: followRating || null,
        review: followNote.trim() || null,
        moodTags: followMoods,
      });

      toast.success("ذخیره شد");
      setFollowOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  function skipFollowup() {
    setFollowOpen(false);
    router.refresh();
  }

  async function saveRatingAndMoods(rating: number, moods: string[]) {
    if (!viewer) return;

    setBusy(true);

    try {
      await patch(viewer.id, { rating: rating || null, moodTags: moods });
      toast.success("ذخیره شد");
      router.refresh();
    } catch {
      toast.error("ثبت امتیاز ناموفق بود");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="w-full rounded-[1.6rem] border border-border/75 bg-background/60 p-3 shadow-[0_16px_44px_-34px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <p className="mb-3 text-center text-xs leading-6 text-muted-foreground">
          برای افزودن این کتاب به قفسه‌ات وارد شو.
        </p>

        <Button
          asChild
          className="h-11 w-full rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary/90"
        >
          <a href={loginHref}>
            <LogIn className="h-4 w-4" />
            ورود
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setStatusOpen(true)}
          disabled={busy}
          className="group flex h-12 w-full items-center justify-between gap-3 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <BookMarked className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {viewer ? STATUS_LABEL[viewer.status] : "وضعیت خواندن"}
            </span>
          </span>

          <ChevronLeft className="h-4 w-4 shrink-0 opacity-75 transition-transform group-hover:-translate-x-0.5" />
        </button>

        {viewer && (showPersonalBookLink || !hidePersonalRating) ? (
          <div className="grid grid-cols-1 gap-2.5 ">
            {!hidePersonalRating ? (
              <RatingSummary
                value={viewer.rating ?? 0}
                moods={viewer.moodTags ?? []}
                onSubmit={saveRatingAndMoods}
                disabled={busy}
              />
            ) : null}

            {showPersonalBookLink ? (
              <PersonalBookLink bookId={subjectBookId} />
            ) : null}
          </div>
        ) : null}
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-sm">
          <DialogTitle className="text-base font-black text-foreground">
            وضعیت خواندن
          </DialogTitle>

          <DialogDescription className="text-xs leading-6 text-muted-foreground">
            وضعیت این کتاب را در کتابخانه‌ات انتخاب کن.
          </DialogDescription>

          <div className="mt-4 space-y-2">
            {STATUSES.map((status) => {
              const active = viewer?.status === status.key;

              return (
                <button
                  key={status.key}
                  type="button"
                  disabled={busy}
                  onClick={() => chooseStatus(status.key)}
                  className={cn(
                    "group flex w-full items-center justify-between rounded-2xl border p-3 text-right transition-all disabled:opacity-60",
                    active
                      ? "border-primary/30 bg-primary/10"
                      : "border-border bg-background/50 hover:border-primary/20 hover:bg-background/80 dark:bg-white/[0.025] dark:hover:bg-white/[0.05]",
                  )}
                >
                  <span>
                    <span className="block text-sm font-black text-foreground">
                      {status.label}
                    </span>

                    <span className="mt-0.5 block text-xs leading-6 text-muted-foreground">
                      {status.hint}
                    </span>
                  </span>

                  {active ? (
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={startOpen} onOpenChange={setStartOpen}>
        <DialogContent className="rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-sm">
          <DialogTitle className="text-base font-black text-foreground">
            شروع مطالعه
          </DialogTitle>
          <DialogDescription className="text-xs leading-6 text-muted-foreground">
            صفحه‌ای که از آن شروع می‌کنی را ثبت کن تا همیشه جای خودت را داشته
            باشی.
          </DialogDescription>
          <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.06] p-3">
            <p className="text-xs text-muted-foreground">کتاب</p>
            <p className="mt-1 text-sm font-black text-foreground">
              {bookTitle}
            </p>
          </div>
          <div className="mt-4 space-y-2">
            <label className="text-xs font-bold text-foreground">
              صفحه‌ی فعلی
              {viewer?.pageCount
                ? ` از ${viewer.pageCount.toLocaleString("fa-IR")}`
                : ""}
            </label>
            <Input
              type="number"
              inputMode="numeric"
              min="0"
              max={viewer?.pageCount ?? undefined}
              value={startingPage}
              onChange={(event) => setStartingPage(event.target.value)}
              className="h-11 rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground">
              می‌توانی از صفحه‌ی صفر شروع کنی یا شماره‌ی صفحه‌ای که در آن هستی
              را وارد کنی.
            </p>
          </div>
          <Button
            type="button"
            disabled={busy}
            onClick={startReading}
            className="mt-5 w-full rounded-xl"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BookMarked className="h-4 w-4" />
            )}
            شروع مطالعه
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={followOpen} onOpenChange={setFollowOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-md">
          <DialogTitle className="text-base font-black text-foreground">
            {followStatus === "FINISHED"
              ? "این کتاب چطور بود؟"
              : "شروع خوبی داشته؟"}
          </DialogTitle>

          <DialogDescription className="text-xs leading-6 text-muted-foreground">
            اختیاری است؛ می‌توانی بعداً هم تکمیلش کنی.
          </DialogDescription>

          <div className="mt-4 space-y-4">
            <RatingPicker
              value={followRating}
              onPick={setFollowRating}
              disabled={busy}
            />

            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">
                این کتاب چه حسی داشت؟
              </p>

              <MoodChips
                value={followMoods}
                onChange={setFollowMoods}
                disabled={busy}
              />
            </div>

            <Textarea
              value={followNote}
              onChange={(event) => setFollowNote(event.target.value)}
              placeholder="برداشت شخصی‌ات..."
              className="min-h-28 rounded-2xl border-border bg-background/55 text-sm leading-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/25"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={skipFollowup}
                disabled={busy}
                className="rounded-xl text-foreground hover:bg-background/70 dark:hover:bg-white/[0.05]"
              >
                بعداً
              </Button>

              <Button
                type="button"
                onClick={saveFollowup}
                disabled={busy}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                ذخیره
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RatingSummary({
  value,
  moods,
  onSubmit,
  disabled,
}: {
  value: number;
  moods: string[];
  onSubmit: (rating: number, moods: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [draftMoods, setDraftMoods] = useState<string[]>(moods);

  const hasRating = value > 0;
  const hasMoods = moods.length > 0;

  function openDialog() {
    setDraft(value);
    setDraftMoods(moods);
    setOpen(true);
  }

  function submit() {
    onSubmit(draft, draftMoods);
    setOpen(false);
  }

  function clear() {
    setDraft(0);
    onSubmit(0, draftMoods);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openDialog}
        className={cn(
          "group flex h-12 w-full items-center justify-between gap-3 rounded-2xl border px-3 text-right transition-all disabled:pointer-events-none disabled:opacity-60",
          hasRating
            ? "border-amber-300/30 bg-amber-400/10 text-foreground hover:bg-amber-400/15"
            : "border-border/80 bg-background/55 text-foreground hover:border-primary/25 hover:bg-background/80",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
              hasRating
                ? "border-amber-300/30 bg-amber-400/15 text-amber-700 dark:text-amber-300"
                : "border-border/70 bg-card/70 text-muted-foreground group-hover:text-primary",
            )}
          >
            <Star className={cn("h-4 w-4", hasRating && "fill-current")} />
          </span>

          <span className="min-w-0">
            <span className="mt-0.5 block truncate text-[10px] font-medium text-muted-foreground">
              {hasMoods ? moods.slice(0, 2).join("، ") : "حس و امتیاز کتاب"}
            </span>
          </span>
        </span>

        <span
          className={cn(
            "shrink-0 rounded-xl border px-2.5 py-1 text-[11px] font-black tabular-nums",
            hasRating
              ? "border-amber-300/30 bg-amber-400/15 text-amber-800 dark:text-amber-300"
              : "border-border/70 bg-card/75 text-muted-foreground",
          )}
        >
          {hasRating ? `${value.toLocaleString("fa-IR")} / ۱۰` : "ثبت"}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-md">
          <DialogTitle className="text-base font-black text-foreground">
            امتیاز تو به کتاب
          </DialogTitle>

          <DialogDescription className="text-xs leading-6 text-muted-foreground">
            امتیاز شخصی خودت را از ۱ تا ۱۰ ثبت کن و حس کتاب را انتخاب کن.
          </DialogDescription>

          <div className="mt-5 space-y-5">
            <RatingPicker value={draft} onPick={setDraft} disabled={disabled} />

            <div className="space-y-2">
              <p className="text-xs font-bold text-foreground">حس کتاب</p>

              <MoodChips
                value={draftMoods}
                onChange={setDraftMoods}
                disabled={disabled}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={clear}
                disabled={disabled || !value}
                className="rounded-xl text-xs text-muted-foreground hover:bg-background/70 hover:text-foreground dark:hover:bg-white/[0.05]"
              >
                حذف امتیاز
              </Button>

              <Button
                type="button"
                onClick={submit}
                disabled={disabled}
                className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                ثبت امتیاز
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RatingPicker({
  value,
  onPick,
  disabled,
}: {
  value: number;
  onPick: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">ضعیف</span>

        <span className="rounded-full border border-border bg-background/70 px-2.5 py-1 font-bold tabular-nums text-foreground">
          {value ? `${value.toLocaleString("fa-IR")} از ۱۰` : "انتخاب نشده"}
        </span>

        <span className="text-muted-foreground">عالی</span>
      </div>

      <div
        role="radiogroup"
        aria-label="امتیاز"
        className="grid grid-cols-10 gap-1.5"
      >
        {Array.from({ length: 10 }, (_, index) => index + 1).map((rating) => {
          const active = rating <= value;
          const selected = rating === value;

          return (
            <button
              key={rating}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${rating} از ۱۰`}
              disabled={disabled}
              onClick={() => onPick(rating)}
              className={cn(
                "h-9 rounded-lg border border-border bg-background/60 text-xs font-black tabular-nums text-muted-foreground transition-all disabled:opacity-60",
                "hover:border-primary/25 hover:bg-primary/10 hover:text-primary",
                active &&
                  "border-amber-300/30 bg-amber-400/10 text-amber-800 dark:text-amber-300",
                selected &&
                  "scale-105 border-amber-400/45 bg-amber-400/20 shadow-[0_0_0_3px_rgba(245,158,11,0.10)]",
              )}
            >
              {rating.toLocaleString("fa-IR")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PersonalBookLink({
  bookId,
  href = `/book/${encodeURIComponent(bookId)}/my`,
}: {
  bookId: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.07] px-3 text-right transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/[0.11]"
    >
      <span className="inline-flex min-w-0 items-center gap-2.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/12 text-primary">
          <LibraryBig className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-black text-foreground">
            مطالعه من
          </span>
        </span>
      </span>
      <ChevronLeft className="h-4 w-4 shrink-0 text-primary/70 transition-transform group-hover:-translate-x-0.5" />
    </Link>
  );
}

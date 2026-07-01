"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookMarked,
  Check,
  ChevronLeft,
  Loader2,
  LogIn,
  NotebookPen,
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
import MoodChips from "@/components/books/MoodChips";
import { cn } from "@/lib/utils";
import type { BookStatus, ViewerLibraryEntry } from "@/lib/book/detail-service";

const STATUSES: { key: BookStatus; label: string; hint: string }[] = [
  { key: "UNREAD", label: "می‌خواهم بخوانم", hint: "برای بعد نگه‌دار" },
  { key: "READING", label: "درحال خواندن", hint: "در جریان مطالعه" },
  { key: "FINISHED", label: "خوانده‌شده", hint: "کتاب را تمام کرده‌ای" },
];

const STATUS_LABEL: Record<BookStatus, string> = {
  UNREAD: "می‌خواهم بخوانم",
  READING: "درحال خواندن",
  FINISHED: "خوانده‌شده",
};

export default function ReadingStatusControl({
  subjectBookId,
  viewer,
  isLoggedIn,
  loginHref,
  averageRating = null,
  ratingCount = 0,
}: {
  subjectBookId: string;
  viewer: ViewerLibraryEntry | null;
  isLoggedIn: boolean;
  loginHref: string;
  averageRating?: number | null;
  ratingCount?: number;
}) {
  const router = useRouter();
  const [statusOpen, setStatusOpen] = useState(false);
  const [followOpen, setFollowOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [followEntryId, setFollowEntryId] = useState<string | null>(null);
  const [followStatus, setFollowStatus] = useState<BookStatus | null>(null);
  const [followRating, setFollowRating] = useState(0);
  const [followNote, setFollowNote] = useState("");
  const [followMoods, setFollowMoods] = useState<string[]>([]);

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
    setBusy(true);

    try {
      let entryId = viewer?.id ?? null;

      if (entryId) {
        await patch(entryId, { status });
      } else {
        const res = await fetch(`/api/book/${subjectBookId}/library`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "خطا در افزودن کتاب");

        entryId = data.bookId as string;
      }

      setStatusOpen(false);
      toast.success("وضعیت خواندن ذخیره شد");

      if (status === "READING" || status === "FINISHED") {
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

  async function savePersonalNote(value: string) {
    if (!viewer) return;

    setBusy(true);

    try {
      await patch(viewer.id, { review: value || null });
      toast.success("یادداشت شخصی ذخیره شد");
      router.refresh();
    } catch {
      toast.error("خطا در ذخیره یادداشت");
    } finally {
      setBusy(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="w-full max-w-md rounded-[1.6rem] border border-border/80 bg-card/75 p-3.5 shadow-[0_14px_36px_-28px_rgba(0,0,0,0.45)]">
        <p className="mb-3 text-center text-xs text-muted-foreground">
          برای افزودن این کتاب وارد شو.
        </p>

        <Button
          asChild
          className="h-11 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
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
    <div className="w-full max-w-md">
      <div className="flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setStatusOpen(true)}
          disabled={busy}
          className="flex h-12 w-full items-center justify-between rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-lg shadow-primary/15 transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            {viewer ? STATUS_LABEL[viewer.status] : "وضعیت خواندن"}
          </span>

          <ChevronLeft className="h-4 w-4 opacity-70" />
        </button>

        {viewer ? (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <RatingSummary
              value={viewer.rating ?? 0}
              moods={viewer.moodTags ?? []}
              averageRating={averageRating}
              ratingCount={ratingCount}
              onSubmit={saveRatingAndMoods}
              disabled={busy}
            />

            <PersonalNoteButton
              initial={viewer.privateNote ?? ""}
              disabled={busy}
              onSave={savePersonalNote}
            />
          </div>
        ) : null}
      </div>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-sm">
          <DialogTitle className="text-base font-black text-foreground">
            وضعیت خواندن
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground">
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
                    "flex w-full items-center justify-between rounded-2xl border p-3 text-right transition-colors disabled:opacity-60",
                    active
                      ? "border-primary/30 bg-primary/10"
                      : "border-border bg-white/[0.025] hover:bg-white/[0.05]",
                  )}
                >
                  <span>
                    <span className="block text-sm font-bold text-foreground">
                      {status.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {status.hint}
                    </span>
                  </span>

                  {active ? (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={followOpen} onOpenChange={setFollowOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-md">
          <DialogTitle className="text-base font-black text-foreground">
            {followStatus === "FINISHED"
              ? "این کتاب چطور بود؟"
              : "شروع خوبی داشته؟"}
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground">
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
              className="min-h-28 rounded-2xl border-border bg-background/45 text-sm leading-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/25"
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={skipFollowup}
                disabled={busy}
                className="rounded-xl text-foreground hover:bg-white/[0.05]"
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
  averageRating,
  ratingCount,
  onSubmit,
  disabled,
}: {
  value: number;
  moods: string[];
  averageRating: number | null;
  ratingCount: number;
  onSubmit: (rating: number, moods: string[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [draftMoods, setDraftMoods] = useState<string[]>(moods);

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
        className="flex h-12 w-full items-center justify-between rounded-2xl border border-border/80 bg-background/55 px-3.5 text-right transition-colors hover:bg-background/80 disabled:opacity-60"
      >
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Star className="h-3.5 w-3.5" />
          <span>امتیاز کلی</span>
          <span className="font-bold tabular-nums text-foreground">
            {averageRating != null
              ? `${averageRating.toLocaleString("fa-IR")} / ۱۰`
              : "—"}
          </span>
          {averageRating != null && ratingCount > 0 ? (
            <span className="text-[10px] text-muted-foreground">
              ({ratingCount.toLocaleString("fa-IR")})
            </span>
          ) : null}
        </span>

        <span className="rounded-xl border border-border/80 bg-card/80 px-2.5 py-1 text-[11px] font-bold text-foreground">
          {value ? `${value.toLocaleString("fa-IR")} / ۱۰` : "امتیاز بده"}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-md">
          <DialogTitle className="text-base font-black text-foreground">
            امتیاز و حس کتاب
          </DialogTitle>

          <DialogDescription className="text-xs text-muted-foreground">
            امتیاز خودت را از ۱ تا ۱۰ بده و حس کتاب را انتخاب کن.
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
                className="rounded-xl text-xs text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
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
                ثبت
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RatingPicker({
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

        <span className="rounded-full border border-border bg-white/[0.035] px-2.5 py-1 font-bold tabular-nums text-foreground">
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
                "h-9 rounded-lg border border-border bg-white/[0.035] text-xs font-black tabular-nums text-muted-foreground transition-all",
                "hover:border-primary/25 hover:bg-primary/10 hover:text-primary",
                active && "border-primary/20 bg-primary/10 text-primary",
                selected &&
                  "scale-105 border-primary/45 bg-primary/20 shadow-[0_0_0_3px_rgba(128,167,150,0.08)]",
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

function PersonalNoteButton({
  initial,
  onSave,
  disabled,
}: {
  initial: string;
  onSave: (value: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  const hasNote = initial.trim().length > 0;
  const dirty = value.trim() !== initial.trim();

  async function save() {
    setSaving(true);

    try {
      await onSave(value.trim());
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setValue(initial);
          setOpen(true);
        }}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border px-3.5 text-xs font-medium transition-colors disabled:opacity-60",
          hasNote
            ? "border-primary/20 bg-primary/[0.08] text-primary hover:bg-primary/[0.12]"
            : "border-border/80 bg-background/55 text-foreground hover:bg-background/80",
        )}
      >
        <span className="inline-flex items-center gap-2">
          <NotebookPen
            className={cn(
              "h-3.5 w-3.5",
              hasNote ? "text-primary" : "text-muted-foreground",
            )}
          />
          یادداشت شخصی
        </span>

        <span
          className={cn(
            "rounded-lg px-2 py-1 text-[10px] font-bold",
            hasNote
              ? "bg-primary/12 text-primary"
              : "bg-card/80 text-muted-foreground",
          )}
        >
          {hasNote ? "دارد" : "افزودن"}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-md">
          <DialogTitle className="text-base font-black text-foreground">
            یادداشت شخصی
          </DialogTitle>

          <DialogDescription className="text-xs leading-6 text-muted-foreground">
            این یادداشت فقط برای خودت ذخیره می‌شود و در پروفایل یا صفحه کتاب
            نمایش داده نمی‌شود.
          </DialogDescription>

          <div className="mt-4 space-y-3">
            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="برداشت خصوصی‌ات از این کتاب..."
              className="min-h-36 rounded-2xl border-border bg-background/45 text-sm leading-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/25"
            />

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setValue("")}
                disabled={saving || !value.trim()}
                className="rounded-xl text-xs text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              >
                پاک کردن
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setValue(initial);
                    setOpen(false);
                  }}
                  disabled={saving}
                  className="rounded-xl text-foreground hover:bg-white/[0.05]"
                >
                  بستن
                </Button>

                <Button
                  type="button"
                  disabled={saving || !dirty}
                  onClick={save}
                  className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  ذخیره
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

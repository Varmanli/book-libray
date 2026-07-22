"use client";

import { useState } from "react";
import { BookOpen, Check, Loader2, Pause, Pencil, Plus } from "lucide-react";
import toast from "react-hot-toast";

import BookCoverImage from "@/components/books/BookCoverImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MoodChips from "@/components/books/MoodChips";
import { RatingPicker } from "@/components/books/ReadingStatusControl";
import type { ViewerLibraryEntry } from "@/lib/book/detail-service";

export type ReadingBook = {
  id: string;
  title: string;
  author: string;
  coverImage: string | null;
  pageCount: number | null;
  currentPage: number;
  progress: number;
  readingUpdatedAt: Date | null;
  rating?: number | null;
  review?: string | null;
  moodTags?: string[] | null;
};

export function readingPercent(
  book: Pick<ReadingBook, "pageCount" | "currentPage" | "progress">,
) {
  return book.pageCount && book.pageCount > 0
    ? Math.round((book.currentPage / book.pageCount) * 100)
    : book.progress;
}

function reflectionFor(rating: number) {
  if (rating <= 0)
    return {
      emoji: "📖",
      title: "حس این سفر چه بود؟",
      description:
        "امتیازت کمک می‌کند این تجربه را برای خودت به یادگار نگه داری.",
      reviewTitle: "چه چیزی از این کتاب با تو ماند؟",
      placeholder: "برداشتت از این تجربه را بنویس...",
      suggestions: ["تأمل‌برانگیز", "آرام", "پرکشش"],
    };
  if (rating <= 2)
    return {
      emoji: "😴",
      title: "کسل‌کننده",
      description: "این کتاب پیوند عمیقی با تو برقرار نکرد.",
      reviewTitle: "چه چیزی مانع ارتباطت با کتاب شد؟",
      placeholder: "چه چیزی می‌توانست بهتر باشد؟",
      suggestions: ["سنگین", "تاریک", "تلخ", "آرام"],
    };
  if (rating <= 4)
    return {
      emoji: "🙂",
      title: "معمولی",
      description: "لحظه‌های جالبی داشت، اما کاملاً درگیرت نکرد.",
      reviewTitle: "چه چیزی مانع ارتباطت با کتاب شد؟",
      placeholder: "چه چیزی می‌توانست بهتر باشد؟",
      suggestions: ["سنگین", "تاریک", "تلخ", "آرام"],
    };
  if (rating <= 6)
    return {
      emoji: "👍",
      title: "بد نبود",
      description: "بخش‌هایی لذت‌بخش بود، اما تجربه برایت یک‌دست نبود.",
      reviewTitle: "چه چیزی در ذهنت ماند؟",
      placeholder: "فکرت را درباره‌ی این تجربه بنویس...",
      suggestions: ["پرکشش", "آرام", "امیدوارکننده", "تأمل‌برانگیز"],
    };
  if (rating <= 8)
    return {
      emoji: "✨",
      title: "درگیرکننده",
      description: "کتاب خوبی بود که ارزش خواندن داشت.",
      reviewTitle: "چه چیزی این کتاب را برایت خاص کرد؟",
      placeholder: "چه چیزی را از این کتاب به یاد خواهی سپرد؟",
      suggestions: ["عمیق", "تأمل‌برانگیز", "الهام‌بخش", "پرکشش", "فلسفی"],
    };
  if (rating === 9)
    return {
      emoji: "🔥",
      title: "درخشان",
      description: "کتابی که بعد از تمام‌شدن هم با تو می‌ماند.",
      reviewTitle: "چه چیزی این کتاب را برایت خاص کرد؟",
      placeholder: "چه چیزی را از این کتاب به یاد خواهی سپرد؟",
      suggestions: ["عمیق", "تأمل‌برانگیز", "الهام‌بخش", "پرکشش", "فلسفی"],
    };
  return {
    emoji: "💎",
    title: "فراموش‌نشدنی",
    description: "از آن کتاب‌هایی که بخشی از داستان شخصی تو می‌شوند.",
    reviewTitle: "چه چیزی این کتاب را برایت خاص کرد؟",
    placeholder: "چه چیزی را از این کتاب به یاد خواهی سپرد؟",
    suggestions: ["عمیق", "تأمل‌برانگیز", "الهام‌بخش", "پرکشش", "فلسفی"],
  };
}

export default function CurrentlyReadingCard({
  viewer,
  title,
  author,
  coverImage,
}: {
  viewer: ViewerLibraryEntry;
  title: string;
  author: string;
  coverImage: string | null;
}) {
  const [book, setBook] = useState<ReadingBook>({
    ...viewer,
    progress: viewer.progress ?? 0,
    title,
    author,
    coverImage,
  });
  const [open, setOpen] = useState(false);
  const percent = readingPercent(book);
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/[0.055] p-4 shadow-[0_18px_42px_-34px_hsl(var(--primary)/0.9)]">
      <div className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <BookOpen className="h-4 w-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-black text-foreground">
              در حال مطالعه
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {book.pageCount
                ? `صفحه ${book.currentPage.toLocaleString("fa-IR")} از ${book.pageCount.toLocaleString("fa-IR")}`
                : "مدیریت پیشرفت مطالعه"}
            </span>
          </span>
        </span>
        <span className="rounded-full bg-primary/12 px-2.5 py-1 text-xs font-black tabular-nums text-primary">
          {percent}%
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full rounded-full bg-gradient-to-l from-primary to-emerald-400 transition-[width] duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button type="button" onClick={() => setOpen(true)} className="h-10 rounded-xl text-xs">
          ادامه مطالعه
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="h-10 rounded-xl text-xs">
          مدیریت مطالعه
        </Button>
      </div>
      <ReadingManagementModal
        book={book}
        open={open}
        onOpenChange={setOpen}
        onUpdated={(next) => setBook((current) => ({ ...current, ...next }))}
      />
    </section>
  );
}

export function ReadingManagementModal({
  book,
  open,
  onOpenChange,
  onUpdated,
  onFinished,
}: {
  book: ReadingBook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (book: Partial<ReadingBook>) => void;
  onFinished?: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(book.currentPage);
  const [draft, setDraft] = useState(String(book.currentPage));
  const [pending, setPending] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [rating, setRating] = useState(book.rating ?? 0);
  const [review, setReview] = useState(book.review ?? "");
  const [moods, setMoods] = useState(book.moodTags ?? []);
  const reflection = reflectionFor(rating);
  const hasPageCount = book.pageCount !== null && book.pageCount > 0;
  const percent = readingPercent({ ...book, currentPage });

  async function progress(
    payload: Record<string, unknown>,
    message = "پیشرفت مطالعه ذخیره شد",
  ) {
    setPending(true);
    try {
      const response = await fetch(`/api/books/${book.id}/reading-progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ثبت پیشرفت ناموفق بود");
      setCurrentPage(data.book.currentPage);
      setDraft(String(data.book.currentPage));
      onUpdated(data.book);
      toast.success(message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "ارتباط با سرور برقرار نشد",
      );
    } finally {
      setPending(false);
    }
  }

  async function finish() {
    setPending(true);
    try {
      const finishResponse = await fetch(
        `/api/books/${book.id}/reading-progress`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "FINISHED", currentPage }),
        },
      );
      const finishData = await finishResponse.json();
      if (!finishResponse.ok)
        throw new Error(finishData.error || "پایان دادن کتاب ناموفق بود");
      if (rating || review.trim() || moods.length) {
        const detailResponse = await fetch(`/api/books/${book.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rating: rating || null,
            review: review.trim() || null,
            moodTags: moods,
          }),
        });
        if (!detailResponse.ok) {
          const detailData = await detailResponse.json().catch(() => ({}));
          throw new Error(detailData.error || "ذخیره‌ی بازخورد ناموفق بود");
        }
      }
      onUpdated({
        ...finishData.book,
        rating: rating || null,
        review: review.trim() || null,
        moodTags: moods,
      });
      setCompletionOpen(false);
      onOpenChange(false);
      toast.success(
        rating
          ? `🎉 به قفسه‌ی خوانده‌شده‌ها اضافه شد · ${rating.toLocaleString("fa-IR")} از ۱۰`
          : "🎉 به قفسه‌ی خوانده‌شده‌ها اضافه شد",
      );
      onFinished?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "اتمام کتاب ناموفق بود",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-card p-5 shadow-2xl sm:max-w-md">
          <DialogTitle className="text-base font-black text-foreground">
            مدیریت مطالعه
          </DialogTitle>
          <DialogDescription className="text-xs leading-6 text-muted-foreground">
            جای خودت را ثبت کن و با آرامش به خواندن ادامه بده.
          </DialogDescription>
          <div className="mt-5 flex gap-3 rounded-2xl border border-border/70 bg-background/45 p-3">
            <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-muted shadow-sm">
              <BookCoverImage
                src={book.coverImage}
                alt={book.title}
                fill
                className="object-cover"
                sizes="56px"
              />
            </div>
            <div className="min-w-0 py-1">
              <p className="line-clamp-2 text-sm font-black leading-6 text-foreground">
                {book.title}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {book.author}
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-end justify-between gap-3 text-xs">
              <span className="font-black text-primary">{percent}%</span>
              <span className="text-muted-foreground">
                {hasPageCount
                  ? `صفحه ${currentPage.toLocaleString("fa-IR")} از ${book.pageCount!.toLocaleString("fa-IR")}`
                  : "تعداد صفحات نامشخص"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-l from-primary to-emerald-400 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
          <div className="mt-5">
            <label className="mb-2 block text-xs font-bold text-foreground">
              صفحه‌ی فعلی
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                inputMode="numeric"
                min="0"
                max={book.pageCount ?? undefined}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="h-10 rounded-xl"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={pending || draft === ""}
                onClick={() => progress({ currentPage: Number(draft) })}
                className="h-10 rounded-xl px-3"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[5, 10, 20].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant="outline"
                size="sm"
                disabled={
                  pending || (hasPageCount && currentPage >= book.pageCount!)
                }
                onClick={() =>
                  progress(
                    hasPageCount
                      ? {
                          currentPage: Math.min(
                            currentPage + amount,
                            book.pageCount!,
                          ),
                        }
                      : { pagesRead: amount },
                  )
                }
                className="h-10 rounded-xl px-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                {amount.toLocaleString("fa-IR")}
              </Button>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => progress({ status: "PAUSED" }, "مطالعه متوقف شد")}
              className="h-11 gap-1.5 rounded-xl"
            >
              <Pause className="h-4 w-4" />
              توقف مطالعه
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={() => setCompletionOpen(true)}
              className="h-11 gap-1.5 rounded-xl"
            >
              <Check className="h-4 w-4" />
              اتمام کتاب
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={completionOpen} onOpenChange={setCompletionOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-border bg-[radial-gradient(circle_at_85%_5%,hsl(var(--primary)/0.15),transparent_38%),hsl(var(--card))] p-5 shadow-2xl sm:max-w-md">
          <DialogTitle className="text-lg font-black text-foreground">
            🎉 سفر کتاب تمام شد
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs leading-6 text-muted-foreground">
            {book.title} چه معنایی برای تو داشت؟
          </DialogDescription>
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-primary/15 bg-primary/[0.06] p-4 text-center transition-all duration-300">
              <p className="text-xs font-bold text-foreground">
                چقدر این کتاب را دوست داشتی؟
              </p>
              <p className="mt-2 text-2xl font-black tabular-nums text-primary">
                {rating ? `${rating.toLocaleString("fa-IR")} / ۱۰` : "؟ / ۱۰"}
              </p>
              <div
                key={rating}
                className="mt-3 animate-in fade-in zoom-in-95 duration-300"
              >
                <p className="text-base font-black text-foreground">
                  {reflection.emoji} {reflection.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {reflection.description}
                </p>
              </div>
            </div>
            <RatingPicker
              value={rating}
              onPick={setRating}
              disabled={pending}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-foreground">
                  حس این کتاب چه بود؟
                </p>
                <span className="text-[10px] text-muted-foreground">
                  پیشنهادها بر اساس امتیاز تو
                </span>
              </div>
              <MoodChips
                value={moods}
                onChange={setMoods}
                disabled={pending}
                suggestedTags={reflection.suggestions}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground">
                {reflection.reviewTitle}
              </label>
              <Textarea
                value={review}
                onChange={(event) => setReview(event.target.value)}
                placeholder={reflection.placeholder}
                className="min-h-28 rounded-2xl border-border bg-background/55 text-sm leading-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/25"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => setCompletionOpen(false)}
                className="rounded-xl"
              >
                بازگشت
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={finish}
                className="rounded-xl shadow-lg shadow-primary/15"
              >
                {pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                ثبت تجربه‌ی من
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

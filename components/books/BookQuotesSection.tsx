"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  Loader2,
  Plus,
  Quote,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Carousel } from "@/components/ui/Carousel";
import QuoteCard from "@/components/profile/QuoteCard";
import { useConfirm } from "@/components/common/ConfirmDialog";
import type { PublicQuote } from "@/lib/quotes/service";
import { cn } from "@/lib/utils";

export default function BookQuotesSection({
  subjectBookId,
  viewerEntryId,
  isLoggedIn,
  quotes,
  variant = "preview",
  viewAllHref,
}: {
  subjectBookId: string;
  viewerEntryId: string | null;
  isLoggedIn: boolean;
  quotes: PublicQuote[];
  variant?: "preview" | "all";
  viewAllHref?: string;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PublicQuote | null>(null);
  const [content, setContent] = useState("");
  const [page, setPage] = useState("");
  const [busy, setBusy] = useState(false);

  const hasQuotes = quotes.length > 0;
  const showViewAll =
    variant === "preview" && Boolean(viewAllHref) && hasQuotes;

  function openAdd() {
    setEditing(null);
    setContent("");
    setPage("");
    setOpen(true);
  }

  function openEdit(quote: PublicQuote) {
    setEditing(quote);
    setContent(quote.content);
    setPage(quote.page ? String(quote.page) : "");
    setOpen(true);
  }

  async function ensureEntryId(): Promise<string> {
    if (viewerEntryId) return viewerEntryId;

    const res = await fetch(`/api/book/${subjectBookId}/library`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "UNREAD" }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "خطا");
    }

    return data.bookId as string;
  }

  async function submit() {
    const text = content.trim();
    const normalizedPage = page ? Number(page) : null;

    if (!text || busy) return;

    setBusy(true);

    try {
      if (editing) {
        const res = await fetch(`/api/quotes/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            page: normalizedPage,
          }),
        });

        if (!res.ok) {
          throw new Error((await res.json()).error || "خطا");
        }

        toast.success("تکه بروزرسانی شد");
      } else {
        const bookId = await ensureEntryId();

        const res = await fetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            page: normalizedPage ?? undefined,
            bookId,
          }),
        });

        if (!res.ok) {
          throw new Error((await res.json()).error || "خطا");
        }

        toast.success("تکه منتشر شد");
      }

      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await confirm({
      title: "حذف تکه",
      description: "این تکه حذف شود؟ این عملیات قابل بازگشت نیست.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/quotes/${id}`, { method: "DELETE" });

          if (!res.ok) {
            throw new Error((await res.json()).error || "خطا");
          }

          toast.success("تکه حذف شد.");
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "حذف تکه ناموفق بود.",
          );
        }
      },
    });
  }

  function renderQuoteCard(quote: PublicQuote) {
    const canManage = viewerEntryId && quote.bookId === viewerEntryId;

    return (
      <QuoteCard
        key={quote.id}
        quote={quote}
        canLike={isLoggedIn}
        showAuthor
        showBook
        manage={
          canManage
            ? {
                onEdit: () => openEdit(quote),
                onDelete: () => remove(quote.id),
              }
            : undefined
        }
      />
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/55 shadow-[0_22px_70px_-48px_rgba(0,0,0,0.65)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_42%)]" />

      <div className="relative">
        <div className="relative overflow-hidden border-b border-border/70 px-4 py-5 sm:px-6 lg:px-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-primary/10 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20 shadow-lg shadow-primary/10">
                <Quote className="h-5 w-5" />
              </span>

              <div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-foreground sm:text-xl">
                    تکه‌های کتاب
                  </h2>
                  {hasQuotes ? (
                    <span className="rounded-full border border-border/70 bg-background/45 px-2.5 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur">
                      {quotes.length.toLocaleString("fa-IR")} تکه
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {showViewAll && viewAllHref ? (
                <Link
                  href={viewAllHref}
                  className="inline-flex h-10 items-center gap-1.5 rounded-2xl border border-border/70 bg-background/45 px-3.5 text-sm font-bold text-foreground backdrop-blur transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                >
                  مشاهده همه
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              ) : null}

              {isLoggedIn ? (
                <Button
                  type="button"
                  onClick={openAdd}
                  className="h-10 rounded-2xl px-4 text-sm font-black shadow-lg shadow-primary/15"
                >
                  <Plus className="h-4 w-4" />
                  افزودن تکه
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 lg:px-7">
          {!hasQuotes ? (
            <EmptyQuotesState isLoggedIn={isLoggedIn} onAdd={openAdd} />
          ) : variant === "preview" ? (
            <div className="relative">
              <Carousel
                className="py-1 ps-10 pe-10 sm:ps-11 sm:pe-11 lg:ps-12 lg:pe-12"
                ariaLabel="تکه‌های کتاب"
                slideClassName="basis-full md:basis-1/2 xl:basis-1/3"
                containerClassName="gap-4 lg:gap-5"
                slides={quotes.map(renderQuoteCard)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quotes.map(renderQuoteCard)}
            </div>
          )}
        </div>
      </div>

      <QuoteDialog
        open={open}
        editing={editing}
        content={content}
        page={page}
        busy={busy}
        onOpenChange={setOpen}
        onContentChange={setContent}
        onPageChange={setPage}
        onSubmit={submit}
      />
    </section>
  );
}

function EmptyQuotesState({
  isLoggedIn,
  onAdd,
}: {
  isLoggedIn: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-border/80 bg-background/35 px-4 py-10 text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%, transparent)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
          <BookOpenText className="h-6 w-6" />
        </div>

        <p className="mt-4 text-sm font-black text-foreground">
          هنوز تکه‌ای منتشر نشده
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-muted-foreground">
          {isLoggedIn
            ? "اولین جمله یا بخش به‌یادماندنی این کتاب را منتشر کن تا اینجا جان بگیرد."
            : "هنوز خواننده‌ای تکه‌ای از این کتاب منتشر نکرده است."}
        </p>

        {isLoggedIn ? (
          <Button
            type="button"
            onClick={onAdd}
            className="mt-5 h-10 rounded-2xl px-4 text-sm font-bold"
          >
            <Plus className="h-4 w-4" />
            افزودن اولین تکه
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function QuoteDialog({
  open,
  editing,
  content,
  page,
  busy,
  onOpenChange,
  onContentChange,
  onPageChange,
  onSubmit,
}: {
  open: boolean;
  editing: PublicQuote | null;
  content: string;
  page: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onContentChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[1.75rem] border-border bg-card p-0 shadow-2xl sm:max-w-lg">
        <div className="relative border-b border-border/70 px-5 py-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)",
              backgroundSize: "16px 16px",
            }}
          />

          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <Sparkles className="h-5 w-5" />
            </span>

            <div>
              <DialogTitle className="text-base font-black text-foreground">
                {editing ? "ویرایش تکه کتاب" : "افزودن تکه کتاب"}
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs leading-6 text-muted-foreground">
                جمله یا بخشی از کتاب را که دوست داری با دیگران به اشتراک بگذاری
                بنویس.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <Textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="یک تکه از کتاب را نقل کن..."
            className="min-h-40 resize-none rounded-2xl border-border bg-background/45 text-sm leading-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/25"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-11 w-full items-center justify-between gap-3 rounded-2xl border border-border bg-background/45 px-3 sm:w-auto">
              <span className="text-xs font-medium text-muted-foreground">
                شماره صفحه
              </span>

              <input
                value={page}
                onChange={(event) =>
                  onPageChange(event.target.value.replace(/[^0-9]/g, ""))
                }
                inputMode="numeric"
                placeholder="اختیاری"
                className="h-9 w-24 bg-transparent text-left text-sm font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={busy}
                className="h-10 rounded-xl px-4 text-foreground hover:bg-white/[0.05]"
              >
                بستن
              </Button>

              <Button
                type="button"
                onClick={onSubmit}
                disabled={busy || !content.trim()}
                className={cn(
                  "h-10 rounded-xl px-4 font-bold",
                  "disabled:cursor-not-allowed disabled:opacity-40",
                )}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editing ? "ذخیره" : "انتشار"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpenText,
  Check,
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
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Carousel } from "@/components/ui/Carousel";
import QuoteCard, {
  QuoteBackground as QuoteBackgroundPreview,
} from "@/components/profile/QuoteCard";
import { useConfirm } from "@/components/common/ConfirmDialog";
import type { PublicQuote } from "@/lib/quotes/service";
import {
  QUOTE_BACKGROUNDS,
  type QuoteBackground as QuoteBackgroundVariant,
} from "@/lib/quotes/backgrounds";
import { cn } from "@/lib/utils";
import { normalizeMediaUrl } from "@/lib/book/cover";
import { getQuoteTextareaDirectionProps } from "@/lib/text-direction";
import { normalizeQuoteBackground } from "@/lib/quotes/backgrounds";

export default function BookQuotesSection({
  subjectBookId,
  viewerEntryId,
  viewerIsAdmin = false,
  isLoggedIn,
  quotes,
  totalQuoteCount,
  variant = "preview",
  viewAllHref,
  showBook = false,
}: {
  subjectBookId: string;
  viewerEntryId: string | null;
  viewerIsAdmin?: boolean;
  isLoggedIn: boolean;
  quotes: PublicQuote[];
  totalQuoteCount?: number;
  variant?: "preview" | "all";
  viewAllHref?: string;
  /** Book pages already establish context, so their cards omit repeated book metadata. */
  showBook?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PublicQuote | null>(null);
  const [content, setContent] = useState("");
  const [page, setPage] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [background, setBackground] =
    useState<QuoteBackgroundVariant>("default");
  const [uploading, setUploading] = useState(false);
  const unsavedImageKeys = useRef(new Set<string>());
  const [busy, setBusy] = useState(false);

  const hasQuotes = quotes.length > 0;
  const showViewAll =
    variant === "preview" && Boolean(viewAllHref) && hasQuotes;

  function openAdd() {
    setEditing(null);
    setContent("");
    setPage("");
    setImageKey(null);
    setImagePreview(null);
    setBackground("default");
    setOpen(true);
  }

  function openEdit(quote: PublicQuote) {
    setEditing(quote);
    setContent(quote.content);
    setPage(quote.page ? String(quote.page) : "");
    setImageKey(quote.imageKey);
    setImagePreview(normalizeMediaUrl(quote.imageKey));
    setBackground(normalizeQuoteBackground(quote.background));
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

    if ((!text && !imageKey) || busy || uploading) return;

    setBusy(true);

    try {
      if (editing) {
        const res = await fetch(`/api/quotes/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            page: normalizedPage,
            imageKey,
            background,
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
            imageKey,
            background,
          }),
        });

        if (!res.ok) {
          throw new Error((await res.json()).error || "خطا");
        }

        toast.success("تکه منتشر شد");
      }

      unsavedImageKeys.current.clear();
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "خطا");
    } finally {
      setBusy(false);
    }
  }

  async function cleanupImage(key: string) {
    try {
      await fetch("/api/upload/image", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });
    } catch {
      // Best-effort cleanup; the persisted quote is never rolled back.
    } finally {
      unsavedImageKeys.current.delete(key);
    }
  }

  function handleImageKeyChange(nextKey: string) {
    const previousKey = imageKey;
    if (
      previousKey &&
      unsavedImageKeys.current.has(previousKey) &&
      previousKey !== nextKey
    ) {
      void cleanupImage(previousKey);
    }
    if (nextKey) unsavedImageKeys.current.add(nextKey);
    setImageKey(nextKey || null);
  }

  function handleDialogOpenChange(nextOpen: boolean) {
    if (!nextOpen && !busy) {
      for (const key of unsavedImageKeys.current) void cleanupImage(key);
    }
    setOpen(nextOpen);
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
    const canManage =
      viewerIsAdmin || Boolean(viewerEntryId && quote.bookId === viewerEntryId);

    return (
        <QuoteCard
        key={quote.id}
        quote={quote}
        canLike={isLoggedIn}
        showAuthor
        showBook={showBook}
        background={quote.background}
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
    <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md transition-all hover:border-border/80">
      <div className="relative">
        <div className="border-b border-border/40 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <Quote className="h-4 w-4" />
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-bold text-foreground sm:text-lg">
                    تکه‌های کتاب
                  </h2>
                  {hasQuotes ? (
                    <span className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {(totalQuoteCount ?? quotes.length).toLocaleString(
                        "fa-IR",
                      )}{" "}
                      تکه
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {showViewAll && viewAllHref ? (
                <Link
                  href={viewAllHref}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 px-3 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  مشاهده همه
                  <ArrowLeft className="h-3.5 w-3.5" />
                </Link>
              ) : null}

              {isLoggedIn ? (
                <Button
                  type="button"
                  onClick={openAdd}
                  className="h-8 gap-1.5 rounded-xl px-3 text-xs font-semibold"
                >
                  <Plus className="h-3.5 w-3.5" />
                  افزودن تکه
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {!hasQuotes ? (
            <EmptyQuotesState isLoggedIn={isLoggedIn} onAdd={openAdd} />
          ) : variant === "preview" ? (
            <div className="relative">
              <Carousel
                className="py-1"
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
        imageKey={imageKey}
        imagePreview={imagePreview}
        uploading={uploading}
        background={background}
        onOpenChange={handleDialogOpenChange}
        onContentChange={setContent}
        onPageChange={setPage}
        onImagePreviewChange={(value) => setImagePreview(value || null)}
        onImageKeyChange={handleImageKeyChange}
        onUploadStateChange={setUploading}
        onBackgroundChange={setBackground}
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
    <div className="rounded-xl border border-dashed border-border/70 bg-background/30 px-4 py-8 text-center">
      <div>
        <div className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary/70">
          <BookOpenText className="h-6 w-6" />
        </div>

        <p className="mt-3 text-sm font-semibold text-foreground">
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
            className="mt-4 h-8 rounded-xl px-3 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
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
  imageKey,
  imagePreview,
  uploading,
  background,
  onOpenChange,
  onContentChange,
  onPageChange,
  onImagePreviewChange,
  onImageKeyChange,
  onUploadStateChange,
  onBackgroundChange,
  onSubmit,
}: {
  open: boolean;
  editing: PublicQuote | null;
  content: string;
  page: string;
  busy: boolean;
  imageKey: string | null;
  imagePreview: string | null;
  uploading: boolean;
  background: QuoteBackgroundVariant;
  onOpenChange: (open: boolean) => void;
  onContentChange: (value: string) => void;
  onPageChange: (value: string) => void;
  onImagePreviewChange: (value: string) => void;
  onImageKeyChange: (key: string) => void;
  onUploadStateChange: (uploading: boolean) => void;
  onBackgroundChange: (background: QuoteBackgroundVariant) => void;
  onSubmit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-24px)] overflow-y-auto rounded-2xl border-border/80 bg-card p-0 shadow-xl sm:max-w-xl">
        <div className="border-b border-border/40 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>

            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {editing ? "ویرایش تکه کتاب" : "افزودن تکه کتاب"}
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs leading-6 text-muted-foreground">
                جمله یا بخشی از کتاب را که دوست داری با دیگران به اشتراک بگذاری
                بنویس.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div
            className={cn(
              "relative overflow-hidden rounded-[1.35rem] border",
              background === "default"
                ? "border-border/60 bg-background/30"
                : "border-border/50 bg-card/20",
            )}
          >
            {/* Live preview: exactly the selected quote background, only behind writing. */}
            <QuoteBackgroundPreview variant={background} />

            <Quote
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute right-4 top-4 z-[1] h-7 w-7",
                background === "default"
                  ? "text-primary/20"
                  : "text-white/75 [filter:drop-shadow(0_1px_5px_rgba(0,0,0,0.45))]",
              )}
            />

            <Quote
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute bottom-4 left-4 z-[1] h-7 w-7 rotate-180",
                background === "default"
                  ? "text-primary/10"
                  : "text-white/35 [filter:drop-shadow(0_1px_5px_rgba(0,0,0,0.4))]",
              )}
            />

            <Textarea
              {...getQuoteTextareaDirectionProps(content)}
              value={content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="یک تکه از کتاب را نقل کن..."
              className={cn(
                "relative z-10 min-h-44 resize-none",
                "border-0 bg-transparent px-5 py-6",
                "text-xs leading-7",
                background === "default"
                  ? "text-foreground placeholder:text-muted-foreground/70"
                  : "text-white placeholder:text-white/60 [text-shadow:0_1px_3px_rgba(0,0,0,0.8),0_0_16px_rgba(0,0,0,0.28)]",
                "shadow-none outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "sm:min-h-48 sm:px-6 sm:py-7 sm:text-sm sm:leading-8",
              )}
            />
          </div>
          <div className="rounded-xl border border-border/50 bg-background/30 p-2.5">
            <ImageUploader
              value={imagePreview}
              onChange={onImagePreviewChange}
              onKeyChange={onImageKeyChange}
              onUploadStateChange={onUploadStateChange}
              folder="quotes"
              variant="document"
              label="افزودن تصویر از صفحه کتاب"
              description="فرمت‌های JPEG، PNG و WebP تا حجم ۸ مگابایت پذیرفته می‌شوند."
              disabled={busy}
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  ظاهر تکه
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  پس‌زمینه‌ای که با حال‌وهوای تکه هماهنگ‌تر است انتخاب کن.
                </p>
              </div>

              <span className="text-[10px] font-medium text-muted-foreground">
                {QUOTE_BACKGROUNDS.find((item) => item.value === background)
                  ?.label ?? "پیش‌فرض"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {QUOTE_BACKGROUNDS.map((item) => {
                const selected = background === item.value;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onBackgroundChange(item.value)}
                    disabled={busy || uploading}
                    aria-pressed={selected}
                    className={cn(
                      "group relative h-20 overflow-hidden rounded-xl border text-right",
                      "transition-[border-color,box-shadow,opacity] duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      selected
                        ? "border-primary/55 ring-2 ring-primary/10"
                        : "border-border/60 hover:border-primary/25",
                    )}
                  >
                    <QuoteBackgroundPreview variant={item.value} />

                    <span
                      className={cn(
                        "absolute bottom-2 right-2 z-10 rounded-md px-1.5 py-1 text-[10px] font-bold backdrop-blur-sm",
                        item.value === "default"
                          ? "bg-background/65 text-foreground"
                          : "bg-black/35 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.7)]",
                      )}
                    >
                      {item.label}
                    </span>

                    {selected ? (
                      <span className="absolute left-2 top-2 z-10 grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground shadow-sm">
                        <Check className="h-3 w-3" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex h-9 w-full items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/40 px-3 sm:w-auto">
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
                className="h-8 w-24 bg-transparent text-left text-xs font-medium tabular-nums text-foreground outline-none placeholder:text-muted-foreground"
              />
            </label>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={busy || uploading}
                className="h-8 rounded-xl px-3 text-xs font-semibold text-foreground hover:bg-white/[0.05]"
              >
                بستن
              </Button>

              <Button
                type="button"
                onClick={onSubmit}
                disabled={busy || uploading || (!content.trim() && !imageKey)}
                className={cn(
                  "h-8 rounded-xl px-3 text-xs font-semibold",
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

"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  Check,
  Copy,
  ExternalLink,
  Heart,
  Pencil,
  Quote as QuoteIcon,
  Share2,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PublicQuote } from "@/lib/quotes/service";

const PLACEHOLDER = "/placeholder-cover.svg";
const LONG_QUOTE_CHAR_LIMIT = 145;
const LONG_QUOTE_WORD_LIMIT = 26;

export interface CardManage {
  onEdit: () => void;
  onDelete: () => void;
}

export default function QuoteCard({
  quote,
  canLike,
  showAuthor = false,
  showBook = true,
  manage,
}: {
  quote: PublicQuote;
  canLike: boolean;
  showAuthor?: boolean;
  showBook?: boolean;
  manage?: CardManage;
}) {
  const [liked, setLiked] = useState(quote.likedByViewer);
  const [likeCount, setLikeCount] = useState(quote.likeCount);
  const [likePending, setLikePending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  const bookHref = `/book/${encodeURIComponent(quote.bookSlug || quote.bookId)}`;
  const quoteText = quote.content?.trim() || "";
  const wordCount = quoteText.split(/\s+/).filter(Boolean).length;
  const isLongQuote =
    quoteText.length > LONG_QUOTE_CHAR_LIMIT ||
    wordCount > LONG_QUOTE_WORD_LIMIT;

  async function handleLike() {
    if (!canLike) {
      toast("برای پسندیدن وارد شوید");
      return;
    }

    if (likePending) return;

    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => count + (nextLiked ? 1 : -1));
    setLikePending(true);

    try {
      const res = await fetch(`/api/quotes/${quote.id}/like`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("like failed");

      const data = (await res.json()) as {
        liked: boolean;
        likeCount: number;
      };

      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(!nextLiked);
      setLikeCount((count) => count + (nextLiked ? -1 : 1));
      toast.error("پسند ثبت نشد");
    } finally {
      setLikePending(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(quoteText);
      setCopied(true);
      toast.success("تکه کتاب کپی شد");
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("کپی نشد");
    }
  }

  async function handleShare() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${bookHref}`
        : bookHref;

    const shareData = {
      title: quote.bookTitle,
      text: `«${quoteText}» — ${quote.bookTitle}`,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        return;
      }

      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("لینک کتاب کپی شد");
    } catch {
      toast.error("اشتراک‌گذاری ممکن نشد");
    }
  }

  function openFullContent() {
    if (isLongQuote) setContentOpen(true);
  }

  function handleQuoteKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isLongQuote) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setContentOpen(true);
    }
  }

  return (
    <>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-border/85 bg-card/90 p-3.5 shadow-[0_20px_64px_-46px_rgba(0,0,0,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-primary/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-emerald-400/5 blur-3xl" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {showAuthor && quote.authorUsername ? (
              <AuthorChip
                username={quote.authorUsername}
                name={quote.authorName}
                image={quote.authorImage}
              />
            ) : (
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
                <QuoteIcon className="h-4 w-4" />
              </span>
            )}

            {showBook ? (
              <BookChip
                href={bookHref}
                cover={quote.bookCover}
                title={quote.bookTitle}
                author={quote.bookAuthor}
              />
            ) : null}
          </div>

          {quote.page ? (
            <span className="shrink-0 rounded-full border border-border/80 bg-background/45 px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground backdrop-blur">
              صفحه {quote.page.toLocaleString("fa-IR")}
            </span>
          ) : null}
        </div>

        <div
          role={isLongQuote ? "button" : undefined}
          tabIndex={isLongQuote ? 0 : undefined}
          onClick={openFullContent}
          onKeyDown={handleQuoteKeyDown}
          aria-label={isLongQuote ? "مشاهده متن کامل تکه کتاب" : undefined}
          className={cn(
            "relative mt-3 flex min-h-[170px] flex-1 flex-col overflow-hidden rounded-[1.3rem] border border-border/80 bg-background/35 px-4 py-4 outline-none",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
            isLongQuote
              ? "cursor-pointer justify-start transition-colors hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary/30"
              : "justify-center",
          )}
        >
          <QuotePattern />

          <div className="pointer-events-none absolute inset-y-4 right-0 w-1 rounded-full bg-gradient-to-b from-primary/70 via-primary/35 to-transparent" />
          <QuoteIcon className="pointer-events-none absolute right-4 top-4 h-5 w-5 text-primary/25" />

          <p
            className={cn(
              "relative z-10 w-full whitespace-pre-line pr-8 text-start text-sm font-medium leading-8 text-foreground",
              isLongQuote && "line-clamp-3",
            )}
          >
            {quoteText}
          </p>

          <div className="relative z-20 mt-auto flex w-full items-center justify-between gap-2 border-t border-border/70 pt-2.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleLike();
              }}
              disabled={likePending}
              aria-pressed={liked}
              aria-label={liked ? "برداشتن پسند" : "پسندیدن"}
              className={cn(
                "inline-flex h-8 min-w-11 items-center justify-center gap-1.5 rounded-xl px-2.5 text-xs font-black tabular-nums transition-all disabled:opacity-60",
                liked
                  ? "bg-rose-500/12 text-rose-300 ring-1 ring-rose-300/15"
                  : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300",
              )}
            >
              <Heart className={cn("h-4 w-4", liked && "fill-current")} />
              {likeCount.toLocaleString("fa-IR")}
            </button>

            <div className="flex items-center gap-0.5">
              {isLongQuote ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setContentOpen(true);
                  }}
                  className="me-1 inline-flex h-8 items-center gap-1 rounded-xl border border-primary/20 bg-primary/10 px-2.5 text-[10px] font-black text-primary transition-colors hover:bg-primary/15"
                >
                  کامل
                  <ExternalLink className="h-3 w-3" />
                </button>
              ) : null}

              <IconAction
                label="کپی تکه"
                onClick={handleCopy}
                active={copied}
                icon={
                  copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )
                }
              />

              <IconAction
                label="اشتراک‌گذاری"
                onClick={handleShare}
                icon={<Share2 className="h-4 w-4" />}
              />

              {manage ? (
                <>
                  <span className="mx-1 h-5 w-px bg-border/80" />

                  <IconAction
                    label="ویرایش"
                    onClick={manage.onEdit}
                    tone="primary"
                    icon={<Pencil className="h-4 w-4" />}
                  />

                  <IconAction
                    label="حذف"
                    onClick={manage.onDelete}
                    tone="danger"
                    icon={<Trash2 className="h-4 w-4" />}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      <QuoteContentDialog
        open={contentOpen}
        onOpenChange={setContentOpen}
        quote={quote}
        quoteText={quoteText}
        bookHref={bookHref}
      />
    </>
  );
}

function BookChip({
  href,
  cover,
  title,
  author,
}: {
  href: string;
  cover: string | null;
  title: string;
  author: string | null;
}) {
  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className="group/book flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-border/80 bg-background/45 py-1.5 pe-3 ps-1.5 backdrop-blur transition-colors hover:border-primary/25 hover:bg-primary/[0.04]"
    >
      <span className="relative aspect-[3/4] w-8 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
        <Image
          src={cover || PLACEHOLDER}
          alt={title}
          fill
          sizes="32px"
          className="object-cover transition-transform duration-300 group-hover/book:scale-105"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-black leading-5 text-foreground transition-colors group-hover/book:text-primary">
          {title}
        </span>

        {author ? (
          <span className="block truncate text-[10px] leading-4 text-muted-foreground">
            {author}
          </span>
        ) : null}
      </span>

      <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary/70" />
    </Link>
  );
}

function QuotePattern() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.16) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.08) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.08) 75%, transparent 75%, transparent)",
          backgroundSize: "26px 26px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.16),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_46%)]"
      />
    </>
  );
}

function QuoteContentDialog({
  open,
  onOpenChange,
  quote,
  quoteText,
  bookHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PublicQuote;
  quoteText: string;
  bookHref: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[1.85rem] border-border bg-card p-0 shadow-2xl sm:max-w-2xl">
        <div className="relative overflow-hidden border-b border-border/80 px-5 py-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-35"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)",
              backgroundSize: "17px 17px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-primary/10 via-transparent to-transparent" />

          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20">
              <QuoteIcon className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <DialogTitle className="text-base font-black text-foreground">
                تکه کتاب
              </DialogTitle>

              <DialogDescription className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {quote.bookTitle}
                {quote.page
                  ? `، صفحه ${quote.page.toLocaleString("fa-IR")}`
                  : ""}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-auto p-5">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-background/40 p-5">
            <QuotePattern />

            <div className="pointer-events-none absolute inset-y-5 right-0 w-1 rounded-full bg-gradient-to-b from-primary/70 via-primary/35 to-transparent" />
            <QuoteIcon className="pointer-events-none absolute right-5 top-5 h-6 w-6 text-primary/25" />

            <p className="relative z-10 whitespace-pre-line pr-9 text-sm font-medium leading-8 text-foreground sm:text-base sm:leading-9">
              {quoteText}
            </p>
          </div>

          <Link
            href={bookHref}
            onClick={() => onOpenChange(false)}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl border border-border/80 bg-background/35 px-4 text-xs font-black text-foreground transition-colors hover:border-primary/25 hover:bg-primary/10 hover:text-primary"
          >
            مشاهده کتاب
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function IconAction({
  label,
  icon,
  onClick,
  active,
  tone = "default",
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  tone?: "default" | "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-xl border text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        active
          ? "border-primary/25 bg-primary/12 text-primary"
          : "border-transparent bg-transparent hover:border-border/80 hover:bg-white/[0.05]",
        tone === "primary" &&
          "text-primary hover:border-primary/25 hover:bg-primary/10",
        tone === "danger" &&
          "text-red-300/85 hover:border-red-300/20 hover:bg-red-500/10 hover:text-red-300",
      )}
    >
      {icon}
    </button>
  );
}

export function AuthorChip({
  username,
  name,
  image,
}: {
  username: string;
  name: string | null;
  image: string | null;
}) {
  const displayName = name || `@${username}`;
  const initial = displayName.trim().charAt(0) || "؟";

  return (
    <Link
      href={`/${username}`}
      className="group/author inline-flex min-w-0 items-center gap-2 rounded-full border border-border/80 bg-background/35 py-1 pe-3 ps-1 backdrop-blur transition-colors hover:border-primary/25 hover:bg-primary/[0.04]"
    >
      <span className="relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-xs font-black text-foreground ring-1 ring-white/10">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initial}</span>
        )}
      </span>

      <span className="min-w-0 truncate text-xs font-black text-foreground transition-colors group-hover/author:text-primary">
        {displayName}
      </span>
    </Link>
  );
}

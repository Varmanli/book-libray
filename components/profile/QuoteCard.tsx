"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
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

import BookCoverImage from "@/components/books/BookCoverImage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PublicQuote } from "@/lib/quotes/service";
import { cn } from "@/lib/utils";

const PLACEHOLDER = "/placeholder-cover.svg";
const LONG_QUOTE_CHAR_LIMIT = 220;
const LONG_QUOTE_WORD_LIMIT = 42;

export type QuoteBackgroundVariant =
  | "paper"
  | "grid"
  | "editorial"
  | "aurora"
  | "minimal"
  | "linen"
  | "dust"
  | "ornament"
  | "marble"
  | "light";

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
  background = "paper",
}: {
  quote: PublicQuote;
  canLike: boolean;
  showAuthor?: boolean;
  showBook?: boolean;
  manage?: CardManage;
  background?: QuoteBackgroundVariant;
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
    if (!canLike) return void toast("برای پسندیدن وارد شوید");
    if (likePending) return;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikeCount((count) => count + (nextLiked ? 1 : -1));
    setLikePending(true);
    try {
      const response = await fetch(`/api/quotes/${quote.id}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("like failed");
      const data = (await response.json()) as {
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
    const data = {
      title: quote.bookTitle,
      text: `«${quoteText}» — ${quote.bookTitle}`,
      url,
    };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
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

  const openFull = () => isLongQuote && setContentOpen(true);
  const onQuoteKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isLongQuote && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setContentOpen(true);
    }
  };

  return (
    <>
      <article className="group relative flex h-full flex-col overflow-hidden rounded-[2rem] bg-card/80 p-3 shadow-[0_26px_80px_-54px_rgba(0,0,0,0.8)] ring-1 ring-border/55 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_90px_-52px_rgba(0,0,0,0.95)] sm:p-4">
        <QuoteBackground variant={background} />

        <header className="relative z-10 px-1 pt-1">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {showAuthor && quote.authorUsername ? (
              <AuthorChip
                username={quote.authorUsername}
                name={quote.authorName}
                image={quote.authorImage}
              />
            ) : (
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
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
        </header>

        <div
          role={isLongQuote ? "button" : undefined}
          tabIndex={isLongQuote ? 0 : undefined}
          onClick={openFull}
          onKeyDown={onQuoteKeyDown}
          aria-label={isLongQuote ? "مشاهده متن کامل تکه کتاب" : undefined}
          className={cn(
            "relative z-10 mt-5 flex min-h-[205px] flex-1 flex-col overflow-hidden rounded-[1.55rem] bg-background/[0.38] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_16px_32px_-28px_rgba(0,0,0,0.9)] ring-1 ring-white/[0.055] sm:px-7 sm:py-8",
            isLongQuote &&
              "cursor-pointer transition-colors hover:bg-background/[0.52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          )}
        >
          <span className="pointer-events-none absolute inset-y-7 right-0 w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent" />
          <QuoteIcon className="pointer-events-none absolute left-5 top-5 h-8 w-8 text-primary/[0.12] sm:left-7 sm:top-7" />
          <p
            className={cn(
              "relative z-10 max-w-[62ch] whitespace-pre-line pr-5 text-start text-[0.94rem] font-medium leading-[2.1] tracking-[0.005em] text-foreground sm:text-base sm:leading-[2.15]",
              isLongQuote && "line-clamp-5",
            )}
          >
            {quoteText}
          </p>
          {isLongQuote || quote.page ? (
            <div className="relative z-10 mt-5 flex items-center justify-between gap-3">
              {isLongQuote ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setContentOpen(true);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-black text-primary transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  ادامه خواندن <ExternalLink className="h-3.5 w-3.5" />
                </button>
              ) : (
                <span />
              )}
              {quote.page ? <PageBadge page={quote.page} /> : null}
            </div>
          ) : null}
        </div>

        <footer className="relative z-10 mt-3 flex items-center justify-between gap-2 px-1 pb-1 pt-2">
          <LikePill
            liked={liked}
            count={likeCount}
            pending={likePending}
            onClick={handleLike}
          />
          <div className="flex items-center rounded-2xl bg-background/35 p-1 ring-1 ring-border/55 backdrop-blur-sm">
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
                <span className="mx-1 h-5 w-px bg-border/70" />
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
        </footer>
      </article>
      <QuoteReadingDialog
        open={contentOpen}
        onOpenChange={setContentOpen}
        quote={quote}
        quoteText={quoteText}
        bookHref={bookHref}
        background={background}
        showBook={showBook}
      />
    </>
  );
}

export function QuoteBackground({
  variant,
}: {
  variant: QuoteBackgroundVariant;
}) {
  const variants: Record<QuoteBackgroundVariant, ReactNode> = {
    paper: <PaperBackground />,
    grid: <GridBackground />,
    editorial: <EditorialBackground />,
    aurora: <AuroraBackground />,
    minimal: <MinimalBackground />,
    linen: <LinenBackground />,
    dust: <DustBackground />,
    ornament: <OrnamentBackground />,
    marble: <MarbleBackground />,
    light: <LightBackground />,
  };
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {variants[variant]}
    </div>
  );
}

function PaperBackground() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.13),transparent_37%),linear-gradient(135deg,rgba(255,248,229,0.045),transparent_52%)] before:absolute before:inset-0 before:opacity-[0.07] before:[background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] before:[background-size:11px_11px]" />
  );
}
function GridBackground() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,hsl(var(--primary)/0.16)_1px,transparent_1px)] [background-size:18px_18px] opacity-40" />
  );
}
function EditorialBackground() {
  return (
    <div className="absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,hsl(var(--border)/0.35)_32px)] opacity-40" />
  );
}
function AuroraBackground() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0,hsl(var(--primary)/0.22),transparent_35%),radial-gradient(circle_at_90%_90,rgba(56,189,248,0.13),transparent_36%)] blur-[1px]" />
  );
}
function MinimalBackground() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(145deg,hsl(var(--primary)/0.08),transparent_38%,rgba(255,255,255,0.025))]" />
  );
}
function LinenBackground() {
  return (
    <div className="absolute inset-0 opacity-[0.13] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.16)_4px),repeating-linear-gradient(90deg,transparent_0,transparent_4px,rgba(255,255,255,0.09)_5px)]" />
  );
}
function DustBackground() {
  return (
    <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.45)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_60%,hsl(var(--primary)/0.55)_0_1px,transparent_1.5px)] [background-size:47px_53px,71px_67px]" />
  );
}
function OrnamentBackground() {
  return (
    <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(45deg,hsl(var(--primary)/0.8)_12%,transparent_12%,transparent_88%,hsl(var(--primary)/0.8)_88%),linear-gradient(-45deg,hsl(var(--primary)/0.8)_12%,transparent_12%,transparent_88%,hsl(var(--primary)/0.8)_88%)] [background-size:28px_28px]" />
  );
}
function MarbleBackground() {
  return (
    <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(ellipse_at_20%_20%,transparent_42%,rgba(255,255,255,0.26)_43%,transparent_45%),radial-gradient(ellipse_at_75%_80%,transparent_47%,hsl(var(--primary)/0.3)_48%,transparent_50%)]" />
  );
}
function LightBackground() {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.15),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
  );
}

function PageBadge({ page }: { page: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 px-1 text-[11px] font-medium tabular-nums text-muted-foreground">
      <BookOpen className="h-3 w-3 opacity-70" />ص{" "}
      {page.toLocaleString("fa-IR")}
    </span>
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
      className="group/book flex min-w-0 items-center gap-2 border-s border-border/55 ps-3 transition hover:text-primary sm:max-w-[55%]"
    >
      <span className="relative h-8 w-5 shrink-0 overflow-hidden rounded-md shadow-sm shadow-black/30">
        <BookCoverImage
          src={cover || PLACEHOLDER}
          alt={title}
          fill
          sizes="20px"
          className="object-cover transition duration-500 group-hover/book:scale-110"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[11px] font-black text-foreground transition group-hover/book:text-primary">
          {title}
        </span>
        {author ? (
          <span className="mt-0.5 block truncate text-[10px] font-medium text-muted-foreground">
            {author}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function LikePill({
  liked,
  count,
  pending,
  onClick,
}: {
  liked: boolean;
  count: number;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      className={cn(
        "inline-flex h-10 min-w-14 items-center justify-center gap-1.5 rounded-2xl px-3 text-xs font-black tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60",
        liked
          ? "bg-rose-500/15 text-rose-300 ring-1 ring-rose-300/20"
          : "bg-background/35 text-muted-foreground ring-1 ring-border/55 hover:bg-rose-500/10 hover:text-rose-300",
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-transform",
          liked && "fill-current scale-110",
        )}
      />
      {count.toLocaleString("fa-IR")}
    </button>
  );
}

function QuoteReadingDialog({
  open,
  onOpenChange,
  quote,
  quoteText,
  bookHref,
  background,
  showBook,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: PublicQuote;
  quoteText: string;
  bookHref: string;
  background: QuoteBackgroundVariant;
  showBook: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2rem] border-border/70 bg-card p-0 shadow-2xl sm:max-w-3xl">
        <div className="relative p-5 sm:p-7">
          <QuoteBackground variant={background} />
          <div className="relative flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <QuoteIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-lg font-black text-foreground">
                تکه کتاب
              </DialogTitle>
              <DialogDescription className="mt-1 truncate text-xs text-muted-foreground">
                {showBook ? quote.bookTitle : "خوانش کامل تکه"}
                {quote.page
                  ? ` · صفحه ${quote.page.toLocaleString("fa-IR")}`
                  : ""}
              </DialogDescription>
            </div>
          </div>
        </div>
        <div className="max-h-[72vh] overflow-auto p-5 sm:p-7">
          <div className="relative overflow-hidden rounded-[1.65rem] bg-background/40 px-6 py-8 shadow-inner ring-1 ring-border/60 sm:px-10 sm:py-11">
            <QuoteBackground variant={background} />
            <QuoteIcon className="relative h-8 w-8 text-primary/20" />
            <p className="relative mt-4 whitespace-pre-line text-[0.98rem] font-medium leading-9 text-foreground sm:text-[1.08rem] sm:leading-10">
              {quoteText}
            </p>
          </div>
          {showBook ? (
            <Link
              href={bookHref}
              onClick={() => onOpenChange(false)}
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              مشاهده کتاب <ExternalLink className="h-4 w-4" />
            </Link>
          ) : null}
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
        "grid h-8 w-8 place-items-center rounded-xl text-muted-foreground transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active && "bg-primary/15 text-primary",
        tone === "primary" && "text-primary hover:bg-primary/10",
        tone === "danger" &&
          "text-red-300 hover:bg-red-500/10 hover:text-red-200",
        tone === "default" && "hover:bg-white/[0.07] hover:text-foreground",
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
      className="group/author inline-flex min-w-0 items-center gap-2 transition hover:text-primary"
    >
      <span className="relative grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/35 to-sky-400/20 text-xs font-black text-foreground ring-1 ring-white/15">
        {image ? (
          <>
            {/* Native image deliberately uses the direct, normalized storage URL so avatars share the production-safe Arvan fallback. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          </>
        ) : (
          <span>{initial}</span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block max-w-[140px] truncate text-xs font-black text-foreground transition group-hover/author:text-primary">
          {displayName}
        </span>
        {name ? (
          <span className="block max-w-[140px] truncate text-[10px] font-medium text-muted-foreground">
            {username}@
          </span>
        ) : null}
      </span>
    </Link>
  );
}

"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import dynamic from "next/dynamic";
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
import type { PublicQuote } from "@/lib/quotes/service";
import { cn } from "@/lib/utils";
import { getQuoteDirectionProps } from "@/lib/text-direction";

const QuoteReadingDialog = dynamic(
  () => import("@/components/profile/QuoteReadingDialog"),
  { ssr: false },
);

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

interface QuoteCardProps {
  quote: PublicQuote;
  canLike: boolean;
  showAuthor?: boolean;
  showBook?: boolean;
  manage?: CardManage;
  background?: QuoteBackgroundVariant;
  className?: string;
}

export default function QuoteCard({
  quote,
  canLike,
  showAuthor = false,
  showBook = true,
  manage,
  background = "paper",
  className,
}: QuoteCardProps) {
  const [liked, setLiked] = useState(quote.likedByViewer);
  const [likeCount, setLikeCount] = useState(quote.likeCount);
  const [likePending, setLikePending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  const bookHref = `/book/${encodeURIComponent(
    quote.bookSlug || quote.bookId,
  )}`;

  const quoteText = quote.content?.trim() || "";
  const hasImage = Boolean(quote.imageKey);
  const fallbackText = `تکه‌ای تصویری از کتاب «${quote.bookTitle}»`;

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

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !previousLiked;

    setLiked(nextLiked);
    setLikeCount(previousCount + (nextLiked ? 1 : -1));
    setLikePending(true);

    try {
      const response = await fetch(`/api/quotes/${quote.id}/like`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Like request failed");
      }

      const data = (await response.json()) as {
        liked: boolean;
        likeCount: number;
      };

      setLiked(data.liked);
      setLikeCount(data.likeCount);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
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

      window.setTimeout(() => {
        setCopied(false);
      }, 1400);
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
      text: quoteText ? `«${quoteText}» — ${quote.bookTitle}` : fallbackText,
      url,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // The share sheet may be intentionally closed.
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

  function openFullQuote() {
    if (isLongQuote || hasImage) {
      setContentOpen(true);
    }
  }

  function handleQuoteKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if ((!isLongQuote && !hasImage) || (event.key !== "Enter" && event.key !== " ")) {
      return;
    }

    event.preventDefault();
    setContentOpen(true);
  }

  return (
    <>
      <article
        className={cn(
          "group relative flex h-full min-h-[410px] flex-col overflow-hidden",
          "rounded-[1.9rem] border border-border/55 bg-card/90",
          "p-3 shadow-[0_24px_70px_-46px_rgba(0,0,0,0.85)]",
          "transition-[transform,box-shadow,border-color] duration-300",
          "hover:-translate-y-1 hover:border-primary/20",
          "hover:shadow-[0_34px_90px_-50px_rgba(0,0,0,0.95)]",
          "sm:min-h-[440px] sm:p-4",
          className,
        )}
      >
        <QuoteBackground variant={background} />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-12 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent"
        />

        <QuoteCardHeader
          quote={quote}
          bookHref={bookHref}
          showAuthor={showAuthor}
          showBook={showBook}
        />

        <QuoteContent
          quoteText={quoteText}
          imageKey={quote.imageKey}
          bookTitle={quote.bookTitle}
          page={quote.page}
          isLongQuote={isLongQuote}
          canOpen={isLongQuote || hasImage}
          onOpen={openFullQuote}
          onKeyDown={handleQuoteKeyDown}
        />

        <QuoteCardFooter
          liked={liked}
          likeCount={likeCount}
          likePending={likePending}
          copied={copied}
          manage={manage}
          onLike={handleLike}
          onCopy={handleCopy}
          canCopy={Boolean(quoteText)}
          onShare={handleShare}
        />
      </article>

      {contentOpen ? (
        <QuoteReadingDialog
          open={contentOpen}
          onOpenChange={setContentOpen}
          quote={quote}
          quoteText={quoteText}
          bookHref={bookHref}
          showBook={showBook}
          renderBackground={() => <QuoteBackground variant={background} />}
        />
      ) : null}
    </>
  );
}

function QuoteCardHeader({
  quote,
  bookHref,
  showAuthor,
  showBook,
}: {
  quote: PublicQuote;
  bookHref: string;
  showAuthor: boolean;
  showBook: boolean;
}) {
  return (
    <header className="relative z-10 shrink-0 px-1 pb-2 pt-1">
      <div
        className={cn(
          "flex min-w-0 items-center gap-3",
          showAuthor && showBook ? "justify-between" : "justify-start",
        )}
      >
        {showAuthor && quote.authorUsername ? (
          <AuthorChip
            username={quote.authorUsername}
            name={quote.authorName}
            image={quote.authorImage}
          />
        ) : (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/10">
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
  );
}

function QuoteContent({
  quoteText,
  imageKey,
  bookTitle,
  page,
  isLongQuote,
  canOpen,
  onOpen,
  onKeyDown,
}: {
  quoteText: string;
  imageKey: string | null;
  bookTitle: string;
  page: number | null;
  isLongQuote: boolean;
  canOpen: boolean;
  onOpen: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-label={canOpen ? "مشاهده کامل تکه کتاب" : undefined}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className={cn(
        "relative z-10 mt-2 flex min-h-0 flex-1 overflow-hidden",
        "rounded-[1.55rem] border border-white/[0.055]",
        "bg-background/35 backdrop-blur-sm",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        canOpen &&
          "cursor-pointer transition-colors duration-300 hover:bg-background/45",
        canOpen &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.025] via-transparent to-black/[0.025]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.09] to-transparent"
      />

      <QuoteIcon
        aria-hidden="true"
        className="pointer-events-none absolute right-6 top-6 h-9 w-9 text-primary/[0.09] sm:right-8 sm:top-8"
      />

      <QuoteIcon
        aria-hidden="true"
        className="pointer-events-none absolute bottom-7 left-6 h-9 w-9 rotate-180 text-primary/[0.07] sm:bottom-8 sm:left-8"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-10 right-0 w-px bg-gradient-to-b from-transparent via-primary/45 to-transparent"
      />

      <div className="relative z-10 flex min-h-[285px] w-full flex-1 flex-col px-7 py-9 sm:min-h-[310px] sm:px-10 sm:py-11">
        {imageKey ? (
          <div className="relative mb-5 flex max-h-56 min-h-40 w-full items-center justify-center overflow-hidden rounded-2xl bg-black/15 ring-1 ring-border/50">
            <BookCoverImage
              src={imageKey}
              alt={`تصویر تکه‌ای از کتاب «${bookTitle}»`}
              width={700}
              height={900}
              className="h-auto max-h-56 w-auto max-w-full object-contain"
            />
          </div>
        ) : null}

        {quoteText ? <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="mx-auto w-full max-w-[34rem]">
            <p
              {...getQuoteDirectionProps(quoteText)}
              className={cn(
                "whitespace-pre-line text-center",
                "text-[13px] font-medium leading-7",
                "text-foreground/95",
                "sm:text-[15px] sm:leading-[2.2]",
                "md:text-[1rem] md:leading-[2.3]",
                "lg:text-base lg:leading-[2.4]",
                isLongQuote && "line-clamp-6",
              )}
            >
              {quoteText}
            </p>
          </div>
        </div> : null}

        {(isLongQuote || page) && (
          <div className="mt-5 flex min-h-8 shrink-0 items-center justify-between gap-3">
            {isLongQuote ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen();
                }}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full",
                  "px-2.5 text-[11px] font-black text-primary",
                  "transition-colors hover:bg-primary/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
              >
                ادامه خواندن
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span />
            )}

            {page ? <PageBadge page={page} /> : null}
          </div>
        )}
      </div>
    </div>
  );
}

function QuoteCardFooter({
  liked,
  likeCount,
  likePending,
  copied,
  manage,
  onLike,
  onCopy,
  canCopy,
  onShare,
}: {
  liked: boolean;
  likeCount: number;
  likePending: boolean;
  copied: boolean;
  manage?: CardManage;
  onLike: () => void;
  onCopy: () => void;
  canCopy: boolean;
  onShare: () => void;
}) {
  return (
    <footer className="relative z-10 mt-3 flex shrink-0 items-center justify-between gap-3 px-1 pb-1">
      <LikePill
        liked={liked}
        count={likeCount}
        pending={likePending}
        onClick={onLike}
      />

      <div className="flex items-center gap-0.5 rounded-2xl border border-border/45 bg-background/25 p-1 backdrop-blur-sm">
        <IconAction
          label={canCopy ? "کپی تکه" : "تکه تصویری متنی برای کپی ندارد"}
          onClick={onCopy}
          disabled={!canCopy}
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
          onClick={onShare}
          icon={<Share2 className="h-4 w-4" />}
        />

        {manage ? (
          <>
            <span aria-hidden="true" className="mx-1 h-4 w-px bg-border/65" />

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
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {variants[variant]}
    </div>
  );
}

function PaperBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,hsl(var(--primary)/0.14),transparent_36%),radial-gradient(circle_at_5%_100%,rgba(255,255,255,0.04),transparent_38%)]" />

      <div className="absolute inset-0 opacity-[0.055] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:12px_12px]" />
    </>
  );
}

function GridBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_38%)]" />

      <div className="absolute inset-0 opacity-[0.14] [background-image:linear-gradient(hsl(var(--border)/0.45)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border)/0.45)_1px,transparent_1px)] [background-size:24px_24px]" />
    </>
  );
}

function EditorialBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,hsl(var(--primary)/0.11),transparent_36%)]" />

      <div className="absolute inset-0 opacity-[0.18] [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,hsl(var(--border)/0.42)_32px)]" />
    </>
  );
}

function AuroraBackground() {
  return (
    <>
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />

      <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.025] via-transparent to-primary/[0.025]" />
    </>
  );
}

function MinimalBackground() {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(145deg,hsl(var(--primary)/0.07),transparent_42%,rgba(255,255,255,0.02))]" />
  );
}

function LinenBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_38%)]" />

      <div className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,transparent_0,transparent_3px,rgba(255,255,255,0.22)_4px),repeating-linear-gradient(90deg,transparent_0,transparent_4px,rgba(255,255,255,0.13)_5px)]" />
    </>
  );
}

function DustBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_0%,hsl(var(--primary)/0.11),transparent_38%)]" />

      <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.42)_0_1px,transparent_1.5px),radial-gradient(circle_at_70%_60%,hsl(var(--primary)/0.5)_0_1px,transparent_1.5px)] [background-size:47px_53px,71px_67px]" />
    </>
  );
}

function OrnamentBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_40%)]" />

      <div className="absolute inset-0 opacity-[0.055] [background-image:linear-gradient(45deg,hsl(var(--primary)/0.9)_12%,transparent_12%,transparent_88%,hsl(var(--primary)/0.9)_88%),linear-gradient(-45deg,hsl(var(--primary)/0.9)_12%,transparent_12%,transparent_88%,hsl(var(--primary)/0.9)_88%)] [background-size:30px_30px]" />
    </>
  );
}

function MarbleBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.09),transparent_40%)]" />

      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(ellipse_at_20%_20%,transparent_42%,rgba(255,255,255,0.32)_43%,transparent_45%),radial-gradient(ellipse_at_75%_80%,transparent_47%,hsl(var(--primary)/0.4)_48%,transparent_50%)]" />
    </>
  );
}

function LightBackground() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_44%)]" />

      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.025] to-transparent" />
    </>
  );
}

function PageBadge({ page }: { page: number }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background/30 px-2.5 py-1.5 text-[10px] font-medium tabular-nums text-muted-foreground ring-1 ring-border/40">
      <BookOpen className="h-3 w-3 opacity-70" />
      صفحه {page.toLocaleString("fa-IR")}
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
      className={cn(
        "group/book flex min-w-0 items-center gap-2.5",
        "rounded-2xl px-2 py-1.5",
        "transition-colors hover:bg-background/30",
        "sm:max-w-[60%]",
      )}
    >
      <span className="relative h-10 w-7 shrink-0 overflow-hidden rounded-lg bg-muted shadow-[0_7px_18px_-8px_rgba(0,0,0,0.85)] ring-1 ring-white/10">
        <BookCoverImage
          src={cover || PLACEHOLDER}
          alt={title}
          fill
          sizes="28px"
          className="object-cover transition-transform duration-500 group-hover/book:scale-105"
        />
      </span>

      <span className="min-w-0 text-right">
        <span className="block truncate text-[11px] font-black text-foreground transition-colors group-hover/book:text-primary">
          {title}
        </span>

        {author ? (
          <span className="mt-1 block truncate text-[10px] font-medium text-muted-foreground">
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
        "inline-flex h-9 min-w-[58px] items-center justify-center gap-1.5",
        "rounded-2xl px-3 text-xs font-black tabular-nums",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-60",
        liked
          ? "bg-rose-500/14 text-rose-300 ring-1 ring-rose-300/15"
          : "bg-background/25 text-muted-foreground ring-1 ring-border/45 hover:bg-rose-500/10 hover:text-rose-300",
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-transform duration-200",
          liked && "scale-110 fill-current",
        )}
      />

      <span>{count.toLocaleString("fa-IR")}</span>
    </button>
  );
}

export function IconAction({
  label,
  icon,
  onClick,
  active,
  tone = "default",
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
  tone?: "default" | "primary" | "danger";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={label}
      title={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-xl",
        "text-muted-foreground transition-all duration-200",
        "hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0",
        active && "bg-primary/12 text-primary",
        tone === "primary" && "text-primary hover:bg-primary/10",
        tone === "danger" &&
          "text-red-300 hover:bg-red-500/10 hover:text-red-200",
        tone === "default" && "hover:bg-white/[0.06] hover:text-foreground",
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
      onClick={(event) => event.stopPropagation()}
      className="group/author flex min-w-0 items-center gap-2 rounded-2xl px-1.5 py-1 transition-colors hover:bg-background/25"
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/30 to-sky-400/15 text-xs font-black text-foreground ring-1 ring-white/12">
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

      <span className="min-w-0 text-right">
        <span className="block max-w-[140px] truncate text-[11px] font-black text-foreground transition-colors group-hover/author:text-primary">
          {displayName}
        </span>

        {name ? (
          <span className="mt-0.5 block max-w-[140px] truncate text-[10px] font-medium text-muted-foreground">
            {username}@
          </span>
        ) : null}
      </span>
    </Link>
  );
}

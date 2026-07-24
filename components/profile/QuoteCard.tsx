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
  Star,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";

import BookCoverImage from "@/components/books/BookCoverImage";
import type { PublicQuote } from "@/lib/quotes/service";
import { cn } from "@/lib/utils";
import { getQuoteDirectionProps } from "@/lib/text-direction";
import type { QuoteBackground as QuoteBackgroundVariant } from "@/lib/quotes/backgrounds";
import { useQuoteBackgroundImage } from "@/lib/quotes/background-client";

const QuoteReadingDialog = dynamic(
  () => import("@/components/profile/QuoteReadingDialog"),
  { ssr: false },
);

const PLACEHOLDER = "/placeholder-cover.svg";
const LONG_QUOTE_CHAR_LIMIT = 220;
const LONG_QUOTE_WORD_LIMIT = 42;

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
  background = "default",
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
    if (
      (!isLongQuote && !hasImage) ||
      (event.key !== "Enter" && event.key !== " ")
    ) {
      return;
    }

    event.preventDefault();
    setContentOpen(true);
  }

  return (
    <>
      <article
        dir="rtl"
        className={cn(
          "group relative flex h-full min-h-[390px] flex-col overflow-hidden",
          "rounded-[1.75rem] border border-border/65 bg-card/80",
          "p-3.5 sm:min-h-[420px] sm:p-4",
          "shadow-[0_22px_65px_-48px_rgba(0,0,0,0.75)]",
          "transition-[border-color,background-color,box-shadow] duration-300",
          "hover:border-primary/20 hover:bg-card/90",
          "hover:shadow-[0_28px_72px_-50px_rgba(0,0,0,0.85)]",
          className,
        )}
      >
        {/* top highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 z-[1] h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
        />

        {/* Author */}
        {showAuthor && quote.authorUsername ? (
          <AuthorHeader
            username={quote.authorUsername}
            name={quote.authorName}
            image={quote.authorImage}
          />
        ) : null}

        {/* Book */}
        {showBook ? (
          <BookHeader
            href={bookHref}
            cover={quote.bookCover}
            title={quote.bookTitle}
            author={quote.bookAuthor}
          />
        ) : null}

        {/* Quote */}
        <QuoteContent
          quoteText={quoteText}
          imageKey={quote.imageKey}
          bookTitle={quote.bookTitle}
          page={quote.page}
          background={background}
          isLongQuote={isLongQuote}
          canOpen={isLongQuote || hasImage}
          onOpen={openFullQuote}
          onKeyDown={handleQuoteKeyDown}
        />

        {/* Actions */}
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

function AuthorHeader({
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
      className="
        group/author
        relative
        z-10
        flex
        min-w-0
        items-center
        gap-3
        pb-3
      "
    >
      {/* Avatar — right side in RTL */}
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-border/70 bg-secondary text-xs font-black text-foreground shadow-sm sm:h-12 sm:w-12">
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
        <span className="block max-w-[190px] truncate text-[13px] font-black text-foreground transition-colors group-hover/author:text-primary sm:text-sm">
          {displayName}
        </span>

        {name ? (
          <span
            dir="ltr"
            className="mt-0.5 block max-w-[190px] truncate text-[10px] font-medium text-muted-foreground sm:text-[11px]"
          >
            @{username}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function BookHeader({
  href,
  cover,
  title,
  author,
  rating,
}: {
  href: string;
  cover: string | null;
  title: string;
  author: string | null;
  rating?: number | null;
}) {
  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className="
        group/book
        relative
        z-10
        flex
        min-w-0
        items-center
        gap-4
        py-1
      "
    >
      <span
        className="
          relative
          h-[6rem]
          w-[4.15rem]
          shrink-0
          overflow-hidden
          rounded-[4px]
          bg-muted
          shadow-[0_14px_28px_-16px_rgba(0,0,0,0.75)]
          ring-1
          ring-border/40
          sm:h-[6.5rem]
          sm:w-[4.5rem]
        "
      >
        <BookCoverImage
          src={cover || PLACEHOLDER}
          alt={title}
          fill
          sizes="76px"
          className="object-cover transition-transform duration-300 group-hover/book:scale-[1.025]"
        />
      </span>

      <span className="min-w-0 flex-1 text-right">
        <span className="block truncate text-[15px] font-black leading-7 text-foreground transition-colors group-hover/book:text-primary sm:text-base">
          {title}
        </span>

        {author ? (
          <span className="mt-0.5 block truncate text-xs font-medium leading-5 text-muted-foreground sm:text-[13px]">
            {author}
          </span>
        ) : null}

        {typeof rating === "number" ? (
          <span className="mt-1.5 flex items-center gap-1 text-xs font-bold text-muted-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />

            <span className="tabular-nums text-foreground/85">
              {rating.toLocaleString("fa-IR", {
                maximumFractionDigits: 1,
              })}
            </span>

            <span className="text-[10px] font-medium text-muted-foreground/70">
              از ۵
            </span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function QuoteContent({
  quoteText,
  imageKey,
  bookTitle,
  page,
  background,
  isLongQuote,
  canOpen,
  onOpen,
  onKeyDown,
}: {
  quoteText: string;
  imageKey: string | null;
  bookTitle: string;
  page: number | null;
  background: QuoteBackgroundVariant;
  isLongQuote: boolean;
  canOpen: boolean;
  onOpen: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const hasArtwork = background !== "default";

  return (
    <div
      role={canOpen ? "button" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-label={canOpen ? "مشاهده کامل تکه کتاب" : undefined}
      onClick={onOpen}
      onKeyDown={onKeyDown}
      className={cn(
        "relative z-10 mt-3 flex min-h-0 flex-1 overflow-hidden",
        "rounded-[1.45rem] border",
        hasArtwork
          ? "border-white/10 bg-black"
          : "border-border/60 bg-background/30",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
        canOpen &&
          "cursor-pointer transition-[border-color,box-shadow] duration-300",
        canOpen &&
          (hasArtwork
            ? "hover:border-white/20 hover:shadow-[0_18px_46px_-34px_rgba(0,0,0,0.9)]"
            : "hover:border-primary/15"),
        canOpen &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
      )}
    >
      {/* Background belongs ONLY to the quote area. */}
      <QuoteBackground variant={background} />

      {/* Decorative quote marks */}
      <QuoteIcon
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute right-4 top-4 z-[1] h-7 w-7 sm:right-5 sm:top-5 sm:h-8 sm:w-8",
          hasArtwork ? "text-white/35" : "text-primary/25",
        )}
      />

      <QuoteIcon
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute bottom-4 left-4 z-[1] h-7 w-7 rotate-180 sm:bottom-5 sm:left-5 sm:h-8 sm:w-8",
          hasArtwork ? "text-white/15" : "text-primary/10",
        )}
      />

      <div className="relative z-10 flex min-h-[205px] w-full flex-1 flex-col px-5 py-6 sm:min-h-[230px] sm:px-7 sm:py-7">
        {imageKey ? (
          <div
            className={cn(
              "relative mb-4 flex max-h-48 min-h-32 w-full items-center justify-center overflow-hidden rounded-xl",
              hasArtwork
                ? "bg-black/25 ring-1 ring-white/15 backdrop-blur-[2px]"
                : "bg-black/10 ring-1 ring-border/40",
            )}
          >
            <BookCoverImage
              src={imageKey}
              alt={`تصویر تکه‌ای از کتاب «${bookTitle}»`}
              width={700}
              height={900}
              className="h-auto max-h-48 w-auto max-w-full object-contain"
            />
          </div>
        ) : null}

        {quoteText ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="mx-auto w-full max-w-[34rem]">
              <p
                {...getQuoteDirectionProps(quoteText)}
                className={cn(
                  "whitespace-pre-line text-center",
                  "text-[13px] font-medium leading-7",
                  hasArtwork
                    ? "text-white [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]"
                    : "text-foreground/95",
                  "sm:text-[15px] sm:leading-[2.2]",
                  "md:text-[1rem] md:leading-[2.3]",
                  "lg:text-base lg:leading-[2.4]",
                  isLongQuote && "line-clamp-6",
                )}
              >
                {quoteText}
              </p>
            </div>
          </div>
        ) : null}

        {(isLongQuote || page) && (
          <div className="mt-4 flex min-h-8 shrink-0 items-center justify-between gap-3">
            {isLongQuote ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen();
                }}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-1.5",
                  "text-[11px] font-black transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
                  hasArtwork
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-primary hover:bg-primary/8",
                )}
              >
                ادامه خواندن
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span />
            )}

            {page ? <PageBadge page={page} inverted={hasArtwork} /> : null}
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
    <footer className="relative z-10 mt-3 flex shrink-0 items-center justify-between gap-2">
      <LikePill
        liked={liked}
        count={likeCount}
        pending={likePending}
        onClick={onLike}
      />

      <div className="flex items-center gap-1.5">
        <ActionPill
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

        <ActionPill
          label="اشتراک‌گذاری"
          onClick={onShare}
          icon={<Share2 className="h-4 w-4" />}
        />

        {manage ? (
          <>
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

function PageBadge({
  page,
  inverted = false,
}: {
  page: number;
  inverted?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 text-[10px] font-medium tabular-nums",
        inverted ? "text-white/75" : "text-muted-foreground",
      )}
    >
      <BookOpen className="h-3.5 w-3.5 opacity-70" />
      صفحه {page.toLocaleString("fa-IR")}
    </span>
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
        "inline-flex h-10 min-w-[68px] items-center justify-center gap-2 rounded-full",
        "border border-border/60 bg-background/30 px-3",
        "text-xs font-black tabular-nums",
        "transition-[border-color,background-color,color] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        "disabled:cursor-not-allowed disabled:opacity-60",
        liked
          ? "border-rose-400/15 bg-rose-500/10 text-rose-400"
          : "text-muted-foreground hover:border-rose-400/15 hover:bg-rose-500/8 hover:text-rose-400",
      )}
    >
      <Heart
        className={cn(
          "h-[17px] w-[17px] transition-transform duration-200",
          liked && "scale-110 fill-current",
        )}
      />

      <span>{count.toLocaleString("fa-IR")}</span>
    </button>
  );
}

function ActionPill({
  label,
  icon,
  onClick,
  active,
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  active?: boolean;
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
        "grid h-10 w-12 place-items-center rounded-full",
        "border border-border/60 bg-background/30",
        "text-muted-foreground",
        "transition-[border-color,background-color,color] duration-200",
        "hover:border-primary/15 hover:bg-primary/5 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        "disabled:cursor-not-allowed disabled:opacity-30",
        active && "border-primary/15 bg-primary/8 text-primary",
      )}
    >
      {icon}
    </button>
  );
}

export function IconAction({
  label,
  icon,
  onClick,
  tone = "default",
  disabled = false,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
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
        "grid h-9 w-9 place-items-center rounded-full",
        "text-muted-foreground transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35",
        "disabled:cursor-not-allowed disabled:opacity-30",
        tone === "primary" && "text-primary hover:bg-primary/8",
        tone === "danger" &&
          "text-red-400 hover:bg-red-500/8 hover:text-red-300",
        tone === "default" && "hover:bg-foreground/5 hover:text-foreground",
      )}
    >
      {icon}
    </button>
  );
}

/* Quote backgrounds — rendered only inside the quote-content area. */
export function QuoteBackground({
  variant,
}: {
  variant: QuoteBackgroundVariant;
}) {
  const imageSrc = useQuoteBackgroundImage(variant);

  if (!imageSrc || variant === "default") {
    return <DefaultQuoteBackground />;
  }

  return <ImageQuoteBackground src={imageSrc} />;
}

function DefaultQuoteBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Deep paper base */}
      <div className="absolute inset-0 bg-background/65" />

      {/* Soft literary glows */}
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/[0.11] blur-3xl" />
      <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full bg-primary/[0.045] blur-3xl" />

      {/* Elegant ruled-paper lines */}
      <div className="absolute inset-0 opacity-[0.15] [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_31px,hsl(var(--border)/0.85)_32px)]" />

      {/* Subtle notebook margin */}
      <div className="absolute bottom-0 right-9 top-0 w-px bg-primary/[0.14]" />

      {/* Fine paper grain */}
      <div className="absolute inset-0 opacity-[0.11] [background-image:radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.18)_0.7px,transparent_0.8px)] [background-size:17px_17px]" />

      {/* Top highlight */}
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />

      {/* Soft vignette keeps focus on the writing */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background)/0.18)_100%)]" />
    </div>
  );
}

function ImageQuoteBackground({ src }: { src: string }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Artwork */}
      <div
        className="absolute inset-0 scale-[1.01] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${src}")`,
        }}
      />

      {/* Readability — keep the artwork visible, not washed out */}
      <div className="absolute inset-0 bg-black/34" />

      {/* Gentle center focus */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.18)_52%,rgba(0,0,0,0.38)_100%)]" />

      {/* Cinematic depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/25" />

      {/* Thin glass-like highlight */}
      <div className="absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
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
      className="group/author flex min-w-0 items-center gap-2.5"
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-border/70 bg-secondary text-xs font-black text-foreground shadow-sm">
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
        <span className="block max-w-[150px] truncate text-[11px] font-black text-foreground transition-colors group-hover/author:text-primary">
          {displayName}
        </span>

        {name ? (
          <span
            dir="ltr"
            className="mt-0.5 block max-w-[150px] truncate text-[10px] font-medium text-muted-foreground"
          >
            @{username}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

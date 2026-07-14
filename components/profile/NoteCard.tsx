"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Heart,
  NotebookPen,
  Pencil,
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
import BookCoverImage from "@/components/books/BookCoverImage";
import RichTextContent from "@/components/content/RichTextContent";
import type { PublicNote } from "@/lib/notes/service";
import { AuthorChip, type CardManage } from "@/components/profile/QuoteCard";
import { richTextToPlainText } from "@/lib/content/rich-text";

const PLACEHOLDER = "/placeholder-cover.svg";
// These thresholds are purely presentational: a six-line preview should show a
// meaningful passage before the full-note control is needed.
const LONG_NOTE_CHAR_LIMIT = 360;
const LONG_NOTE_WORD_LIMIT = 65;

export default function NoteCard({
  note,
  canLike = false,
  showAuthor = false,
  showBook = true,
  manage,
}: {
  note: PublicNote;
  canLike?: boolean;
  showAuthor?: boolean;
  showBook?: boolean;
  manage?: CardManage;
}) {
  const [liked, setLiked] = useState(note.likedByViewer);
  const [likeCount, setLikeCount] = useState(note.likeCount);
  const [likePending, setLikePending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);

  const bookHref = `/book/${encodeURIComponent(note.bookSlug || note.bookId)}`;
  const noteText = richTextToPlainText(note.content);
  const wordCount = noteText.split(/\s+/).filter(Boolean).length;
  const isLongNote =
    noteText.length > LONG_NOTE_CHAR_LIMIT || wordCount > LONG_NOTE_WORD_LIMIT;

  const created = new Date(note.createdAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
      const res = await fetch(`/api/notes/${note.id}/like`, {
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
      await navigator.clipboard.writeText(noteText);
      setCopied(true);
      toast.success("یادداشت کپی شد");
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
      title: note.bookTitle,
      text: `${noteText} — ${note.bookTitle}`,
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
    if (isLongNote) setContentOpen(true);
  }

  function handleNoteKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!isLongNote) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setContentOpen(true);
    }
  }

  return (
    <>
      <article className="group relative overflow-hidden rounded-[1.6rem] border border-border/80 bg-card/90 p-4 shadow-[0_20px_65px_-46px_rgba(0,0,0,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-300/25 hover:shadow-[0_26px_70px_-48px_rgba(0,0,0,0.95)] sm:p-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-white/15 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-sky-400/10 opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-100" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {showAuthor && note.authorUsername ? (
              <AuthorChip
                username={note.authorUsername}
                name={note.authorName}
                image={note.authorImage}
              />
            ) : (
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20">
                <NotebookPen className="h-4 w-4" />
              </span>
            )}

            {showBook ? (
              <BookChip
                href={bookHref}
                cover={note.bookCover}
                title={note.bookTitle}
                author={note.bookAuthor}
              />
            ) : null}
          </div>

          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/80 bg-background/45 px-2.5 py-1 text-[11px] font-bold tabular-nums text-muted-foreground backdrop-blur">
            <CalendarDays className="h-3.5 w-3.5" />
            {created}
          </span>
        </div>

        <div
          role={isLongNote ? "button" : undefined}
          tabIndex={isLongNote ? 0 : undefined}
          onClick={openFullContent}
          onKeyDown={handleNoteKeyDown}
          aria-label={isLongNote ? "مشاهده متن کامل یادداشت" : undefined}
          className={cn(
            "relative mt-5 overflow-hidden rounded-[1.3rem] border border-border/75 bg-background/35 px-4 py-4 outline-none sm:px-5 sm:py-5",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
            isLongNote &&
              "cursor-pointer transition-colors hover:border-sky-300/25 hover:bg-background/50 focus-visible:ring-2 focus-visible:ring-sky-300/25",
          )}
        >
          <NotePattern />

          <div className="pointer-events-none absolute inset-y-5 right-0 w-1 rounded-full bg-gradient-to-b from-sky-300/70 via-sky-300/35 to-transparent" />
          <NotebookPen className="pointer-events-none absolute right-4 top-5 h-4.5 w-4.5 text-sky-300/25 sm:right-5" />

          <RichTextContent
            content={note.content}
            className={cn(
              "relative z-10 break-words pr-7 text-right text-[0.9375rem] font-medium leading-8 text-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-8",
              "[&_a]:break-all [&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-r-2 [&_blockquote]:border-sky-300/35 [&_blockquote]:pr-3 [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pr-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pr-6",
              isLongNote && "line-clamp-6",
            )}
          />

          {isLongNote ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openFullContent();
              }}
              className="relative z-10 mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl border border-sky-300/20 bg-sky-400/[0.07] px-3 text-xs font-black text-sky-300 transition-all hover:-translate-y-0.5 hover:border-sky-300/35 hover:bg-sky-400/15 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/30"
            >
                مشاهده کامل
                <ExternalLink className="h-3 w-3" />
            </button>
          ) : null}
        </div>

        <div className="relative mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3 sm:mt-5 sm:pt-4">
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
              "inline-flex h-9 min-w-12 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black tabular-nums transition-all disabled:opacity-60",
              liked
                ? "bg-rose-500/12 text-rose-300 ring-1 ring-rose-300/15"
                : "text-muted-foreground hover:bg-rose-500/10 hover:text-rose-300",
            )}
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            {likeCount.toLocaleString("fa-IR")}
          </button>

          <div className="flex items-center gap-0.5">
            <NoteIconAction
              label="کپی یادداشت"
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

            <NoteIconAction
              label="اشتراک‌گذاری"
              onClick={handleShare}
              icon={<Share2 className="h-4 w-4" />}
            />

            {manage ? (
              <>
                <span className="mx-1 h-5 w-px bg-border/80" />

                <NoteIconAction
                  label="ویرایش"
                  onClick={manage.onEdit}
                  tone="primary"
                  icon={<Pencil className="h-4 w-4" />}
                />

                <NoteIconAction
                  label="حذف"
                  onClick={manage.onDelete}
                  tone="danger"
                  icon={<Trash2 className="h-4 w-4" />}
                />
              </>
            ) : null}
          </div>
        </div>
      </article>

      <NoteContentDialog
        open={contentOpen}
        onOpenChange={setContentOpen}
        note={note}
        noteText={noteText}
        created={created}
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
      className="flex min-w-0 items-center gap-2 rounded-2xl border border-border/80 bg-background/35 py-1 pe-3 ps-1.5 transition-colors hover:border-sky-300/25 hover:bg-sky-300/[0.035]"
    >
      <span className="relative aspect-[3/4] w-8 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
        <BookCoverImage
          src={cover || PLACEHOLDER}
          alt={title}
          fill
          sizes="32px"
          className="object-cover"
        />
      </span>

      <span className="min-w-0">
        <span className="block max-w-[190px] truncate text-xs font-black text-foreground">
          {title}
        </span>

        {author ? (
          <span className="mt-0.5 block max-w-[190px] truncate text-[10px] text-muted-foreground">
            {author}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function NotePattern() {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.13) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.07) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.07) 75%, transparent 75%, transparent)",
          backgroundSize: "26px 26px",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(125,211,252,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_46%)]"
      />
    </>
  );
}

function NoteContentDialog({
  open,
  onOpenChange,
  note,
  noteText,
  created,
  bookHref,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: PublicNote;
  noteText: string;
  created: string;
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

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-sky-400/10 via-transparent to-transparent" />

          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20">
              <NotebookPen className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <DialogTitle className="text-base font-black text-foreground">
                یادداشت کاربر
              </DialogTitle>

              <DialogDescription className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                {note.bookTitle}، {created}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="max-h-[72vh] overflow-auto p-5">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-border/80 bg-background/40 p-5">
            <NotePattern />

            <div className="pointer-events-none absolute inset-y-5 right-0 w-1 rounded-full bg-gradient-to-b from-sky-300/70 via-sky-300/35 to-transparent" />
            <NotebookPen className="pointer-events-none absolute right-5 top-5 h-6 w-6 text-sky-300/25" />

            <RichTextContent
              content={note.content}
              className="relative z-10 break-words pr-9 text-right text-sm font-medium leading-8 text-foreground [overflow-wrap:anywhere] sm:text-base sm:leading-9 [&_a]:break-all [&_a]:text-primary [&_a]:underline [&_blockquote]:my-4 [&_blockquote]:border-r-2 [&_blockquote]:border-sky-300/35 [&_blockquote]:bg-sky-400/[0.06] [&_blockquote]:py-2 [&_blockquote]:pr-4 [&_li]:my-1 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pr-7 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pr-7"
            />
          </div>

          <Link
            href={bookHref}
            onClick={() => onOpenChange(false)}
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl border border-border/80 bg-background/35 px-4 text-xs font-black text-foreground transition-colors hover:border-sky-300/25 hover:bg-sky-400/10 hover:text-sky-300"
          >
            مشاهده کتاب
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NoteIconAction({
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
        "inline-flex h-8 w-8 items-center justify-center rounded-xl border text-muted-foreground shadow-sm transition-all hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/25",
        active
          ? "border-sky-300/25 bg-sky-400/10 text-sky-300"
          : "border-transparent bg-transparent hover:border-border/80 hover:bg-white/[0.05]",
        tone === "primary" &&
          "text-sky-300 hover:border-sky-300/25 hover:bg-sky-400/10",
        tone === "danger" &&
          "text-red-300/85 hover:border-red-300/20 hover:bg-red-500/10 hover:text-red-300",
      )}
    >
      {icon}
    </button>
  );
}

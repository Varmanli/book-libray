"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageSquareText,
  NotebookPen,
  Plus,
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
import NoteCard from "@/components/profile/NoteCard";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import type { PublicNote } from "@/lib/notes/service";

type NoteTab = "book" | "edition";

export default function BookNotesTabsSection({
  catalogBookId,
  selectedEditionId,
  isLoggedIn,
  bookNotes,
  editionNotes,
  viewerId,
  viewAllHref,
  loginHref,
  title = "یادداشت‌های کاربران درباره کتاب",
  editionSummary,
}: {
  catalogBookId: string;
  selectedEditionId: string | null;
  isLoggedIn: boolean;
  bookNotes: PublicNote[];
  editionNotes: PublicNote[];
  viewerId: string | null;
  viewAllHref?: string;
  loginHref?: string;
  title?: string;
  editionSummary?: {
    label?: string | null;
    publisher?: string | null;
    translator?: string | null;
    publishedYear?: number | null;
  } | null;
}) {
  const router = useRouter();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PublicNote | null>(null);
  const [activeTab, setActiveTab] = useState<NoteTab>("book");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const hasEditionTab = Boolean(selectedEditionId);

  useEffect(() => {
    if (!hasEditionTab && activeTab === "edition") {
      setActiveTab("book");
    }
  }, [activeTab, hasEditionTab]);

  const scopedNotes = activeTab === "edition" ? editionNotes : bookNotes;
  const hasNotes = scopedNotes.length > 0;
  const scope: NoteTab =
    editing?.scope ?? (activeTab === "edition" && hasEditionTab ? "edition" : "book");

  function openAdd() {
    setEditing(null);
    setContent("");
    setOpen(true);
  }

  function openEdit(note: PublicNote) {
    setEditing(note);
    setActiveTab(note.scope);
    setContent(note.content);
    setOpen(true);
  }

  async function submit() {
    const text = content.trim();
    if (!text || busy) return;

    setBusy(true);
    try {
      if (editing) {
        const res = await fetch(`/api/notes/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });

        if (!res.ok) throw new Error((await res.json()).error || "خطا");
        toast.success("یادداشت بروزرسانی شد");
      } else {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            catalogBookId,
            bookEditionId: scope === "edition" ? selectedEditionId : null,
            scope,
            content: text,
          }),
        });

        if (!res.ok) throw new Error((await res.json()).error || "خطا");
        toast.success("یادداشت منتشر شد");
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
      title: "حذف یادداشت",
      description: "این یادداشت حذف شود؟ این عملیات قابل بازگشت نیست.",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
          if (!res.ok) throw new Error((await res.json()).error || "خطا");
          toast.success("یادداشت حذف شد.");
          router.refresh();
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "حذف یادداشت ناموفق بود.");
        }
      },
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/55 shadow-[0_22px_70px_-48px_rgba(0,0,0,0.65)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_42%)]" />

      <div className="relative">
        <div className="relative overflow-hidden border-b border-border/70 px-4 py-5 sm:px-6 lg:px-7">
          <div className="relative flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20 shadow-lg shadow-sky-400/10">
                  <NotebookPen className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-lg font-black text-foreground sm:text-xl">
                    {title}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-border/70 bg-background/45 px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                      {(activeTab === "edition" ? editionNotes.length : bookNotes.length).toLocaleString("fa-IR")} یادداشت
                    </span>

                    {viewAllHref ? (
                      <Link
                        href={viewAllHref}
                        className="inline-flex h-8 items-center rounded-full border border-border/70 bg-background/45 px-3 text-[11px] font-bold text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/10 hover:text-primary"
                      >
                        مشاهده همه
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>

              {isLoggedIn ? (
                <Button
                  type="button"
                  onClick={openAdd}
                  className="h-10 rounded-2xl px-4 text-sm font-black shadow-lg shadow-primary/15"
                >
                  <Plus className="h-4 w-4" />
                  افزودن یادداشت
                </Button>
              ) : loginHref ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-10 rounded-2xl border-border/80 bg-background/45 px-4 text-sm font-black"
                >
                  <Link href={loginHref}>
                    ورود برای یادداشت‌گذاشتن
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
              <TabButton
                active={activeTab === "book"}
                onClick={() => setActiveTab("book")}
                label="یادداشت‌های کتاب"
                count={bookNotes.length}
              />

              {hasEditionTab ? (
                <TabButton
                  active={activeTab === "edition"}
                  onClick={() => setActiveTab("edition")}
                  label="یادداشت‌های این نسخه"
                  count={editionNotes.length}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 lg:px-7">
          {activeTab === "edition" && editionSummary ? (
            <EditionContextSummary summary={editionSummary} />
          ) : null}

          {!hasNotes ? (
            <EmptyNotesState
              isLoggedIn={isLoggedIn}
              onAdd={openAdd}
              scope={activeTab}
              loginHref={loginHref}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:gap-5">
              {scopedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  canLike={isLoggedIn}
                  showAuthor
                  showBook={false}
                  manage={
                    viewerId && note.authorUserId === viewerId
                      ? {
                          onEdit: () => openEdit(note),
                          onDelete: () => remove(note.id),
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NoteDialog
        open={open}
        editing={editing}
        content={content}
        busy={busy}
        scope={scope}
        onOpenChange={setOpen}
        onContentChange={setContent}
        onSubmit={submit}
      />
    </section>
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-w-0 items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-right text-xs font-bold transition-colors sm:text-sm",
        active
          ? "border-sky-300/25 bg-sky-400/10 text-sky-300"
          : "border-border/70 bg-background/45 text-muted-foreground hover:border-primary/20 hover:bg-primary/5 hover:text-foreground",
      )}
    >
      <span className="truncate">{label}</span>
      <span className="shrink-0 rounded-full border border-current/15 px-2 py-0.5 text-[10px] tabular-nums sm:text-[11px]">
        {count.toLocaleString("fa-IR")}
      </span>
    </button>
  );
}

function EmptyNotesState({
  isLoggedIn,
  onAdd,
  scope,
  loginHref,
}: {
  isLoggedIn: boolean;
  onAdd: () => void;
  scope: NoteTab;
  loginHref?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-dashed border-border/80 bg-background/35 px-4 py-10 text-center">
      <div className="relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20">
          <MessageSquareText className="h-6 w-6" />
        </div>

        <p className="mt-4 text-sm font-black text-foreground">
          {scope === "edition"
            ? "هنوز یادداشتی درباره این نسخه منتشر نشده"
            : "هنوز یادداشتی درباره کتاب منتشر نشده"}
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-muted-foreground">
          {isLoggedIn
            ? scope === "edition"
              ? "اولین برداشت عمومی از این نسخه یا ترجمه را بنویس."
              : "اولین برداشت عمومی از خود کتاب را بنویس."
            : scope === "edition"
              ? "هنوز خواننده‌ای برای این نسخه یادداشت منتشر نکرده است."
              : "هنوز خواننده‌ای برای این کتاب یادداشت منتشر نکرده است."}
        </p>

        {isLoggedIn ? (
          <Button
            type="button"
            onClick={onAdd}
            className="mt-5 h-10 rounded-2xl px-4 text-sm font-bold"
          >
            <Plus className="h-4 w-4" />
            افزودن اولین یادداشت
          </Button>
        ) : loginHref ? (
          <Button
            asChild
            variant="outline"
            className="mt-5 h-10 rounded-2xl border-border/80 bg-background/45 px-4 text-sm font-bold"
          >
            <Link href={loginHref}>ورود برای نوشتن یادداشت</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function EditionContextSummary({
  summary,
}: {
  summary: {
    label?: string | null;
    publisher?: string | null;
    translator?: string | null;
    publishedYear?: number | null;
  };
}) {
  const items = [
    summary.label,
    summary.publisher,
    summary.translator ? `ترجمه ${summary.translator}` : null,
    summary.publishedYear != null
      ? summary.publishedYear.toLocaleString("fa-IR")
      : null,
  ].filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div className="mb-4 rounded-[1.35rem] border border-border/70 bg-background/35 px-4 py-3 text-xs leading-6 text-muted-foreground sm:text-sm">
      <span className="font-black text-foreground">نسخه انتخاب‌شده:</span>{" "}
      {items.join(" • ")}
    </div>
  );
}

function NoteDialog({
  open,
  editing,
  content,
  busy,
  scope,
  onOpenChange,
  onContentChange,
  onSubmit,
}: {
  open: boolean;
  editing: PublicNote | null;
  content: string;
  busy: boolean;
  scope: NoteTab;
  onOpenChange: (open: boolean) => void;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const scopeLabel = scope === "edition" ? "این نسخه" : "خود کتاب";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[1.75rem] border-border bg-card p-0 shadow-2xl sm:max-w-lg">
        <div className="relative border-b border-border/70 px-5 py-5">
          <div className="relative flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20">
              <Sparkles className="h-5 w-5" />
            </span>

            <div>
              <DialogTitle className="text-base font-black text-foreground">
                {editing ? "ویرایش یادداشت" : "افزودن یادداشت"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-6 text-muted-foreground">
                {editing
                  ? "یادداشت عمومی روی صفحه کتاب و پروفایل تو دیده می‌شود."
                  : `این یادداشت برای «${scopeLabel}» ثبت می‌شود و روی صفحه کتاب و پروفایل تو دیده می‌شود.`}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {!editing ? (
            <div className="rounded-2xl border border-border/70 bg-background/35 px-4 py-3 text-xs font-bold text-muted-foreground">
              ثبت یادداشت برای: <span className="text-foreground">{scopeLabel}</span>
            </div>
          ) : null}

          <Textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder={
              scope === "edition"
                ? "برداشتت از این نسخه یا ترجمه..."
                : "برداشتت از خود کتاب..."
            }
            className="min-h-44 resize-none rounded-2xl border-border bg-background/45 text-sm leading-7 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/25"
          />

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
              className="h-10 rounded-xl px-4 font-bold disabled:cursor-not-allowed disabled:opacity-40"
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
      </DialogContent>
    </Dialog>
  );
}

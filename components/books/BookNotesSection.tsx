"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
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
import type { PublicNote } from "@/lib/notes/service";

export default function BookNotesSection({
  subjectBookId,
  viewerEntryId,
  isLoggedIn,
  notes,
}: {
  subjectBookId: string;
  viewerEntryId: string | null;
  isLoggedIn: boolean;
  notes: PublicNote[];
}) {
  const router = useRouter();
  const confirm = useConfirm();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PublicNote | null>(null);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const hasNotes = notes.length > 0;

  function openAdd() {
    setEditing(null);
    setContent("");
    setOpen(true);
  }

  function openEdit(note: PublicNote) {
    setEditing(note);
    setContent(note.content);
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

    if (!text || busy) return;

    setBusy(true);

    try {
      if (editing) {
        const res = await fetch(`/api/notes/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });

        if (!res.ok) {
          throw new Error((await res.json()).error || "خطا");
        }

        toast.success("یادداشت بروزرسانی شد");
      } else {
        const bookId = await ensureEntryId();

        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId, content: text }),
        });

        if (!res.ok) {
          throw new Error((await res.json()).error || "خطا");
        }

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

          if (!res.ok) {
            throw new Error((await res.json()).error || "خطا");
          }

          toast.success("یادداشت حذف شد.");
          router.refresh();
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "حذف یادداشت ناموفق بود.",
          );
        }
      },
    });
  }

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/80 bg-card/55 shadow-[0_22px_70px_-48px_rgba(0,0,0,0.65)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_42%)]" />

      <div className="relative">
        <div className="relative overflow-hidden border-b border-border/70 px-4 py-5 sm:px-6 lg:px-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-l from-sky-400/10 via-transparent to-transparent" />

          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20 shadow-lg shadow-sky-400/10">
                <NotebookPen className="h-5 w-5" />
              </span>

              <div>
                <div className="flex flex-wrap items-center gap-2 justify-center mt-3">
                  <h2 className="text-lg font-black text-foreground sm:text-xl">
                    یادداشت‌های کاربران
                  </h2>

                  {hasNotes ? (
                    <span className="rounded-full border border-border/70 bg-background/45 px-2.5 py-1 text-[11px] font-bold text-muted-foreground backdrop-blur">
                      {notes.length.toLocaleString("fa-IR")} یادداشت
                    </span>
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
            ) : null}
          </div>
        </div>

        <div className="px-4 py-5 sm:px-6 lg:px-7">
          {!hasNotes ? (
            <EmptyNotesState isLoggedIn={isLoggedIn} onAdd={openAdd} />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:gap-5">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  canLike={isLoggedIn}
                  showAuthor
                  showBook={false}
                  manage={
                    viewerEntryId && note.bookId === viewerEntryId
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
        onOpenChange={setOpen}
        onContentChange={setContent}
        onSubmit={submit}
      />
    </section>
  );
}

function EmptyNotesState({
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20">
          <MessageSquareText className="h-6 w-6" />
        </div>

        <p className="mt-4 text-sm font-black text-foreground">
          هنوز یادداشتی منتشر نشده
        </p>

        <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-muted-foreground">
          {isLoggedIn
            ? "اولین برداشت عمومی از این کتاب را بنویس تا این بخش جان بگیرد."
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
        ) : null}
      </div>
    </div>
  );
}

function NoteDialog({
  open,
  editing,
  content,
  busy,
  onOpenChange,
  onContentChange,
  onSubmit,
}: {
  open: boolean;
  editing: PublicNote | null;
  content: string;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onContentChange: (value: string) => void;
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
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300 ring-1 ring-sky-300/20">
              <Sparkles className="h-5 w-5" />
            </span>

            <div>
              <DialogTitle className="text-base font-black text-foreground">
                {editing ? "ویرایش یادداشت" : "افزودن یادداشت"}
              </DialogTitle>

              <DialogDescription className="mt-1 text-xs leading-6 text-muted-foreground">
                یادداشتی عمومی درباره این کتاب بنویس؛ روی صفحه کتاب و پروفایل تو
                دیده می‌شود.
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          <Textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="برداشتت از این کتاب..."
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

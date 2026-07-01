"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import toast from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type CatalogEdition,
  type CatalogResult,
} from "@/components/catalog/types";

interface AddToLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book: CatalogResult | null;
  edition: CatalogEdition | null;
}

export function AddToLibraryDialog({
  open,
  onOpenChange,
  book,
  edition,
}: AddToLibraryDialogProps) {
  const router = useRouter();
  const [status, setStatus] = useState("UNREAD");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!book || !edition) return null;

  const editionMeta = [
    edition.translator && `ترجمه‌ی ${edition.translator}`,
    edition.publisher,
    edition.publishedYear ? String(edition.publishedYear) : null,
  ].filter(Boolean);

  const handleAdd = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          editionId: edition.id,
          status,
          rating: rating || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "افزودن به کتابخانه ناموفق بود");
        return;
      }
      toast.success(data.message || "به کتابخانه اضافه شد");
      onOpenChange(false);
      router.push(
        data.book?.slug
          ? `/book/${encodeURIComponent(data.book.slug)}`
          : data.book?.id
            ? `/book/${encodeURIComponent(data.book.id)}`
            : "/books",
      );
      router.refresh();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>افزودن به کتابخانه</DialogTitle>
          <DialogDescription>
            وضعیت مطالعه و یادداشت شخصی‌ات را برای این کتاب مشخص کن.
          </DialogDescription>
        </DialogHeader>

        {/* خلاصه‌ی کتاب و نسخه */}
        <div className="flex gap-3 rounded-xl border border-border bg-black/20 p-3">
          <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
            {edition.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={edition.coverImage}
                alt={book.title}
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="truncate font-semibold text-foreground">{book.title}</p>
            <p className="truncate text-sm text-muted-foreground">
              {book.author}
            </p>
            {editionMeta.length > 0 && (
              <p className="truncate text-xs text-muted-foreground">
                {editionMeta.join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="library-status" className="pb-2">
              وضعیت
            </Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="library-status" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNREAD">خوانده‌نشده</SelectItem>
                <SelectItem value="READING">در حال خواندن</SelectItem>
                <SelectItem value="FINISHED">تمام‌شده</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="pb-2">امتیاز</Label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="امتیاز">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} ستاره`}
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className="rounded-md p-1 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <Star
                    className={cn(
                      "h-6 w-6 transition-colors",
                      n <= rating
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="library-notes" className="pb-2">
              یادداشت (اختیاری)
            </Label>
            <Textarea
              id="library-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="یادداشت شخصی‌ات درباره‌ی این کتاب..."
              className="min-h-24"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleAdd}
            disabled={submitting}
            className="w-full sm:w-auto"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال افزودن...
              </>
            ) : (
              "افزودن به کتابخانه"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

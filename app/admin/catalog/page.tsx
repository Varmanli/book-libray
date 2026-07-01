"use client";

import { useEffect, useState } from "react";
import { BookCheck, Check, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface Edition {
  id: string;
  translator: string | null;
  publisher: string | null;
  isbn: string | null;
  format: string;
  publishedYear: number | null;
  editionLabel: string | null;
  pageCount: number | null;
  coverImage: string | null;
}

interface PendingBook {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  description: string | null;
  createdByName: string | null;
  editions: Edition[];
}

export default function AdminCatalogPage() {
  const [items, setItems] = useState<PendingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/catalog/pending", {
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) setItems(data.items || []);
      else toast.error(data.error || "خطا در بارگذاری");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id: string, status: "APPROVED" | "REJECTED") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "عملیات ناموفق بود");
        return;
      }
      toast.success(data.message || "انجام شد");
      setItems((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
        کتاب‌های در انتظار تأیید
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-black/20 px-6 py-16 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BookCheck className="h-7 w-7" />
          </span>
          <p className="text-sm text-muted-foreground">
            کتابی در انتظار تأیید نیست.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl border border-border bg-card/50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-bold text-foreground">{b.title}</h2>
                  <p className="text-sm text-muted-foreground">{b.author}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {b.genre && <span>ژانر: {b.genre}</span>}
                    {b.createdByName && <span>ثبت‌کننده: {b.createdByName}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => act(b.id, "APPROVED")}
                    disabled={busy === b.id}
                    className="gap-1.5"
                  >
                    {busy === b.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    تأیید
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => act(b.id, "REJECTED")}
                    disabled={busy === b.id}
                    className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-4 w-4" />
                    رد
                  </Button>
                </div>
              </div>

              {b.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-foreground/80">
                  {b.description}
                </p>
              )}

              {b.editions.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {b.editions.map((e) => {
                    const meta = [
                      e.translator && `ترجمه‌ی ${e.translator}`,
                      e.publisher,
                      e.editionLabel,
                      e.publishedYear ? String(e.publishedYear) : null,
                      e.pageCount ? `${e.pageCount} ص` : null,
                      e.isbn && `شابک ${e.isbn}`,
                    ].filter(Boolean);
                    return (
                      <div
                        key={e.id}
                        className="rounded-lg border border-border bg-black/20 px-3 py-2 text-xs text-muted-foreground"
                      >
                        {meta.length > 0 ? meta.join(" · ") : "نسخه‌ی استاندارد"}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

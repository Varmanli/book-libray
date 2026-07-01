"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { useConfirm } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import type {
  AdminHeroSlide,
  FeaturedBookSearchResult,
  HeroSlideBook,
} from "@/lib/home/service";

const MAX_BOOKS = 3;

const EMPTY_FORM = {
  title: "",
  description: "",
  badge: "",
  primaryCtaLabel: "",
  primaryCtaHref: "",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
  imageUrl: "",
  isActive: true,
};

function Cover({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <BookOpen className="h-4 w-4" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className="h-12 w-9 shrink-0 rounded-md object-cover"
    />
  );
}

export default function HeroSlidesManager() {
  const confirm = useConfirm();
  const [slides, setSlides] = useState<AdminHeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [slideBooks, setSlideBooks] = useState<HeroSlideBook[]>([]);
  const [saving, setSaving] = useState(false);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<FeaturedBookSearchResult[]>([]);

  const setField = <K extends keyof typeof EMPTY_FORM>(
    key: K,
    value: (typeof EMPTY_FORM)[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/home/hero", {
        credentials: "include",
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok) setSlides(data.slides ?? []);
      else toast.error(data.error || "خطا در بارگذاری");
    } catch {
      toast.error("ارتباط با سرور برقرار نشد");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // جست‌وجوی کتاب برای انتخاب
  useEffect(() => {
    if (!open || !q.trim()) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/home/books?q=${encodeURIComponent(q.trim())}`,
          { credentials: "include", signal: ctrl.signal }
        );
        const data = await res.json();
        if (res.ok) setResults(data.results ?? []);
      } catch (err) {
        if (!(err instanceof DOMException)) toast.error("خطا در جست‌وجو");
      }
    }, 300);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, open]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSlideBooks([]);
    setQ("");
    setResults([]);
    setOpen(true);
  };

  const openEdit = (slide: AdminHeroSlide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title,
      description: slide.description ?? "",
      badge: slide.badge ?? "",
      primaryCtaLabel: slide.primaryCtaLabel ?? "",
      primaryCtaHref: slide.primaryCtaHref ?? "",
      secondaryCtaLabel: slide.secondaryCtaLabel ?? "",
      secondaryCtaHref: slide.secondaryCtaHref ?? "",
      imageUrl: slide.imageUrl ?? "",
      isActive: slide.isActive,
    });
    setSlideBooks(slide.books);
    setQ("");
    setResults([]);
    setOpen(true);
  };

  const addBook = (book: FeaturedBookSearchResult) => {
    if (slideBooks.some((b) => b.id === book.id)) return;
    if (slideBooks.length >= MAX_BOOKS) {
      toast.error(`حداکثر ${MAX_BOOKS} کتاب مجاز است`);
      return;
    }
    setSlideBooks((prev) => [...prev, book]);
    setQ("");
    setResults([]);
  };

  const removeBook = (id: string) =>
    setSlideBooks((prev) => prev.filter((b) => b.id !== id));

  const moveBook = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= slideBooks.length) return;
    const next = [...slideBooks];
    [next[index], next[target]] = [next[target], next[index]];
    setSlideBooks(next);
  };

  const saveSlide = async () => {
    if (!form.title.trim()) {
      toast.error("عنوان الزامی است");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        badge: form.badge.trim() || null,
        primaryCtaLabel: form.primaryCtaLabel.trim() || null,
        primaryCtaHref: form.primaryCtaHref.trim() || null,
        secondaryCtaLabel: form.secondaryCtaLabel.trim() || null,
        secondaryCtaHref: form.secondaryCtaHref.trim() || null,
        imageUrl: form.imageUrl || null,
        isActive: form.isActive,
      };

      let slideId = editingId;
      if (slideId) {
        const res = await fetch(`/api/admin/home/hero/${slideId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "ذخیره ناموفق بود");
          return;
        }
      } else {
        const res = await fetch("/api/admin/home/hero", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "ساخت اسلاید ناموفق بود");
          return;
        }
        slideId = data.id as string;
      }

      const booksRes = await fetch(`/api/admin/home/hero/${slideId}/books`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ bookIds: slideBooks.map((b) => b.id) }),
      });
      if (!booksRes.ok) {
        const data = await booksRes.json().catch(() => ({}));
        toast.error(data.error || "ذخیره‌ی کتاب‌ها ناموفق بود");
        return;
      }

      toast.success("ذخیره شد");
      setOpen(false);
      void load();
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (slide: AdminHeroSlide) => {
    setBusyId(slide.id);
    try {
      const res = await fetch(`/api/admin/home/hero/${slide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !slide.isActive }),
      });
      if (!res.ok) {
        toast.error("به‌روزرسانی ناموفق بود");
        return;
      }
      setSlides((prev) =>
        prev.map((s) =>
          s.id === slide.id ? { ...s, isActive: !s.isActive } : s
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const deleteSlide = (slide: AdminHeroSlide) => {
    void confirm({
      title: "حذف اسلاید",
      description: `اسلاید «${slide.title}» حذف شود؟ این عملیات قابل بازگشت نیست.`,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/home/hero/${slide.id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!res.ok) {
          toast.error("حذف ناموفق بود");
          return;
        }
        toast.success("حذف شد");
        setSlides((prev) => prev.filter((s) => s.id !== slide.id));
      },
    });
  };

  const moveSlide = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    setSlides(next);
    try {
      await fetch("/api/admin/home/hero/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
      });
    } catch {
      toast.error("ذخیره‌ی ترتیب ناموفق بود");
      void load();
    }
  };

  const selectedIds = new Set(slideBooks.map((b) => b.id));

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-foreground">
          اسلایدر صفحه اصلی ({slides.length.toLocaleString("fa-IR")})
        </h2>
        <Button size="sm" onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          اسلاید جدید
        </Button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          در حال بارگذاری...
        </p>
      ) : slides.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          هنوز اسلایدی ساخته نشده است. در نبود اسلاید فعال، صفحه‌ی اصلی از
          اسلایدهای پیش‌فرض استفاده می‌کند.
        </p>
      ) : (
        <ul className="space-y-2">
          {slides.map((slide, index) => (
            <li
              key={slide.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-2.5",
                !slide.isActive && "opacity-60"
              )}
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="بالا"
                  disabled={index === 0}
                  onClick={() => moveSlide(index, -1)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="پایین"
                  disabled={index === slides.length - 1}
                  onClick={() => moveSlide(index, 1)}
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {slide.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {slide.books.length > 0
                    ? `${slide.books.length.toLocaleString("fa-IR")} کتاب`
                    : "بدون کتاب"}
                  {slide.badge ? ` · ${slide.badge}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toggleActive(slide)}
                disabled={busyId === slide.id}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                  slide.isActive
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {slide.isActive ? "فعال" : "غیرفعال"}
              </button>

              <button
                type="button"
                onClick={() => openEdit(slide)}
                aria-label="ویرایش"
                title="ویرایش"
                className="rounded-lg p-1.5 text-foreground transition-colors hover:bg-foreground/10"
              >
                <Pencil className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => deleteSlide(slide)}
                aria-label="حذف"
                title="حذف"
                className="rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ویرایشگر اسلاید */}
      <Sheet open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader className="pt-12">
            <SheetTitle>{editingId ? "ویرایش اسلاید" : "اسلاید جدید"}</SheetTitle>
            <SheetDescription className="sr-only">
              مدیریت متن، دکمه‌ها، تصویر و کتاب‌های اسلاید.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-4">
            <div className="space-y-1.5">
              <Label htmlFor="h-title">عنوان *</Label>
              <Input
                id="h-title"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="h-badge">برچسب (badge)</Label>
              <Input
                id="h-badge"
                value={form.badge}
                onChange={(e) => setField("badge", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="h-desc">توضیحات</Label>
              <Textarea
                id="h-desc"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="min-h-24"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="h-p-label">دکمه اصلی — متن</Label>
                <Input
                  id="h-p-label"
                  value={form.primaryCtaLabel}
                  onChange={(e) => setField("primaryCtaLabel", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-p-href">دکمه اصلی — آدرس</Label>
                <Input
                  id="h-p-href"
                  dir="ltr"
                  placeholder="/books/add"
                  value={form.primaryCtaHref}
                  onChange={(e) => setField("primaryCtaHref", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-s-label">دکمه دوم — متن</Label>
                <Input
                  id="h-s-label"
                  value={form.secondaryCtaLabel}
                  onChange={(e) => setField("secondaryCtaLabel", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="h-s-href">دکمه دوم — آدرس</Label>
                <Input
                  id="h-s-href"
                  dir="ltr"
                  placeholder="/auth/login"
                  value={form.secondaryCtaHref}
                  onChange={(e) => setField("secondaryCtaHref", e.target.value)}
                />
              </div>
            </div>

            <ImageUploader
              value={form.imageUrl}
              onChange={(url) => setField("imageUrl", url)}
              folder="home"
              variant="banner"
              label="تصویر پس‌زمینه (اختیاری)"
            />

            {/* انتخاب کتاب‌ها */}
            <div className="space-y-2">
              <Label>
                کتاب‌های اسلاید ({slideBooks.length.toLocaleString("fa-IR")}/۳)
              </Label>

              {slideBooks.length > 0 ? (
                <ul className="space-y-1.5">
                  {slideBooks.map((b, index) => (
                    <li
                      key={b.id}
                      className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 p-1.5"
                    >
                      <div className="flex flex-col">
                        <button
                          type="button"
                          aria-label="بالا"
                          disabled={index === 0}
                          onClick={() => moveBook(index, -1)}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="پایین"
                          disabled={index === slideBooks.length - 1}
                          onClick={() => moveBook(index, 1)}
                          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <Cover src={b.coverImage} alt={b.title} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-foreground">
                          {b.title}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {b.author}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBook(b.id)}
                        aria-label="حذف"
                        className="rounded-lg p-1.5 text-destructive transition-colors hover:bg-destructive/10"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {slideBooks.length < MAX_BOOKS ? (
                <>
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="جست‌وجوی کتاب برای افزودن..."
                  />
                  {q.trim() && results.length > 0 ? (
                    <ul className="space-y-1.5">
                      {results.map((b) => (
                        <li
                          key={b.id}
                          className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-1.5"
                        >
                          <Cover src={b.coverImage} alt={b.title} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-foreground">
                              {b.title}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {b.author}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={selectedIds.has(b.id)}
                            onClick={() => addBook(b)}
                          >
                            {selectedIds.has(b.id) ? "افزوده‌شده" : "افزودن"}
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  به حداکثر تعداد کتاب رسیده‌اید.
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setField("isActive", e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              اسلاید فعال باشد
            </label>
          </div>

          <SheetFooter>
            <Button
              onClick={saveSlide}
              disabled={saving || !form.title.trim()}
              className="w-full gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              ذخیره اسلاید
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

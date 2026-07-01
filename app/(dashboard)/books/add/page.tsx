"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BookPlus, Search } from "lucide-react";
import toast from "react-hot-toast";

import BookForm, { BookFormType } from "@/components/BookForm";
import { CatalogSearch } from "@/components/catalog/CatalogSearch";

type Mode = "catalog" | "manual";

function AddBookFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // پیش‌پرکردن دستی از روی پارامترهای URL (مثلاً از لیست خرید)
  const initialValues = useMemo<Partial<BookFormType>>(() => {
    const title = searchParams.get("title");
    const author = searchParams.get("author");
    const publisher = searchParams.get("publisher");
    const genre = searchParams.get("genre");
    const translator = searchParams.get("translator");
    if (!(title || author || publisher || genre || translator)) return {};
    return {
      title: title || "",
      author: author || "",
      publisher: publisher || "",
      genre: genre || "",
      translator: translator || "",
      pageCount: 0,
    };
  }, [searchParams]);

  const hasPrefill = Object.keys(initialValues).length > 0;
  const [mode, setMode] = useState<Mode>("catalog");

  // اگر از مسیری با پیش‌پر آمده‌ایم، مستقیم به ساخت دستی برو
  useEffect(() => {
    if (hasPrefill) setMode("manual");
  }, [hasPrefill]);

  const handleManualSubmit = async (data: BookFormType) => {
    try {
      const coverUrl =
        typeof data.cover === "string" && data.cover.trim()
          ? data.cover
          : undefined;

      // جلد اختیاری است؛ اگر نبود، coverImage ارسال نمی‌شود
      const res = await fetch("/api/catalog/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: data.title,
          author: data.author,
          genre: data.genre,
          country: data.country || undefined,
          description: data.description || undefined,
          translator: data.translator || undefined,
          publisher: data.publisher || undefined,
          pageCount: Number(data.pageCount),
          coverImage: coverUrl || undefined,
          status: data.status || "UNREAD",
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "خطا در ثبت کتاب");
        return;
      }

      toast.success(result.message || "کتاب با موفقیت ثبت شد");
      router.push(
        result.book?.slug
          ? `/book/${encodeURIComponent(result.book.slug)}`
          : result.book?.id
            ? `/book/${encodeURIComponent(result.book.id)}`
            : "/books",
      );
      router.refresh();
    } catch {
      toast.error("خطای سرور در ثبت کتاب");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <Link
          href="/books"
          className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          بازگشت به کتابخانه
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
            <BookPlus className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              افزودن کتاب به قفسه
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {mode === "catalog"
                ? "اول کاتالوگ را جست‌وجو کن؛ اگر نبود، دستی بسازش."
                : "اطلاعات کتاب را وارد کن تا به کاتالوگ و کتابخانه‌ات اضافه شود."}
            </p>
          </div>
        </div>
      </div>

      {mode === "catalog" ? (
        <CatalogSearch onManualFallback={() => setMode("manual")} />
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setMode("catalog")}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
          >
            <Search className="h-4 w-4" />
            بازگشت به جست‌وجوی کاتالوگ
          </button>
          <BookForm
            initialValues={initialValues}
            onSubmit={handleManualSubmit}
            submitLabel="ساخت کتاب و افزودن به کتابخانه"
          />
        </div>
      )}
    </div>
  );
}

export default function AddBookPage() {
  return (
    <Suspense fallback={null}>
      <AddBookFlow />
    </Suspense>
  );
}

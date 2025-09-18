"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BookForm, { BookFormType } from "@/components/BookForm";
import toast from "react-hot-toast";

export default function EditBookPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [book, setBook] = useState<Partial<BookFormType> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${id}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        console.log("[EditBookPage] /api/books/:", { id, ok: res.ok, data });

        if (!res.ok) {
          toast.error(data?.error || "خطا در دریافت اطلاعات کتاب");
          if (mounted) setLoading(false);
          return;
        }

        // احتمال اینکه سرور داده را داخل data.book برگرداند
        const raw = data?.book ?? data ?? {};

        const mapped = {
          title: raw.title ?? "",
          author: raw.author ?? "",
          translator: raw.translator ?? "",
          publisher: raw.publisher ?? "",
          description: raw.description ?? "",
          country: raw.country ?? "",
          genre: raw.genre ?? "",
          pageCount:
            raw.pageCount === undefined || raw.pageCount === null
              ? 0
              : Number(raw.pageCount),
          format: raw.format ?? "PHYSICAL",
          cover: raw.coverImage ?? raw.cover ?? undefined,
        };

        if (!mounted) return;
        setBook(mapped);
      } catch (err) {
        console.error(err);
        toast.error("خطا در دریافت اطلاعات کتاب");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBook();

    return () => {
      mounted = false;
    };
  }, [id]);

  const handleSubmit = async (data: BookFormType) => {
    try {
      let coverUrl: string | undefined =
        typeof data.cover === "string" ? data.cover : undefined;

      if (data.cover instanceof File) {
        const formData = new FormData();
        formData.append("file", data.cover);

        const uploadRes = await fetch("/api/upload/image", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          toast.error(uploadData.error || "خطا در آپلود عکس");
          return;
        }
        coverUrl = uploadData.url;
      }

      const payload = {
        title: data.title,
        author: data.author,
        translator: data.translator,
        publisher: data.publisher,
        description: data.description,
        country: data.country,
        genre: data.genre,
        pageCount: Number(data.pageCount),
        format: data.format,
        coverImage: coverUrl,
      };

      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "خطا در ویرایش کتاب");
        return;
      }
      toast.success(result.message || "کتاب با موفقیت ویرایش شد");
    } catch (err) {
      console.error(err);
      toast.error("خطای سرور در ویرایش کتاب");
    }
  };

  if (loading)
    return <p className="text-center py-10">⏳ در حال بارگذاری...</p>;
  if (!book)
    return <p className="text-center py-10 text-red-500">کتاب پیدا نشد</p>;

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-primary">
        ✏️ ویرایش کتاب
      </h1>

      <BookForm
        key={JSON.stringify(book)}
        initialValues={book}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

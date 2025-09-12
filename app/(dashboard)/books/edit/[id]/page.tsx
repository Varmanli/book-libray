"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BookForm, { BookFormType } from "@/components/BookForm";
import toast from "react-hot-toast";

export default function EditBookPage() {
  const params = useParams();
  const id = params?.id as string;

  const [book, setBook] = useState<BookFormType | null>(null);
  const [loading, setLoading] = useState(true);

  // 📌 گرفتن اطلاعات کتاب برای پر کردن فرم
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${id}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "خطا در دریافت اطلاعات کتاب");
          return;
        }

        setBook({
          title: data.title,
          author: data.author,
          translator: data.translator,
          publisher: data.publisher,
          description: data.description,
          country: data.country,
          genre: data.genre,
          pageCount: data.pageCount,
          format: data.format,
          cover: data.coverImage || undefined, // 🟢 چون BookForm انتظار cover داره
        });
      } catch {
        toast.error("خطا در دریافت اطلاعات کتاب");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBook();
  }, [id]);

  // 📌 هندل ارسال فرم (آپدیت کتاب)
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
        ...data,
        pageCount: Number(data.pageCount),
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
      <BookForm initialValues={book} onSubmit={handleSubmit} />
    </div>
  );
}

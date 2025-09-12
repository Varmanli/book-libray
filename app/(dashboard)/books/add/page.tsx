"use client";

import BookForm, { BookFormType } from "@/components/BookForm";
import toast from "react-hot-toast";

export default function AddBookPage() {
  const handleSubmit = async (data: BookFormType) => {
    try {
      let coverUrl: string | undefined = undefined;

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

      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || "خطا در ثبت کتاب");
        return;
      }

      toast.success(result.message || "کتاب با موفقیت ثبت شد");
    } catch (err) {
      toast.error("خطای سرور در ثبت کتاب");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-primary">
        📚 ثبت کتاب جدید
      </h1>
      <BookForm onSubmit={handleSubmit} />
    </div>
  );
}

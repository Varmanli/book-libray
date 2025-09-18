"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import BookPageUI from "@/components/BookPageUI";
import LoadingBooks from "@/components/LoadingBooks";
import { BookType, QuoteType } from "@/types";

export default function BookPageContainer() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<BookType | null>(null);
  const [status, setStatus] = useState<BookType["status"]>("UNREAD");
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState("");
  const [quotes, setQuotes] = useState<QuoteType[]>([]);
  const [publisher, setPublisher] = useState<string>(""); // 👈 publisher state
  const [showModal, setShowModal] = useState(false);

  // 📌 گرفتن اطلاعات کتاب + ناشر
  useEffect(() => {
    if (!id) return;

    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${id}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "خطا در دریافت اطلاعات کتاب");
          return;
        }

        const b = data.book as BookType & { publisher?: string };
        setBook(b);
        setStatus(b.status);
        setRating(b.rating ?? null);
        setReview(b.review || "");
        setQuotes(b.quotes || []);
        setPublisher(b.publisher || ""); // 👈 گرفتن publisher
      } catch {
        toast.error("خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  // 📌 حذف کتاب
  const handleDelete = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-4 p-4 bg-white rounded shadow-lg w-80 mx-auto text-center">
          <p>آیا از حذف کتاب اطمینان دارید؟</p>
          <div className="flex justify-center gap-4 mt-2">
            <button
              className="px-4 py-2 bg-red-500 text-white rounded"
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await fetch(`/api/books/${id}`, {
                    method: "DELETE",
                  });
                  const data = await res.json();

                  if (!res.ok) {
                    toast.error(data.error || "خطا در حذف کتاب");
                    return;
                  }

                  toast.success("کتاب حذف شد");
                  router.push("/books");
                } catch {
                  toast.error("خطا در ارتباط با سرور");
                }
              }}
            >
              بله
            </button>
            <button
              className="px-4 py-2 bg-gray-300 text-black rounded"
              onClick={() => toast.dismiss(t.id)}
            >
              خیر
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  // 📌 بروزرسانی کتاب
  const updateBook = async (updated: Partial<BookType>) => {
    if (!book) return;

    try {
      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در بروزرسانی کتاب");
        return;
      }

      setBook(data.book);
      setStatus(data.book.status);
      setRating(data.book.rating ?? null);
      setReview(data.book.review || "");
      setQuotes(data.book.quotes || []);
      setPublisher(data.book.publisher || ""); // 👈 بروزرسانی publisher
      toast.success("تغییرات ذخیره شد");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  // 📌 اضافه کردن نقل‌قول
  const addQuote = async (content: string, page?: number) => {
    if (!book) return;
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, page, bookId: book.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "خطا در اضافه کردن نقل قول");
        return;
      }

      setQuotes((prev) => [...prev, data.quote]);
      toast.success("نقل قول اضافه شد");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  // 📌 حذف نقل‌قول
  const removeQuote = async (quoteId: string) => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "خطا در حذف نقل قول");
        return;
      }

      setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
      toast.success("نقل قول حذف شد");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  if (loading) return <LoadingBooks />;
  if (!book)
    return <p className="text-center py-10 text-red-500">کتاب پیدا نشد</p>;

  return (
    <BookPageUI
      book={book}
      publisher={publisher}
      status={status}
      rating={rating}
      review={review}
      quotes={quotes}
      setQuotes={setQuotes}
      showModal={showModal}
      setShowModal={setShowModal}
      setRating={setRating}
      setReview={setReview}
      onStatusChange={(newStatus) => {
        setStatus(newStatus);
        if (newStatus === "FINISHED") setShowModal(true);
        else updateBook({ status: newStatus, rating, review });
      }}
      onDelete={handleDelete}
      onSaveModal={() => {
        updateBook({ status, rating, review });
        setShowModal(false);
      }}
      onAddQuote={addQuote}
      onRemoveQuote={removeQuote}
      onUpdateQuote={() => {
        toast.error("ویرایش نقل قول هنوز پیاده‌سازی نشده");
        return Promise.resolve();
      }}
    />
  );
}

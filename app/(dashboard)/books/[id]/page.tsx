"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import BookPageUI from "@/components/BookPageUI";
import { BookType, QuoteType } from "@/types";
import LoadingBooks from "@/components/LoadingBooks";

export default function BookPageContainer() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [book, setBook] = useState<BookType | null>(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState<BookType["status"]>("UNREAD");
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [quotes, setQuotes] = useState<QuoteType[]>([]);

  // Fetch book data
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await fetch(`/api/books/${id}`);
        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "خطا در دریافت اطلاعات کتاب");
          return;
        }

        setBook(data.book);
        setStatus(data.book.status);
        setRating(data.book.rating ?? null);
        setReview(data.book.review || "");
        setQuotes(data.book.quotes || []);
      } catch {
        toast.error("خطا در ارتباط با سرور");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchBook();
  }, [id]);

  // Delete book
  const handleDelete = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-4 p-4 bg-white rounded shadow-lg w-80 mx-auto text-center">
          <p>آیا از حذف کتاب اطمینان دارید؟</p>
          <div className="flex justify-center gap-4 mt-2">
            <button
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

                  toast.success(data.message || "کتاب با موفقیت حذف شد");
                  router.push("/books");
                } catch {
                  toast.error("خطا در ارتباط با سرور");
                }
              }}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              بله
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-4 py-2 bg-gray-300 text-black rounded"
            >
              خیر
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  // Update book info
  const updateBook = async (updated: {
    status?: BookType["status"];
    rating?: number | null;
    review?: string;
  }) => {
    if (!book) return;
    try {
      const bodyData = { ...book, ...updated };

      // اگر rating null بود، اون رو حذف کن تا صفر ثبت نشه
      if (bodyData.rating === null) delete bodyData.rating;

      const res = await fetch(`/api/books/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
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
      toast.success("تغییرات ذخیره شد");
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  // Add a new quote
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

  // Remove a quote
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
      onUpdateQuote={function (quote: QuoteType): Promise<void> {
        throw new Error("Function not implemented.");
      }}
    />
  );
}

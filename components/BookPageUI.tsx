"use client";

import { FaStar } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BookType, QuoteType } from "@/types";
import React, { useState } from "react";
import QuoteModal from "./QuoteModal";
import Image from "next/image";

interface BookPageUIProps {
  book: BookType;
  status: BookType["status"];
  rating: number | null;
  publisher: string | null;
  review: string;
  quotes?: QuoteType[];
  showModal: boolean;
  setShowModal: (open: boolean) => void;
  setRating: (val: number) => void;
  setReview: (val: string) => void;
  setQuotes: (val: QuoteType[]) => void;
  onStatusChange: (val: BookType["status"]) => void;
  onDelete: () => void;
  onSaveModal: () => void;
  onAddQuote: (content: string, page?: number) => Promise<void>;
  onUpdateQuote: (quote: QuoteType) => Promise<void>;
  onRemoveQuote: (quoteId: string) => Promise<void>;
}

export default function BookPageUI({
  book,
  status,
  rating,
  review,
  quotes = [],
  showModal,
  setShowModal,
  setRating,
  setReview,
  setQuotes,
  onStatusChange,
  onDelete,
  onSaveModal,
  onAddQuote,
  onUpdateQuote,
  onRemoveQuote,
}: BookPageUIProps) {
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteInput, setQuoteInput] = useState("");
  const [quotePageInput, setQuotePageInput] = useState<number | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<QuoteType | null>(null);
  const [showQuoteEditModal, setShowQuoteEditModal] = useState(false);

  const getStatusLabel = (status: BookType["status"]) => {
    switch (status) {
      case "UNREAD":
        return "خوانده نشده";
      case "READING":
        return "در حال خواندن";
      case "FINISHED":
        return "خوانده شده";
    }
  };

  // افزودن نقل قول
  const handleAddQuote = async () => {
    const val = quoteInput.trim();
    if (!val) return;

    setQuoteInput("");
    setQuotePageInput(null);
    setShowQuoteModal(false);

    await onAddQuote(val, quotePageInput || undefined);
  };

  // کلیک روی نقل قول برای ویرایش
  const handleQuoteClick = (quote: QuoteType) => {
    setSelectedQuote(quote);
    setShowQuoteEditModal(true);
  };

  // ویرایش نقل قول
  const handleUpdateQuote = async (updatedQuote: QuoteType) => {
    await onUpdateQuote(updatedQuote);
    setShowQuoteEditModal(false);
    setSelectedQuote(null);
  };

  // حذف نقل قول
  const handleDeleteQuote = async (quoteId: string) => {
    await onRemoveQuote(quoteId);
    setShowQuoteEditModal(false);
    setSelectedQuote(null);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex flex-col gap-8">
        {/* بخش بالای صفحه */}
        <div className="flex flex-col  md:flex-row-reverse justify-around items-stretch gap-10">
          {book.coverImage && (
            <div className="relative w-full md:w-1/3 h-130 md:h-auto rounded-lg overflow-hidden shadow-lg">
              <Image
                src={book.coverImage}
                alt={book.title}
                fill
                className="object-cover w-full"
              />
            </div>
          )}
          <div className="flex flex-col gap-5 w-full">
            <h1 className="flex justify-between items-center text-4xl font-extrabold text-primary mt-4">
              {book.title}
              <Button
                variant="destructive"
                onClick={onDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف کتاب
              </Button>
            </h1>

            {/* کارت جزئیات کتاب */}
            {/* کارت جزئیات کتاب */}
            <div className="grid grid-cols-[1fr_3fr] gap-2">
              {[
                { label: "نویسنده", value: book.author },
                { label: "مترجم", value: book.translator },
                { label: "ژانر", value: book.genre },
                { label: "ناشر", value: book.publisher }, // 👈 اینو اضافه کردم
                { label: "تعداد صفحات", value: book.pageCount },
                { label: "کشور", value: book.country },
                { label: "امتیاز شما", value: rating },
              ].map(
                (item, idx) =>
                  item.value && (
                    <React.Fragment key={idx}>
                      <div className="bg-gray-700/50 p-2 flex justify-center items-center text-gray-300 text-sm md:text-base rounded-sm">
                        {item.label}
                      </div>
                      <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base rounded-sm">
                        {item.value}
                      </div>
                    </React.Fragment>
                  )
              )}

              <div className="bg-gray-700/50 flex justify-center items-center rounded-sm p-2 text-gray-300 text-sm md:text-base">
                وضعیت خواندن
              </div>
              <div className="bg-gray-600/50 rounded-sm p-2 text-gray-100 text-sm md:text-base">
                <Select
                  value={status}
                  onValueChange={(val) =>
                    onStatusChange(val as BookType["status"])
                  }
                >
                  <SelectTrigger className="w-40" dir="rtl">
                    {getStatusLabel(status)}
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="UNREAD">خوانده نشده</SelectItem>
                    <SelectItem value="READING">در حال خواندن</SelectItem>
                    <SelectItem value="FINISHED">خوانده شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* مودال ثبت امتیاز و نظر */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogContent dir="rtl" className="sm:max-w-lg w-[95%]">
                <DialogHeader>
                  <DialogTitle>ثبت امتیاز و نظر</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex w-[350px] items-center gap-2 justify-center">
                    {[...Array(10)].map((_, i) => (
                      <FaStar
                        key={i}
                        className={`cursor-pointer text-4xl ${
                          i < (rating ?? 0)
                            ? "text-yellow-400"
                            : "text-gray-400/20"
                        }
`}
                        onClick={() => setRating(i + 1)}
                      />
                    ))}
                  </div>
                  <textarea
                    placeholder="نظر خود را بنویسید"
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={5}
                  />
                </div>

                <DialogFooter>
                  <Button onClick={onSaveModal}>ثبت</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* خلاصه و نظر شخصی */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-around items-stretch gap-8">
            {book.description && (
              <Card className="mt-6 md:w-2/3 shadow-md flex flex-col">
                <CardContent className="p-6 flex flex-col h-full">
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    خلاصه کتاب
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-justify flex-1">
                    {book.description}
                  </p>
                </CardContent>
              </Card>
            )}
            {review && (
              <Card className="mt-6 md:w-1/3 shadow-md flex flex-col">
                <CardContent className="p-6 flex flex-col h-full">
                  <h3 className="text-lg font-semibold text-primary mb-2">
                    نظر شما
                  </h3>
                  <p className="text-gray-200 flex-1">{review}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* نقل قول‌ها */}
          {(status === "READING" || status === "FINISHED") && (
            <div className="mt-8">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg mb-4 text-primary">
                  تکه‌های کتاب
                </h3>
                <Button
                  onClick={() => setShowQuoteModal(true)}
                  className="mb-4"
                >
                  افزودن تکه کتاب
                </Button>
              </div>

              {quotes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {quotes.map((quote) => (
                    <Card
                      key={quote.id}
                      className="shadow-md hover:shadow-lg transition-shadow relative cursor-pointer"
                      onClick={() => handleQuoteClick(quote)}
                    >
                      <CardContent className="p-6">
                        <span className="absolute top-2 right-4 text-primary text-3xl opacity-70">
                          ❝
                        </span>
                        <p className="text-gray-200 text-sm leading-relaxed italic relative z-10">
                          {quote.content}
                        </p>
                        {quote.page && (
                          <p className="text-xs text-gray-400 mt-2 text-left">
                            صفحه {quote.page}
                          </p>
                        )}
                        <span className="absolute bottom-2 left-4 text-primary text-2xl opacity-70">
                          ❞
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* مودال افزودن نقل قول */}
              <Dialog open={showQuoteModal} onOpenChange={setShowQuoteModal}>
                <DialogContent dir="rtl" className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>افزودن تکه کتاب</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <textarea
                      placeholder="تکه‌ای از کتاب را بنویسید..."
                      value={quoteInput}
                      onChange={(e) => setQuoteInput(e.target.value)}
                      className="w-full p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={4}
                    />
                    <input
                      type="number"
                      placeholder="شماره صفحه (اختیاری)"
                      value={quotePageInput || ""}
                      onChange={(e) =>
                        setQuotePageInput(
                          e.target.value ? parseInt(e.target.value) : null
                        )
                      }
                      className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddQuote}>ثبت</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* مودال ویرایش/حذف نقل قول */}
              <QuoteModal
                quote={selectedQuote}
                isOpen={showQuoteEditModal}
                onClose={() => {
                  setShowQuoteEditModal(false);
                  setSelectedQuote(null);
                }}
                onSave={handleUpdateQuote}
                onDelete={() =>
                  selectedQuote && handleDeleteQuote(selectedQuote.id)
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

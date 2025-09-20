"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, memo, useCallback } from "react";
import { BookType } from "@/types";

import { FiEye, FiEdit } from "react-icons/fi";
import { FaBookReader, FaStar } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface BookCardProps {
  book: BookType;
  onStatusChange: (
    id: string,
    newStatus: "UNREAD" | "READING" | "FINISHED"
  ) => void;
}
const getStatusLabel = (status: "UNREAD" | "READING" | "FINISHED") => {
  switch (status) {
    case "UNREAD":
      return "خوانده نشده";
    case "READING":
      return "در حال خواندن";
    case "FINISHED":
      return "خوانده شده";
  }
};

const BookCard = memo(function BookCard({
  book,
  onStatusChange,
}: BookCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(book.status);

  // تغییر وضعیت خواندن کتاب (UNREAD -> READING -> FINISHED) - memoized
  const handleStatusToggle = useCallback(() => {
    let newStatus: "UNREAD" | "READING" | "FINISHED";

    if (status === "UNREAD") newStatus = "READING";
    else if (status === "READING") newStatus = "FINISHED";
    else newStatus = "UNREAD";

    setStatus(newStatus);
    onStatusChange(book.id, newStatus);
  }, [status, book.id, onStatusChange]);

  const handleViewDetails = useCallback(() => {
    router.push(`/books/${book.id}`);
  }, [router, book.id]);

  const handleEdit = useCallback(() => {
    router.push(`/books/edit/${book.id}`);
  }, [router, book.id]);

  return (
    <Card className="flex flex-col md:flex-row items-start border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer py-0">
      {/* جلد کتاب */}
      <div className="relative w-full h-130 md:w-55 md:h-80 flex-shrink-0">
        <Image
          src={book.coverImage || "/placeholder-cover.jpg"}
          alt={book.title}
          fill
          className="object-cover rounded-t-xl md:rounded-t-none md:rounded-r-xl w-full h-full"
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        />
      </div>

      {/* اطلاعات کتاب */}
      <CardContent className="flex flex-col w-full md:w-auto py-6 px-4 text-right flex-1 rounded-xl">
        {/* عنوان کتاب */}
        <h3 className="text-xl md:text-3xl font-Semibold text-gray-50 line-clamp-2 mb-4">
          {book.title}
        </h3>

        {/* اطلاعات به صورت جدول دو رنگ */}
        <div className="grid grid-cols-[1fr_3fr]  gap-2 ">
          <div className="bg-gray-700/50 p-2 text-gray-300 text-sm md:text-base">
            نویسنده
          </div>
          <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base">
            {book.author}
          </div>
          {book.translator && (
            <>
              <div className="bg-gray-700/50 p-2 text-gray-300 text-sm md:text-base">
                مترجم
              </div>
              <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base">
                {book.translator}
              </div>
            </>
          )}
          {book.country && (
            <>
              <div className="bg-gray-700/50 p-2 text-gray-300 text-sm md:text-base">
                کشور
              </div>
              <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base">
                {book.country}
              </div>
            </>
          )}
          {book.genre && (
            <>
              <div className="bg-gray-700/50 p-2 text-gray-300 text-sm md:text-base">
                ژانر
              </div>
              <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base">
                {book.genre}
              </div>
            </>
          )}
        </div>
      </CardContent>

      {/* خطچین و آیکون‌ها */}
      <TooltipProvider>
        <div className="flex md:flex-col items-center justify-between px-4 border-t md:border-t-0 w-full md:w-auto md:border-r border-dashed border-gray-500 gap-7 py-4.5 h-full">
          {/* مشاهده جزئیات */}
          <Tooltip>
            <TooltipTrigger asChild>
              <FiEye
                className="text-2xl md:text-[30px] text-primary hover:text-primary/70 transition cursor-pointer"
                onClick={handleViewDetails}
              />
            </TooltipTrigger>
            <TooltipContent>مشاهده جزئیات</TooltipContent>
          </Tooltip>

          {/* ویرایش */}
          <Tooltip>
            <TooltipTrigger asChild>
              <FiEdit
                className="text-2xl md:text-[30px] text-primary hover:text-primary/70 transition cursor-pointer"
                onClick={handleEdit}
              />
            </TooltipTrigger>
            <TooltipContent>ویرایش کتاب</TooltipContent>
          </Tooltip>

          {/* وضعیت خواندن */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-default">
                <FaBookReader
                  className={`text-2xl md:text-[30px] ${
                    status === "UNREAD"
                      ? "text-red-500"
                      : status === "READING"
                      ? "text-blue-500"
                      : "text-primary"
                  }`}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>{getStatusLabel(status)}</TooltipContent>
          </Tooltip>

          {/* نمایش نمره / Rating */}
          {status === "FINISHED" && book.rating !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center items-center gap-0.5 cursor-pointer">
                  <FaStar className="text-yellow-400 text-sm" />
                  <span className="pt-1 font-semibold">{book.rating}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>امتیاز کتاب</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </Card>
  );
});

export default BookCard;

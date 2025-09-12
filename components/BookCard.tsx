"use client";

import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function BookCard({ book, onStatusChange }: BookCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(book.status);

  // تغییر وضعیت خواندن کتاب (UNREAD -> READING -> FINISHED)
  const handleStatusToggle = () => {
    let newStatus: "UNREAD" | "READING" | "FINISHED";

    if (status === "UNREAD") newStatus = "READING";
    else if (status === "READING") newStatus = "FINISHED";
    else newStatus = "UNREAD";

    setStatus(newStatus);

    onStatusChange(book.id, newStatus);
  };

  return (
    <Card className="flex flex-col md:flex-row-reverse items-start border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer py-0">
      {/* جلد کتاب */}
      <div className="relative w-60 h-100 md:w-40 md:h-60 flex-shrink-0">
        <Image
          src={book.coverImage || "/placeholder-cover.jpg"}
          alt={book.title}
          fill
          className="object-cover rounded-t-xl md:rounded-t-none md:rounded-r-xl w-full h-full"
        />
      </div>

      {/* اطلاعات کتاب */}
      <CardContent className="flex flex-col py-6 px-4 text-right flex-1 rounded-xl">
        {/* عنوان کتاب */}
        <h3 className="text-lg md:text-3xl font-Semibold text-gray-50 line-clamp-2 mb-4">
          {book.title}
        </h3>

        {/* اطلاعات به صورت جدول دو رنگ */}
        <div className="grid grid-cols-[3fr_1fr] gap-2">
          <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base">
            {book.author}
          </div>
          <div className="bg-gray-700/50 p-2 text-gray-300 text-sm md:text-base">
            نویسنده
          </div>

          {book.translator && (
            <>
              <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base">
                {book.translator}
              </div>
              <div className="bg-gray-700/50 p-2 text-gray-300 text-sm md:text-base">
                مترجم
              </div>
            </>
          )}

          {book.country && (
            <>
              <div className="bg-gray-600/50 p-2 text-gray-100 text-sm md:text-base">
                {book.country}
              </div>
              <div className="bg-gray-700/50 p-2 text-gray-300 text-sm md:text-base">
                کشور
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
                onClick={() => router.push(`/books/${book.id}`)}
              />
            </TooltipTrigger>
            <TooltipContent>مشاهده جزئیات</TooltipContent>
          </Tooltip>

          {/* ویرایش */}
          <Tooltip>
            <TooltipTrigger asChild>
              <FiEdit
                className="text-2xl md:text-[30px] text-primary hover:text-primary/70 transition cursor-pointer"
                onClick={() => router.push(`/books/edit/${book.id}`)}
              />
            </TooltipTrigger>
            <TooltipContent>ویرایش کتاب</TooltipContent>
          </Tooltip>

          {/* وضعیت خواندن */}
          <Tooltip>
            <TooltipTrigger asChild>
              <FaBookReader
                className={`transition cursor-pointer text-2xl md:text-[30px] ${
                  status === "UNREAD"
                    ? "text-red-500"
                    : status === "READING"
                    ? "text-blue-500"
                    : "text-primary"
                }`}
                onClick={handleStatusToggle}
              />
            </TooltipTrigger>
            <TooltipContent>{getStatusLabel(status)}</TooltipContent>
          </Tooltip>

          {/* نمایش نمره / Rating */}
          {status === "FINISHED" && book.rating !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center items-center gap-0.5 cursor-pointer">
                  <FaStar className="text-yellow-400 text-xl" />
                  <span className="pt-1 font-semibold">{book.rating}10</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>امتیاز کتاب</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TooltipProvider>
    </Card>
  );
}

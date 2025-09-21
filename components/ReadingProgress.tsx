"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, FileText } from "lucide-react";

interface ReadingProgressProps {
  progress: number;
  pageCount: number | null;
  onProgressChange: (progress: number) => void;
  className?: string;
}

export default function ReadingProgress({
  progress,
  pageCount,
  onProgressChange,
  className = "",
}: ReadingProgressProps) {
  const [percentage, setPercentage] = useState(progress || 0);
  const [currentPage, setCurrentPage] = useState(0);

  // محاسبه صفحه فعلی بر اساس درصد
  useEffect(() => {
    if (pageCount && pageCount > 0) {
      setCurrentPage(Math.round((percentage / 100) * pageCount));
    }
  }, [percentage, pageCount]);

  const handlePageChange = (value: string) => {
    if (!pageCount || pageCount <= 0) return;

    const numValue = parseInt(value) || 0;
    const clampedValue = Math.min(Math.max(numValue, 0), pageCount);
    const calculatedPercentage = Math.round((clampedValue / pageCount) * 100);

    setCurrentPage(clampedValue);
    setPercentage(calculatedPercentage);
    onProgressChange(calculatedPercentage);
  };

  const getProgressColor = (progress: number) => {
    if (progress === 0) return "bg-gray-600";
    if (progress < 25) return "bg-red-500";
    if (progress < 50) return "bg-orange-500";
    if (progress < 75) return "bg-yellow-500";
    if (progress < 100) return "bg-blue-500";
    return "bg-green-400";
  };

  const getProgressText = (progress: number) => {
    if (progress === 0) return "شروع نشده";
    if (progress < 25) return "شروع شده";
    if (progress < 50) return "در حال پیشرفت";
    if (progress < 75) return "نزدیک به پایان";
    if (progress < 100) return "تقریباً تمام شده";
    return "تمام شده";
  };

  return (
    <Card
      className={`bg-[#26262E] border-gray-700 rounded-lg shadow-md ${className}`}
    >
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-400/20 rounded-full">
              <BookOpen className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                پیشرفت خواندن
              </h3>
              <p className="text-sm text-gray-400">وضعیت فعلی مطالعه کتاب</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium text-gray-300">
                درصد پیشرفت
              </Label>
              <span className="text-sm text-green-400 font-semibold">
                {percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out ${getProgressColor(
                  percentage
                )}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              {getProgressText(percentage)}
            </p>
          </div>

          {/* Page Input */}
          {pageCount && pageCount > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="currentPage"
                className="text-sm font-medium text-gray-300"
              >
                صفحه فعلی
              </Label>
              <div className="relative w-full md:w-1/3">
                <FileText className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="currentPage"
                  type="number"
                  min={0}
                  max={pageCount}
                  value={currentPage}
                  onChange={(e) => handlePageChange(e.target.value)}
                  className="pr-10 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-green-400 focus:ring-green-400/20"
                  placeholder="0"
                />
              </div>
              <p className="text-xs text-gray-500">از {pageCount} صفحه</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

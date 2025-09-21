"use client";

import { cn } from "@/lib/utils";
import { BookOpen, Loader2 } from "lucide-react";

interface LoadingProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "spinner" | "dots" | "pulse" | "skeleton" | "books" | "pages";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export default function Loading({
  size = "md",
  variant = "spinner",
  text,
  className,
  fullScreen = false,
}: LoadingProps) {
  const baseClasses = "flex items-center justify-center";
  const fullScreenClasses = fullScreen
    ? "fixed inset-0 bg-[#1C1C22]/90 backdrop-blur-sm z-50"
    : "";

  const containerClasses = cn(baseClasses, fullScreenClasses, className);

  const renderSpinner = () => (
    <div
      className={cn(
        "border-2 border-gray-600 border-t-[#00FF99] rounded-full animate-spin",
        sizeClasses[size]
      )}
    />
  );

  const renderBooks = () => (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-[#00FF99] rounded-sm animate-bounce",
            size === "sm"
              ? "w-2 h-3"
              : size === "md"
              ? "w-3 h-4"
              : size === "lg"
              ? "w-4 h-6"
              : "w-6 h-8"
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );

  const renderPages = () => (
    <div className="relative">
      <div className="flex items-center gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "bg-[#00FF99]/20 border border-[#00FF99]/40 rounded-sm animate-pulse",
              size === "sm"
                ? "w-2 h-3"
                : size === "md"
                ? "w-3 h-4"
                : size === "lg"
                ? "w-4 h-6"
                : "w-6 h-8"
            )}
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: "1.5s",
            }}
          />
        ))}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <BookOpen
          className={cn("text-[#00FF99] animate-pulse", sizeClasses[size])}
        />
      </div>
    </div>
  );

  const renderDots = () => (
    <div className="flex space-x-1 rtl:space-x-reverse">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            "bg-[#00FF99] rounded-full animate-pulse",
            size === "sm"
              ? "w-1 h-1"
              : size === "md"
              ? "w-2 h-2"
              : size === "lg"
              ? "w-3 h-3"
              : "w-4 h-4"
          )}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );

  const renderPulse = () => (
    <div
      className={cn(
        "bg-[#00FF99] rounded-full animate-pulse",
        sizeClasses[size]
      )}
    />
  );

  const renderSkeleton = () => (
    <div className="space-y-2 w-full">
      <div className="h-4 bg-gray-700 rounded animate-pulse" />
      <div className="h-4 bg-gray-700 rounded animate-pulse w-3/4" />
      <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2" />
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case "dots":
        return renderDots();
      case "pulse":
        return renderPulse();
      case "skeleton":
        return renderSkeleton();
      case "books":
        return renderBooks();
      case "pages":
        return renderPages();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        {renderContent()}
        {text && <p className="text-sm text-gray-300 animate-pulse">{text}</p>}
      </div>
    </div>
  );
}

// Pre-built loading components for common use cases
export function PageLoading({
  text = "در حال بارگذاری...",
}: {
  text?: string;
}) {
  return <Loading size="lg" variant="pages" text={text} fullScreen />;
}

export function BookLoading({
  text = "در حال بارگذاری کتاب‌ها...",
}: {
  text?: string;
}) {
  return <Loading size="lg" variant="books" text={text} fullScreen />;
}

export function CardLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "p-6 space-y-4 bg-[#26262E] border border-gray-700 rounded-lg",
        className
      )}
    >
      <div className="h-6 bg-gray-700 rounded animate-pulse w-1/3" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded animate-pulse" />
        <div className="h-4 bg-gray-700 rounded animate-pulse w-5/6" />
        <div className="h-4 bg-gray-700 rounded animate-pulse w-4/6" />
      </div>
    </div>
  );
}

export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 bg-[#26262E] border border-gray-700 rounded-lg p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 rtl:space-x-reverse">
          <div className="h-4 bg-gray-700 rounded animate-pulse flex-1" />
          <div className="h-4 bg-gray-700 rounded animate-pulse w-24" />
          <div className="h-4 bg-gray-700 rounded animate-pulse w-32" />
        </div>
      ))}
    </div>
  );
}

export function ChartLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-64 bg-[#26262E] border border-gray-700 rounded-lg",
        className
      )}
    >
      <div className="text-center space-y-4">
        <Loading size="lg" variant="books" />
        <p className="text-gray-300">در حال بارگذاری نمودار...</p>
      </div>
    </div>
  );
}

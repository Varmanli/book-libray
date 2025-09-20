"use client";

import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingBooksProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showText?: boolean;
}

export default function LoadingBooks({
  message = "در حال بارگذاری...",
  size = "md",
  className = "",
  showText = true,
}: LoadingBooksProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-32 h-32",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
  };

  return (
    <div
      className={cn(
        "flex flex-col justify-center items-center h-full min-h-[300px]",
        className
      )}
    >
      {/* Book Loading Animation */}
      <div className="relative">
        {/* Main Spinner */}
        <div className={cn("relative animate-spin-slow", sizeClasses[size])}>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-4 h-12 bg-primary rounded shadow-lg"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-12 bg-primary rounded shadow-lg"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-90 w-4 h-12 bg-primary rounded shadow-lg"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 rotate-[135deg] w-4 h-12 bg-primary rounded shadow-lg"></div>
        </div>

        {/* Book Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen
            className={cn(
              "text-primary/60 animate-pulse",
              size === "sm" ? "w-4 h-4" : size === "md" ? "w-6 h-6" : "w-8 h-8"
            )}
          />
        </div>
      </div>

      {/* Loading Text */}
      {showText && (
        <p
          className={cn(
            "mt-6 text-muted-foreground animate-pulse",
            textSizeClasses[size]
          )}
        >
          {message}
        </p>
      )}
    </div>
  );
}

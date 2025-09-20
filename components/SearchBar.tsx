"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  onSearch,
  onClear,
  placeholder = "جستجو در کتاب‌ها...",
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery);
    } else {
      onClear();
    }
  }, [debouncedQuery, onSearch, onClear]);

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <div className="relative">
        {/* آیکون سرچ */}
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />

        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          dir="rtl"
          className="
            pr-10 pl-10 py-2
            rounded-full border border-gray-600
            bg-gray-900 text-gray-100
            placeholder:text-gray-400
            shadow-sm
            focus:border-primary focus:ring-2 focus:ring-primary/50
            transition-all duration-200
            text-sm
          "
        />

        {/* دکمه پاک کردن */}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="
              absolute left-2 top-1/2 -translate-y-1/2
              h-6 w-6 p-0
              hover:bg-gray-800
              text-gray-400 hover:text-gray-200
              rounded-full
              transition-colors
            "
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

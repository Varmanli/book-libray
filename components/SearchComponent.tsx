"use client";

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, BookOpen, User, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  coverImage: string;
  createdAt: string;
  translator?: string;
  publisher?: string;
}

interface SearchResult {
  books: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchComponentProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

const SearchComponent = memo(function SearchComponent({
  className = "",
  placeholder = "جست‌وجو در قفسه...",
  onSearch,
}: SearchComponentProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounce search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < 2) {
        setResults([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/books/search?q=${encodeURIComponent(searchQuery)}&limit=8`,
          { credentials: "include" }
        );

        if (response.ok) {
          const data: SearchResult = await response.json();
          setResults(data.books || []);
          setShowDropdown(true);
        } else {
          setResults([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    debouncedSearch(value);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch?.(query);
      // Navigate to books page with search query
      router.push(`/books?search=${encodeURIComponent(query)}`);
      setShowDropdown(false);
    }
  };

  // Handle result click
  const handleResultClick = (book: Book) => {
    router.push(`/books/${book.id}`);
    setShowDropdown(false);
    setQuery("");
    setResults([]);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultClick(results[selectedIndex]);
        } else if (query.trim()) {
          handleSubmit(e);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format date - memoized
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("fa-IR");
  }, []);

  // Memoized search results
  const memoizedResults = useMemo(() => results, [results]);

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative flex w-full gap-2">
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="h-14 text-lg rounded-2xl pr-4 shadow-sm flex-1 bg-background border-input"
          aria-label="جست‌وجو در قفسه"
          autoComplete="off"
        />
        <Button
          type="submit"
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-2xl px-6 h-11 shadow-md"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </form>

      {/* Search Results Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-lg z-50 max-h-96 overflow-y-auto"
        >
          {memoizedResults.length > 0 ? (
            <div className="p-2">
              {memoizedResults.map((book, index) => (
                <div
                  key={book.id}
                  onClick={() => handleResultClick(book)}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all",
                    "hover:bg-muted/60 hover:shadow-md",
                    selectedIndex === index && "bg-muted shadow-sm"
                  )}
                >
                  {/* Book Cover */}
                  <div className="w-16 h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0 shadow">
                    {book.coverImage ? (
                      <Image
                        src={book.coverImage}
                        alt={book.title}
                        width={64}
                        height={96}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    {/* Title + Genre */}
                    <div>
                      <h3 className="font-bold text-foreground text-lg truncate">
                        {book.title}
                      </h3>
                      <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {book.genre}
                      </span>
                    </div>

                    {/* Author + Translator */}
                    <div className="mt-3 flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 shrink-0" />
                        <span className="truncate">{book.author}</span>
                      </div>
                      {book.translator && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs">مترجم:</span>
                          <span className="truncate">{book.translator}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Show more results link */}
              {memoizedResults.length >= 8 && (
                <div
                  onClick={() => {
                    router.push(`/books?search=${encodeURIComponent(query)}`);
                    setShowDropdown(false);
                  }}
                  className="flex items-center justify-center gap-2 p-3 text-sm text-primary hover:bg-muted/50 rounded-xl cursor-pointer transition-colors border-t border-border mt-2"
                >
                  <Search className="w-4 h-4" />
                  <span>مشاهده همه نتایج</span>
                </div>
              )}
            </div>
          ) : query.trim().length >= 2 && !isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>هیچ کتابی پیدا نشد</p>
              <p className="text-xs mt-1">کلمات کلیدی دیگری امتحان کنید</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
});

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchComponent;

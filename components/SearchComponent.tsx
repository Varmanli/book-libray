"use client";

import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  ChevronLeft,
  Loader2,
  PenTool,
  Search,
  UserRound,
} from "lucide-react";

import AuthorAvatar from "@/components/reference/AuthorAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GlobalSearchBook {
  id: string;
  slug: string;
  title: string;
  author: string;
  coverImage: string | null;
  translator: string | null;
  publisher: string | null;
}

interface GlobalSearchReference {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  bookCount?: number;
}

interface GlobalSearchResponse {
  books: GlobalSearchBook[];
  authors: GlobalSearchReference[];
  translators: GlobalSearchReference[];
  publishers: GlobalSearchReference[];
}

interface SearchComponentProps {
  className?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
  resultsHref?: string;
}

const MIN_QUERY_LENGTH = 2;

const SearchComponent = memo(function SearchComponent({
  className = "",
  placeholder = "جست‌وجو در قفسه...",
  onSearch,
  resultsHref = "/books",
}: SearchComponentProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResponse>({
    books: [],
    authors: [],
    translators: [],
    publishers: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cacheRef = useRef<Map<string, GlobalSearchResponse>>(new Map());
  const requestIdRef = useRef(0);
  const router = useRouter();

  const sections = useMemo(
    () => [
      {
        key: "books",
        title: "کتاب‌ها",
        icon: <BookOpen className="h-4 w-4" />,
        allHref: `${resultsHref}?q=${encodeURIComponent(query.trim())}`,
        items: results.books,
        emptyLabel: "کتابی پیدا نشد",
      },
      {
        key: "authors",
        title: "نویسنده‌ها",
        icon: <PenTool className="h-4 w-4" />,
        allHref: `/authors?q=${encodeURIComponent(query.trim())}`,
        items: results.authors,
        emptyLabel: "نویسنده‌ای پیدا نشد",
      },
      {
        key: "translators",
        title: "مترجم‌ها",
        icon: <UserRound className="h-4 w-4" />,
        allHref: `/translators?q=${encodeURIComponent(query.trim())}`,
        items: results.translators,
        emptyLabel: "مترجمی پیدا نشد",
      },
      {
        key: "publishers",
        title: "ناشرها",
        icon: <Building2 className="h-4 w-4" />,
        allHref: `/publishers?q=${encodeURIComponent(query.trim())}`,
        items: results.publishers,
        emptyLabel: "ناشری پیدا نشد",
      },
    ],
    [query, results, resultsHref],
  );

  const nonEmptySections = useMemo(
    () => sections.filter((section) => section.items.length > 0),
    [sections],
  );

  const navigableItems = useMemo(
    () =>
      nonEmptySections.flatMap((section) =>
        section.items.map((item) => ({
          key: `${section.key}-${item.id}`,
          sectionKey: section.key,
          item,
        })),
      ),
    [nonEmptySections],
  );

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        const trimmed = searchQuery.trim();

        if (trimmed.length < MIN_QUERY_LENGTH) {
          setResults({ books: [], authors: [], translators: [], publishers: [] });
          setShowDropdown(false);
          setIsLoading(false);
          return;
        }

        const cached = cacheRef.current.get(trimmed);
        if (cached) {
          setResults(cached);
          setShowDropdown(true);
          setIsLoading(false);
          return;
        }

        const requestId = ++requestIdRef.current;
        setIsLoading(true);
        setShowDropdown(true);

        try {
          const response = await fetch(
            `/api/search/global?q=${encodeURIComponent(trimmed)}&limit=4`,
            { credentials: "include" },
          );

          if (!response.ok) throw new Error("Search request failed");

          const data: GlobalSearchResponse = await response.json();
          if (requestId !== requestIdRef.current) return;

          cacheRef.current.set(trimmed, data);
          if (cacheRef.current.size > 12) {
            const oldestKey = cacheRef.current.keys().next().value;
            if (oldestKey) cacheRef.current.delete(oldestKey);
          }

          setResults(data);
        } catch (error) {
          console.error("Global search error:", error);
          if (requestId === requestIdRef.current) {
            setResults({
              books: [],
              authors: [],
              translators: [],
              publishers: [],
            });
          }
        } finally {
          if (requestId === requestIdRef.current) {
            setIsLoading(false);
          }
        }
      }, 300),
    [],
  );

  const closeDropdown = () => {
    setShowDropdown(false);
    setSelectedIndex(-1);
  };

  const resetSearch = () => {
    setQuery("");
    setResults({ books: [], authors: [], translators: [], publishers: [] });
    closeDropdown();
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    resetSearch();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    onSearch?.(query);
    handleNavigate(`${resultsHref}?q=${encodeURIComponent(query.trim())}`);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim().length >= MIN_QUERY_LENGTH) {
      setShowDropdown(true);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setResults({ books: [], authors: [], translators: [], publishers: [] });
      setShowDropdown(false);
    }

    debouncedSearch(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeDropdown();
      return;
    }

    if (!showDropdown || navigableItems.length === 0) {
      if (event.key === "Enter" && query.trim()) {
        handleSubmit(event);
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setSelectedIndex((current) =>
          current < navigableItems.length - 1 ? current + 1 : 0,
        );
        break;
      case "ArrowUp":
        event.preventDefault();
        setSelectedIndex((current) =>
          current > 0 ? current - 1 : navigableItems.length - 1,
        );
        break;
      case "Enter":
        event.preventDefault();
        if (selectedIndex >= 0) {
          const selected = navigableItems[selectedIndex];
          handleNavigate(getItemHref(selected.sectionKey, selected.item));
        } else if (query.trim()) {
          handleSubmit(event);
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasAnyResult =
    results.books.length > 0 ||
    results.authors.length > 0 ||
    results.translators.length > 0 ||
    results.publishers.length > 0;

  return (
    <div className={cn("relative w-full", className)}>
      <form onSubmit={handleSubmit} className="relative w-full">
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70">
          <Search className="h-5 w-5" />
        </span>

        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim().length >= MIN_QUERY_LENGTH) {
              setShowDropdown(true);
            }
          }}
          placeholder={placeholder}
          className="h-12 rounded-[1.35rem] border-border/80 bg-card/85 pr-11 pl-14 text-sm shadow-sm shadow-black/5 backdrop-blur placeholder:text-muted-foreground/70 focus-visible:ring-primary/25"
          aria-label="جست‌وجوی سراسری در قفسه"
          autoComplete="off"
        />

        <Button
          type="submit"
          size="icon"
          aria-label="جست‌وجو"
          className="absolute left-1.5 top-1/2 h-9 w-9 -translate-y-1/2 rounded-2xl"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {showDropdown && query.trim().length >= MIN_QUERY_LENGTH ? (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[32rem] overflow-y-auto rounded-[1.5rem] border border-border/80 bg-card/95 p-2 shadow-[0_26px_80px_-48px_rgba(0,0,0,0.42)] backdrop-blur-xl"
        >
          {isLoading ? (
            <SearchSkeleton />
          ) : hasAnyResult ? (
            <div className="space-y-2">
              {nonEmptySections.map((section) => (
                <section
                  key={section.key}
                  className="rounded-[1.25rem] border border-border/70 bg-background/35 p-2"
                >
                  <div className="mb-2 flex items-center justify-between px-2 pt-1">
                    <div className="flex items-center gap-2 text-sm font-black text-foreground">
                      <span className="text-primary">{section.icon}</span>
                      <span>{section.title}</span>
                    </div>
                    <Link
                      href={section.allHref}
                      className="inline-flex items-center gap-1 text-xs font-bold text-primary transition-colors hover:text-primary/80"
                      onClick={() => resetSearch()}
                    >
                      مشاهده همه
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <div className="space-y-1">
                    {section.key === "books"
                      ? (section.items as GlobalSearchBook[]).map((book) => {
                          const flatIndex = navigableItems.findIndex(
                            (entry) =>
                              entry.sectionKey === "books" && entry.item.id === book.id,
                          );
                          return (
                            <button
                              key={book.id}
                              type="button"
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleNavigate(`/book/${encodeURIComponent(book.slug)}`);
                              }}
                              className={cn(
                                "flex w-full items-start gap-3 rounded-[1rem] p-3 text-right transition-colors",
                                selectedIndex === flatIndex
                                  ? "bg-primary/8"
                                  : "hover:bg-primary/5",
                              )}
                            >
                              <BookResultCard book={book} />
                            </button>
                          );
                        })
                      : (section.items as GlobalSearchReference[]).map((item) => {
                          const flatIndex = navigableItems.findIndex(
                            (entry) =>
                              entry.sectionKey === section.key && entry.item.id === item.id,
                          );
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onMouseEnter={() => setSelectedIndex(flatIndex)}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleNavigate(getItemHref(section.key, item));
                              }}
                              className={cn(
                                "flex w-full items-center gap-3 rounded-[1rem] p-3 text-right transition-colors",
                                selectedIndex === flatIndex
                                  ? "bg-primary/8"
                                  : "hover:bg-primary/5",
                              )}
                            >
                              <ReferenceResultCard
                                item={item}
                                sectionKey={section.key}
                              />
                            </button>
                          );
                        })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.2rem] px-4 py-8 text-center text-muted-foreground">
              <Search className="mx-auto mb-3 h-8 w-8 opacity-45" />
              <p className="font-medium text-foreground">نتیجه‌ای پیدا نشد</p>
              <p className="mt-1 text-xs">کلمات کلیدی دیگری امتحان کنید</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
});

function getItemHref(sectionKey: string, item: GlobalSearchReference | GlobalSearchBook) {
  switch (sectionKey) {
    case "authors":
      return `/authors/${encodeURIComponent((item as GlobalSearchReference).slug)}`;
    case "translators":
      return `/translators/${encodeURIComponent((item as GlobalSearchReference).slug)}`;
    case "publishers":
      return `/publishers/${encodeURIComponent((item as GlobalSearchReference).slug)}`;
    default:
      return `/book/${encodeURIComponent((item as GlobalSearchBook).slug)}`;
  }
}

function BookResultCard({ book }: { book: GlobalSearchBook }) {
  return (
    <>
      <div className="flex h-20 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted/60">
        {book.coverImage ? (
          <Image
            src={book.coverImage}
            alt={book.title}
            width={56}
            height={80}
            className="h-full w-full object-cover"
          />
        ) : (
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-black text-foreground">
          {book.title}
        </p>
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {book.author}
        </p>
        {book.translator ? (
          <p className="mt-2 line-clamp-1 text-xs text-muted-foreground/80">
            مترجم: {book.translator}
          </p>
        ) : null}
        {book.publisher ? (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">
            ناشر: {book.publisher}
          </p>
        ) : null}
      </div>
    </>
  );
}

function ReferenceResultCard({
  item,
  sectionKey,
}: {
  item: GlobalSearchReference;
  sectionKey: string;
}) {
  return (
    <>
      <AuthorAvatar
        name={item.name}
        image={item.image}
        sizeClassName="h-12 w-12"
        textClassName="text-lg"
        iconClassName="h-5 w-5"
      />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-black text-foreground">
          {item.name}
        </p>
        {sectionKey === "authors" && typeof item.bookCount === "number" ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {item.bookCount.toLocaleString("fa-IR")} کتاب
          </p>
        ) : null}
      </div>
    </>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, sectionIndex) => (
        <div
          key={sectionIndex}
          className="rounded-[1.25rem] border border-border/70 bg-background/35 p-3"
        >
          <div className="mb-3 h-4 w-28 animate-pulse rounded-full bg-white/8" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((__, itemIndex) => (
              <div
                key={itemIndex}
                className="flex items-center gap-3 rounded-[1rem] p-2"
              >
                <div className="h-12 w-12 animate-pulse rounded-full bg-white/8" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/8" />
                  <div className="h-3 w-1/3 animate-pulse rounded-full bg-white/6" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function debounce<T extends (...args: never[]) => void>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchComponent;

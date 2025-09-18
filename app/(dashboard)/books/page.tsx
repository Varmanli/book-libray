"use client";

import { Button } from "@/components/ui/button";
import BookCard from "@/components/BookCard";
import { BookType } from "@/types";
import { useEffect, useState } from "react";
import BooksSidebar from "@/components/BookSidebar";
import LoadingBooks from "@/components/LoadingBooks";
import Link from "next/link";

export default function BooksPageClient() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState(true);

  const [authors, setAuthors] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [publishers, setPublishers] = useState<string[]>([]);
  const [translators, setTranslators] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedPublisher, setSelectedPublisher] = useState<string | null>(
    null
  );
  const [selectedTranslator, setSelectedTranslator] = useState<string | null>(
    null
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<"pageCount" | "rating" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // دریافت کتاب‌ها از API
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/books", {
        cache: "no-store",
        credentials: "include",
      });
      const data: { Book?: BookType[]; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در دریافت کتاب‌ها");

      const allBooks = data.Book || [];
      setBooks(allBooks);

      // گرفتن لیست یکتا برای فیلترها
      setAuthors([...new Set(allBooks.map((b) => b.author))]);
      setGenres([...new Set(allBooks.map((b) => b.genre))]);
      setPublishers([
        ...new Set(
          allBooks
            .map((b) => b.publisher)
            .filter((p): p is string => typeof p === "string" && p.length > 0)
        ),
      ]);
      setTranslators([
        ...new Set(
          allBooks
            .map((b) => b.translator)
            .filter((t): t is string => typeof t === "string" && t.length > 0)
        ),
      ]);
      setCountries([
        ...new Set(
          allBooks.map((b) => b.country).filter((c): c is string => !!c)
        ),
      ]);
    } catch (err: any) {
      console.error("❌ خطا در گرفتن کتاب‌ها:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // تغییر وضعیت کتاب
  const handleStatusChange = async (
    id: string,
    newStatus: "UNREAD" | "READING" | "FINISHED"
  ) => {
    try {
      await fetch(`/api/books/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error("❌ خطا در تغییر وضعیت کتاب:", err);
    }
  };

  // فیلتر و مرتب‌سازی کتاب‌ها
  const filteredBooks = [...books]
    .filter(
      (b) =>
        (!selectedAuthor || b.author === selectedAuthor) &&
        (!selectedGenre || b.genre === selectedGenre) &&
        (!selectedPublisher || b.publisher === selectedPublisher) &&
        (!selectedTranslator || b.translator === selectedTranslator) &&
        (!selectedCountry || b.country === selectedCountry) &&
        (!selectedStatus ||
          b.status?.toUpperCase() === selectedStatus.toUpperCase())
    )
    .sort((a, b) => {
      if (!sortBy) return 0;
      const fieldA = a[sortBy] ?? 0;
      const fieldB = b[sortBy] ?? 0;
      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="container mx-auto p-6">
      {loading ? (
        <LoadingBooks />
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-xl text-gray-400 mb-6">
            هنوز کتابی اضافه نکردی 📚
          </p>
          <Link href="/books/add">
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              ➕ اضافه کردن کتاب جدید
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <BooksSidebar
            authors={authors}
            genres={genres}
            publishers={publishers}
            translators={translators}
            countries={countries}
            selectedAuthor={selectedAuthor}
            selectedGenre={selectedGenre}
            selectedPublisher={selectedPublisher}
            selectedTranslator={selectedTranslator}
            selectedCountry={selectedCountry}
            selectedStatus={selectedStatus}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onAuthorChange={setSelectedAuthor}
            onGenreChange={setSelectedGenre}
            onPublisherChange={setSelectedPublisher}
            onTranslatorChange={setSelectedTranslator}
            onCountryChange={setSelectedCountry}
            onStatusChange={setSelectedStatus}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />

          {/* لیست کتاب‌ها */}
          <main className="md:col-span-3">
            <div className="grid grid-cols-1 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import BookCard from "@/components/BookCard";
import { BookType } from "@/types";
import { useEffect, useState } from "react";
import BooksSidebar from "@/components/BookSidebar";

export default function BooksPageClient() {
  const [books, setBooks] = useState<BookType[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [publishers, setPublishers] = useState<string[]>([]);
  const [translators, setTranslators] = useState<string[]>([]);

  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedPublisher, setSelectedPublisher] = useState<string | null>(
    null
  );
  const [selectedTranslator, setSelectedTranslator] = useState<string | null>(
    null
  );

  // دریافت کتاب‌ها از API
  const fetchBooks = async () => {
    try {
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
    } catch (err: any) {
      console.error("❌ خطا در گرفتن کتاب‌ها:", err.message);
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

      // به‌روزرسانی وضعیت در frontend بدون رفرش
      setBooks((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.error("❌ خطا در تغییر وضعیت کتاب:", err);
    }
  };

  // فیلتر کردن کتاب‌ها
  const filteredBooks = books.filter(
    (b) =>
      (!selectedAuthor || b.author === selectedAuthor) &&
      (!selectedGenre || b.genre === selectedGenre) &&
      (!selectedPublisher || b.publisher === selectedPublisher) &&
      (!selectedTranslator || b.translator === selectedTranslator)
  );

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar فیلترها */}
        <BooksSidebar
          authors={authors}
          genres={genres}
          publishers={publishers}
          translators={translators}
          selectedAuthor={selectedAuthor}
          selectedGenre={selectedGenre}
          selectedPublisher={selectedPublisher}
          selectedTranslator={selectedTranslator}
          onAuthorChange={setSelectedAuthor}
          onGenreChange={setSelectedGenre}
          onPublisherChange={setSelectedPublisher}
          onTranslatorChange={setSelectedTranslator}
        />

        {/* لیست کتاب‌ها */}
        <main className="md:col-span-3">
          <ScrollArea className="h-[600px]">
            <div className="grid grid-cols-1 gap-6">
              {filteredBooks.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}

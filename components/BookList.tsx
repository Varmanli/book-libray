"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Book {
  id: number;
  title: string;
  author: string;
  genre: string;
  format: string;
}

interface BookListProps {
  books: Book[];
}

export default function BookList({ books }: BookListProps) {
  const [search, setSearch] = useState("");
  const [filterAuthor, setFilterAuthor] = useState("");
  const [filterGenre, setFilterGenre] = useState("");

  const filtered = books.filter((b) => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchesAuthor = filterAuthor ? b.author === filterAuthor : true;
    const matchesGenre = filterGenre ? b.genre === filterGenre : true;
    return matchesSearch && matchesAuthor && matchesGenre;
  });

  const authors = [...new Set(books.map((b) => b.author))];
  const genres = [...new Set(books.map((b) => b.genre))];

  return (
    <div>
      {/* فیلترها */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <Input
          placeholder="جستجو بر اساس عنوان"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />

        <Select value={filterAuthor} onValueChange={setFilterAuthor}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="همه نویسنده‌ها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">همه نویسنده‌ها</SelectItem>
            {authors.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterGenre} onValueChange={setFilterGenre}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="همه ژانرها" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">همه ژانرها</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g} value={g}>
                {g}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* لیست کتاب‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((b) => (
          <Card key={b.id} className="shadow">
            <CardHeader>
              <div className="h-48 bg-muted mb-2 flex items-center justify-center rounded">
                <span className="text-sm text-muted-foreground">
                  📖 جلد کتاب
                </span>
              </div>
              <CardTitle>{b.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">✍️ نویسنده: {b.author}</p>
              <p className="text-sm">🎭 ژانر: {b.genre}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

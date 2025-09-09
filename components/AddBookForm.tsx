"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface AddBookFormProps {
  authors: string[];
  genres: string[];
}

export default function AddBookForm({ authors, genres }: AddBookFormProps) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState(authors[0] || "");
  const [genre, setGenre] = useState(genres[0] || "");
  const [format, setFormat] = useState("PHYSICAL");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/books", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, author, genre, format }),
    });

    // reset form
    setTitle("");
    setAuthor(authors[0] || "");
    setGenre(genres[0] || "");
    setFormat("PHYSICAL");

    window.location.reload(); // ساده‌ترین راه برای ری‌لود
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col md:flex-row gap-4 items-center"
    >
      {/* عنوان کتاب */}
      <Input
        type="text"
        placeholder="عنوان کتاب"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="flex-1"
      />

      {/* نویسنده */}
      <Select value={author} onValueChange={setAuthor}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="انتخاب نویسنده" />
        </SelectTrigger>
        <SelectContent>
          {authors.map((a) => (
            <SelectItem key={a} value={a}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* ژانر */}
      <Select value={genre} onValueChange={setGenre}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="انتخاب ژانر" />
        </SelectTrigger>
        <SelectContent>
          {genres.map((g) => (
            <SelectItem key={g} value={g}>
              {g}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* نوع کتاب */}
      <Select value={format} onValueChange={setFormat}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="نوع کتاب" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PHYSICAL">فیزیکی</SelectItem>
          <SelectItem value="ELECTRONIC">الکترونیکی</SelectItem>
        </SelectContent>
      </Select>

      {/* دکمه */}
      <Button type="submit">اضافه کن</Button>
    </form>
  );
}

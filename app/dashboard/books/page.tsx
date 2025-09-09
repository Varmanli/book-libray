import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import Link from "next/link";

type Book = {
  id: number;
  title: string;
  author: string;
  translator?: string | null;
  genre: string;
  format: string;
  coverImage: string;
  createdAt: Date;
};

export default async function BooksPage() {
  const books: Book[] = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
  });

  const authors = Array.from(new Set(books.map((b) => b.author)));
  const genres = Array.from(new Set(books.map((b) => b.genre)));

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Filters */}
        <aside className="md:col-span-1 border rounded-xl p-4 space-y-4 h-fit">
          <h2 className="font-semibold text-lg mb-2">فیلترها</h2>

          {/* فیلتر نویسنده */}
          <div>
            <label className="text-sm font-medium">نویسنده</label>
            <Select>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="انتخاب نویسنده" />
              </SelectTrigger>
              <SelectContent>
                {authors.map((author) => (
                  <SelectItem key={author} value={author}>
                    {author}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* فیلتر ژانر */}
          <div>
            <label className="text-sm font-medium">ژانر</label>
            <Select>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="انتخاب ژانر" />
              </SelectTrigger>
              <SelectContent>
                {genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TODO: فیلتر کشور */}
        </aside>

        {/* Book List */}
        <main className="md:col-span-3">
          <ScrollArea className="h-[600px] ">
            <div className="grid grid-cols-1 gap-6">
              {books.map((book) => (
                <Link key={book.id} href={`/books/${book.id}`}>
                  <Card className="flex flex-row-reverse items-start border rounded-xl shadow-sm hover:shadow-md transition cursor-pointer py-0">
                    {/* جلد کتاب سمت راست */}
                    <div className="relative w-40 h-60 flex-shrink-0">
                      <Image
                        src={book.coverImage || "/placeholder-cover.jpg"}
                        alt={book.title}
                        fill
                        className="object-cover rounded-r-xl"
                      />
                    </div>
                    <CardContent className="flex flex-col h-full justify-start items-end py-14 gap-5 text-right">
                      <h3 className="text-lg font-bold">{book.title}</h3>

                      <p className="font-semibold">نویسنده: {book.author}</p>

                      {book.translator && (
                        <p className="font-semibold">
                          مترجم: {book.translator}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </main>
      </div>
    </div>
  );
}

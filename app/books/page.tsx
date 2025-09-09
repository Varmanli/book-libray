import { prisma } from "@/lib/prisma";
import AddBookForm from "@/component/AddBookForm";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";

type Book = {
  id: number;
  title: string;
  author: string;
  genre: string;
  format: string;
  createdAt: Date;
};

export default async function BooksPage() {
  const books: Book[] = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
  });

  const authors = Array.from(new Set(books.map((b) => b.author)));
  const genres = Array.from(new Set(books.map((b) => b.genre)));

  return (
    <div className="container mx-auto p-4 ">
      <h1 className="text-3xl font-bold mb-6">کتابخانه من</h1>

      {/* فرم اضافه کردن کتاب */}
      <div className="mb-6">
        <AddBookForm authors={authors} genres={genres} />
      </div>

      {/* لیست کتاب‌ها */}
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {books.map((book) => (
            <Card key={book.id} className="border">
              <CardHeader>
                <CardTitle>{book.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  <strong>نویسنده:</strong> {book.author}
                </p>
                <p>
                  <strong>ژانر:</strong> {book.genre}
                </p>
                <p>
                  <strong>نوع کتاب:</strong> {book.format}
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  ویرایش
                </Button>
                <Button variant="destructive" size="sm" className="ml-2">
                  حذف
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft, BookmarkPlus } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import type { BlogBookEmbed as BlogBookEmbedData } from "@/lib/blog/book-embed";
import { getPublicBookHref } from "@/lib/book/public-href";

export default function BlogBookEmbed({
  book,
}: {
  book: BlogBookEmbedData | null;
}) {
  if (!book) {
    return (
      <aside className="my-10 rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
        این کتاب دیگر در دسترس نیست.
      </aside>
    );
  }

  const href = getPublicBookHref(book);

  const content = (
    <>
      <div
        className="
          relative
          h-32
          w-22
          shrink-0
          overflow-hidden
          rounded-xl
          bg-muted
          shadow-sm
        "
      >
        <BookCoverImage
          src={book.coverImage}
          alt={`جلد ${book.title}`}
          fill
          sizes="88px"
          className="object-cover"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <h2
          className="
            line-clamp-2
            text-lg
            font-black
            leading-7
            text-foreground
          "
        >
          {book.title}
        </h2>

        {book.author && (
          <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
        )}

        <div className="mt-4">
          <span
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-primary
            "
          >
            <BookmarkPlus className="h-4 w-4" />
            این کتاب را به قفسه خودت اضافه کن
            <ArrowLeft className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </>
  );

  const className = `
    group
    my-10
    flex
    gap-5
    rounded-2xl
    border
    border-border/60
    bg-card
    p-4
    transition-all
    hover:border-primary/30
    hover:shadow-md
    sm:p-5
  `;

  if (!href) {
    return <aside className={className}>{content}</aside>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

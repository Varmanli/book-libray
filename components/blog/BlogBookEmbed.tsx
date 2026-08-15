import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import type { BlogBookEmbed as BlogBookEmbedData } from "@/lib/blog/book-embed";
import { getPublicBookHref } from "@/lib/book/public-href";

export default function BlogBookEmbed({ book }: { book: BlogBookEmbedData | null }) {
  if (!book) {
    return (
      <aside className="my-7 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        کتابِ ارجاع‌شده در این نوشته دیگر در دسترس نیست.
      </aside>
    );
  }

  const href = getPublicBookHref(book);
  const body = (
    <>
      <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-muted sm:h-32 sm:w-[5.75rem]">
        <BookCoverImage src={book.coverImage} alt={`جلد ${book.title}`} fill sizes="(max-width: 640px) 80px, 92px" className="object-cover" />
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-[11px] font-bold text-primary">کتاب پیشنهادی در این نوشته</p>
        <h2 className="mt-1 truncate text-base font-black text-foreground sm:text-lg">{book.title}</h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">{book.author}</p>
        {book.translator || book.publisher ? (
          <p className="mt-1 truncate text-xs text-muted-foreground/85">
            {[book.translator ? `ترجمه: ${book.translator}` : null, book.publisher].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <span className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <BookOpen className="h-4 w-4" /> مشاهده کتاب <ArrowLeft className="h-3.5 w-3.5" />
        </span>
      </div>
    </>
  );

  if (!href) return <div className="my-7 flex gap-4 rounded-2xl border border-border bg-card/70 p-4">{body}</div>;

  return (
    <Link href={href} className="group my-7 flex gap-4 rounded-2xl border border-border bg-card/70 p-4 outline-none transition-colors hover:border-primary/35 hover:bg-primary/[0.04] focus-visible:ring-2 focus-visible:ring-primary/40 sm:p-5">
      {body}
    </Link>
  );
}

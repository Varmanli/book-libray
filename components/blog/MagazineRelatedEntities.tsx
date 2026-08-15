import Link from "next/link";
import { BookmarkPlus } from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import type { MagazineRelatedEntities } from "@/lib/blog/service";
import { getPublicBookHref } from "@/lib/book/public-href";

export default function MagazineRelatedEntities({
  entities,
}: {
  entities: MagazineRelatedEntities;
}) {
  const hasContent =
    entities.books.length || entities.authors.length || entities.genres.length;

  if (!hasContent) return null;

  return (
    <section className="mt-16 border-t border-border/50 pt-8">
      {entities.books.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entities.books.map((book) => {
            const href = getPublicBookHref(book);

            if (!href) return null;

            return (
              <Link
                key={book.id}
                href={href}
                className="
              group
              flex
              gap-4
              rounded-2xl
              border
              border-border/60
              bg-card/50
              p-4
              transition
              hover:border-primary/30
              hover:bg-card
            "
              >
                <div
                  className="
                relative
                h-24
                w-16
                shrink-0
                overflow-hidden
                rounded-lg
              "
                >
                  <BookCoverImage
                    src={book.coverImage}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <h3 className="line-clamp-2 font-black">{book.title}</h3>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {book.author}
                  </p>

                  <span
                    className="
                  mt-auto
                  pt-3
                  text-xs
                  font-bold
                  text-primary
                "
                  >
                    + افزودن به قفسه
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {(entities.authors.length || entities.genres.length) && (
        <div className="mt-8 flex flex-wrap gap-2">
          {entities.authors.map((author) => (
            <Link
              key={author.id}
              href={`/authors/${author.slug}`}
              className="
            rounded-full
            border
            border-border
            px-3
            py-1.5
            text-sm
            font-bold
            text-muted-foreground
            hover:text-primary
          "
            >
              {author.name}
            </Link>
          ))}

          {entities.genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/genres/${genre.slug}`}
              className="
            rounded-full
            bg-primary/10
            px-3
            py-1.5
            text-sm
            font-bold
            text-primary
          "
            >
              {genre.name}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

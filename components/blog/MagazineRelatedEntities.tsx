import Link from "next/link";

import BookCoverImage from "@/components/books/BookCoverImage";
import type { MagazineRelatedEntities } from "@/lib/blog/service";
import { getPublicBookHref } from "@/lib/book/public-href";

export default function MagazineRelatedEntities({ entities }: { entities: MagazineRelatedEntities }) {
  if (!entities.books.length && !entities.authors.length && !entities.genres.length) return null;
  return <section className="mx-auto mt-10 max-w-6xl rounded-[2rem] border border-border/70 bg-card/55 p-5 sm:p-7" aria-labelledby="related-entities">
    <h2 id="related-entities" className="text-xl font-black text-foreground">ارتباط با قفسه</h2>
    {entities.books.length ? <div className="mt-5"><h3 className="text-sm font-black text-muted-foreground">کتاب‌های مرتبط با این مطلب</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{entities.books.map((book) => { const href = getPublicBookHref(book); return href ? <Link key={book.id} href={href} className="flex gap-3 rounded-2xl border border-border/70 p-3 transition hover:border-primary/25"><div className="relative h-16 w-11 shrink-0 overflow-hidden rounded-lg"><BookCoverImage src={book.coverImage} alt="" fill sizes="44px" className="object-cover" /></div><span className="min-w-0"><span className="block truncate text-sm font-black">{book.title}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{book.author}</span></span></Link> : null; })}</div></div> : null}
    {entities.authors.length ? <div className="mt-6"><h3 className="text-sm font-black text-muted-foreground">نویسنده‌های این مطلب</h3><div className="mt-3 flex flex-wrap gap-2">{entities.authors.map((author) => <Link key={author.id} href={`/authors/${encodeURIComponent(author.slug)}`} className="rounded-full border border-border bg-background/60 px-3 py-2 text-sm font-bold transition hover:border-primary/25 hover:text-primary">{author.name}</Link>)}</div></div> : null}
    {entities.genres.length ? <div className="mt-6"><h3 className="text-sm font-black text-muted-foreground">موضوعات مرتبط</h3><div className="mt-3 flex flex-wrap gap-2">{entities.genres.map((genre) => <Link key={genre.id} href={`/genres/${encodeURIComponent(genre.slug)}`} className="rounded-full border border-primary/15 bg-primary/10 px-3 py-2 text-sm font-bold text-primary transition hover:bg-primary hover:text-primary-foreground">{genre.name}</Link>)}</div></div> : null}
  </section>;
}

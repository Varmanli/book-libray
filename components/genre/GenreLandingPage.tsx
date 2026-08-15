import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  LibraryBig,
  Sparkles,
} from "lucide-react";

import RelatedMagazineArticles from "@/components/blog/RelatedMagazineArticles";
import BookCoverImage from "@/components/books/BookCoverImage";
import PublicShell from "@/components/PublicShell";
import AuthorAvatar from "@/components/reference/AuthorAvatar";
import { getMagazineArticlesForGenre } from "@/lib/blog/service";
import { getPublicBookHref } from "@/lib/book/public-href";
import { getGenreLandingData } from "@/lib/genre/landing-service";
import { getPublicGenreHref } from "@/lib/genre/paths";
import type { ReferenceEntity } from "@/lib/reference/public-service";
import {
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from "@/lib/seo/structured-data";
import { toAbsoluteUrl } from "@/lib/seo/site";

type LandingData = Awaited<ReturnType<typeof getGenreLandingData>>;
type GenreBook = LandingData["topBooks"][number];

function SectionHeading({
  id,
  title,
  action,
}: {
  id?: string;
  title: string;
  action?: {
    href: string;
    label: string;
  };
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4 sm:mb-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-5 w-1 shrink-0 rounded-full bg-primary" />

        <h2
          id={id}
          className="truncate text-xl font-black tracking-tight text-foreground sm:text-2xl"
        >
          {title}
        </h2>
      </div>

      {action ? (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3 py-2 text-xs font-bold text-muted-foreground transition-all hover:border-primary/25 hover:bg-primary/[0.06] hover:text-primary sm:text-sm"
        >
          <span>{action.label}</span>
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

function FeaturedBooks({ books }: { books: GenreBook[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-6">
      {books.map((book, index) => {
        const href = getPublicBookHref(book);
        if (!href) return null;

        return (
          <Link key={book.id} href={href} className="group relative min-w-0">
            <div className="relative">
              <div className="relative aspect-[2/3] overflow-hidden rounded-[1.15rem] bg-muted shadow-[0_8px_30px_-18px_rgba(0,0,0,0.45)] ring-1 ring-border/60 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_45px_-20px_rgba(0,0,0,0.5)] group-hover:ring-primary/30">
                <BookCoverImage
                  src={book.coverImage}
                  alt={"جلد " + book.title}
                  fill
                  sizes="(min-width: 1024px) 170px, (min-width: 640px) 29vw, 46vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                />

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {index < 3 ? (
                <span className="absolute -right-1 -top-1 flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-background bg-primary px-1.5 text-[10px] font-black text-primary-foreground shadow-sm">
                  {(index + 1).toLocaleString("fa-IR")}
                </span>
              ) : null}
            </div>

            <div className="mt-3">
              <h3 className="line-clamp-2 text-sm font-black leading-6 text-foreground transition-colors group-hover:text-primary">
                {book.title}
              </h3>

              <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                {book.author}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function MoreBooks({ books }: { books: GenreBook[] }) {
  return (
    <div className="divide-y divide-border/60 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/50 sm:grid sm:grid-cols-2 sm:divide-x-0 sm:divide-y-0 lg:grid-cols-3">
      {books.map((book) => {
        const href = getPublicBookHref(book);
        if (!href) return null;

        return (
          <Link
            key={book.id}
            href={href}
            className="group flex min-w-0 items-center gap-3.5 px-3.5 py-3 transition-colors hover:bg-primary/[0.035] sm:m-1 sm:rounded-2xl sm:p-3.5"
          >
            <div className="relative h-[82px] w-[56px] shrink-0 overflow-hidden rounded-[0.65rem] bg-muted shadow-sm ring-1 ring-border/50">
              <BookCoverImage
                src={book.coverImage}
                alt={"جلد " + book.title}
                fill
                sizes="56px"
                className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-sm font-black leading-6 text-foreground transition-colors group-hover:text-primary">
                {book.title}
              </h3>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {book.author}
              </p>
            </div>

            <ChevronLeft className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:-translate-x-0.5 group-hover:text-primary" />
          </Link>
        );
      })}
    </div>
  );
}

export default async function GenreLandingPage({
  genre,
}: {
  genre: ReferenceEntity;
}) {
  const [data, articles] = await Promise.all([
    getGenreLandingData(genre),
    getMagazineArticlesForGenre(genre.id),
  ]);

  const href = getPublicGenreHref(genre)!;
  const description = genre.description || genre.shortDescription;
  const booksHref = "/books?genre=" + encodeURIComponent(genre.name);

  const breadcrumbs = buildBreadcrumbJsonLd([
    { name: "قفسه", url: toAbsoluteUrl("/") },
    { name: "ژانرها", url: toAbsoluteUrl("/genres") },
    { name: genre.name, url: toAbsoluteUrl(href) },
  ]);

  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: genre.name + " | قفسه",
    description: genre.seoDescription || description || undefined,
    url: toAbsoluteUrl(href),
  };

  return (
    <PublicShell>
      <main
        dir="rtl"
        className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6 sm:pt-8"
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbs) }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(collection) }}
        />

        {/* breadcrumb */}
        <nav
          aria-label="مسیر صفحه"
          className="flex items-center gap-2 overflow-hidden text-xs font-medium text-muted-foreground sm:text-sm"
        >
          <Link
            href="/"
            className="shrink-0 transition-colors hover:text-primary"
          >
            خانه
          </Link>

          <span className="text-border">/</span>

          <Link
            href="/genres"
            className="shrink-0 transition-colors hover:text-primary"
          >
            ژانرها
          </Link>

          <span className="text-border">/</span>

          <span className="truncate font-bold text-foreground">
            {genre.name}
          </span>
        </nav>

        {/* HERO */}
        <header className="relative mt-5 overflow-hidden rounded-[1.5rem] border border-border/70 bg-card">
          {/* background accent */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-primary/[0.055] blur-3xl" />
            <div className="absolute inset-y-0 right-0 w-1 bg-primary/80" />
          </div>

          <div className="relative px-5 py-5 sm:px-7 sm:py-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
              {/* main content */}
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <BookOpen className="h-[18px] w-[18px]" strokeWidth={2.1} />
                  </span>

                  <h1 className="min-w-0 truncate text-2xl font-black tracking-tight text-foreground sm:text-3xl lg:text-[36px]">
                    {genre.name}
                  </h1>
                </div>

                {description ? (
                  <p className="mr-[52px] mt-2 max-w-2xl line-clamp-2 text-sm leading-7 text-muted-foreground">
                    {description}
                  </p>
                ) : null}
              </div>

              {/* meta + action */}
              <div className="mr-[52px] flex shrink-0 items-center gap-2 lg:mr-0">
                <span className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 bg-background/60 px-3 text-xs font-bold text-muted-foreground">
                  <LibraryBig className="h-3.5 w-3.5 text-primary" />
                  {data.bookCount.toLocaleString("fa-IR")} کتاب
                </span>

                <Link
                  href={booksHref}
                  className="group inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-xs font-black text-primary-foreground transition-all duration-200 hover:bg-primary/90 sm:text-sm"
                >
                  مشاهده کتاب‌ها
                  <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="mt-11 space-y-14 sm:mt-14 sm:space-y-20">
          {/* FEATURED */}
          {data.topBooks.length ? (
            <section aria-labelledby="genre-featured-books">
              <SectionHeading
                id="genre-featured-books"
                title="پیشنهادهای این ژانر"
                action={{
                  href: booksHref,
                  label: "همه کتاب‌ها",
                }}
              />

              <FeaturedBooks books={data.topBooks} />
            </section>
          ) : null}

          {/* AUTHORS */}
          {data.authors.length ? (
            <section aria-labelledby="genre-authors">
              <SectionHeading id="genre-authors" title="نویسنده‌های شاخص" />

              <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-6">
                {data.authors.map((author) => (
                  <Link
                    key={author.id}
                    href={"/authors/" + encodeURIComponent(author.slug)}
                    className="group flex min-w-[165px] items-center gap-3 rounded-2xl border border-border/65 bg-card/45 p-3 transition-all hover:border-primary/25 hover:bg-primary/[0.035] sm:min-w-0"
                  >
                    <AuthorAvatar
                      name={author.name}
                      image={author.coverImage}
                      sizeClassName="h-11 w-11 shrink-0"
                      textClassName="text-lg"
                      iconClassName="h-5 w-5"
                    />

                    <span className="line-clamp-2 text-sm font-black leading-6 text-foreground transition-colors group-hover:text-primary">
                      {author.name}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {/* MAGAZINE */}
          <RelatedMagazineArticles
            posts={articles}
            title={`در مجله درباره ${genre.name}`}
          />

          {/* MORE BOOKS */}
          {data.moreBooks.length ? (
            <section aria-labelledby="genre-more-books">
              <SectionHeading id="genre-more-books" title="کتاب‌های بیشتر" />

              <MoreBooks books={data.moreBooks} />
            </section>
          ) : null}

          {/* RELATED GENRES */}
          {data.relatedGenres.length ? (
            <section aria-labelledby="genre-related">
              <SectionHeading
                id="genre-related"
                title="شاید این‌ها را هم دوست داشته باشی"
              />

              <div className="flex flex-wrap gap-2">
                {data.relatedGenres.map((item) => {
                  const itemHref = getPublicGenreHref(item);
                  if (!itemHref) return null;

                  return (
                    <Link
                      key={item.id}
                      href={itemHref}
                      className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-4 py-2.5 text-sm font-bold text-foreground transition-all hover:border-primary/25 hover:bg-primary/[0.07] hover:text-primary"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/60 transition-transform group-hover:scale-125" />

                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </PublicShell>
  );
}

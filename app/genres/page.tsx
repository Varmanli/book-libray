import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpLeft, Shapes } from "lucide-react";

import GenreArchiveSearch from "@/components/genre/GenreArchiveSearch";
import PublicShell from "@/components/PublicShell";
import { getGenreArchive } from "@/lib/genre/archive-service";
import { parseGenreArchiveSearchParams } from "@/lib/genre/archive-search";
import { getPublicGenreHref } from "@/lib/genre/paths";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "ژانرها و موضوعات",
    path: "/genres",
  });
}

export default async function GenresPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseGenreArchiveSearchParams(await searchParams);
  const archive = await getGenreArchive(filters);
  const genres = archive.items;

  return (
    <PublicShell>
      <main
        dir="rtl"
        className="mx-auto max-w-7xl px-4 pb-20 pt-7 sm:px-6 sm:pt-10"
      >
        {/* Header */}
        <header className="flex items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/[0.08] text-primary">
              <Shapes className="h-5 w-5" strokeWidth={2.1} />
            </span>

            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                ژانرها و موضوعات
              </h1>
            </div>
          </div>

          <span className="hidden shrink-0 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground sm:inline-flex">
            {archive.total.toLocaleString("fa-IR")} ژانر
          </span>
        </header>

        <GenreArchiveSearch initialQuery={archive.q} />

        {genres.length ? (
          <section className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {genres.map((genre) => (
              <Link
                key={genre.id}
                href={getPublicGenreHref(genre)!}
                className="group flex min-h-[86px] items-center justify-between gap-4 rounded-[1.35rem] border border-border/70 bg-card/70 px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-primary/[0.035] hover:shadow-md hover:shadow-black/[0.035]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                    <Shapes className="h-4 w-4" strokeWidth={2.1} />
                  </span>

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black text-foreground transition-colors group-hover:text-primary sm:text-[15px]">
                      {genre.name}
                    </h2>

                    <span className="mt-1 block text-[11px] font-medium text-muted-foreground">
                      {genre.bookCount.toLocaleString("fa-IR")} کتاب
                    </span>
                  </div>
                </div>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-all duration-200 group-hover:-translate-x-0.5 group-hover:border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowUpLeft className="h-3.5 w-3.5" />
                </span>
              </Link>
            ))}
          </section>
        ) : archive.q ? (
          <div className="mt-8 border-y border-dashed border-border px-5 py-10 text-center text-sm text-muted-foreground">
            ژانری با این عبارت پیدا نشد.
            <Link href="/genres" className="mr-2 font-bold text-primary transition hover:text-primary/75">
              پاک کردن جست‌وجو
            </Link>
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-border px-5 py-12 text-center text-sm text-muted-foreground">
            هنوز ژانری برای نمایش وجود ندارد.
          </div>
        )}

        {archive.pageCount > 1 ? (
          <nav aria-label="صفحه‌بندی ژانرها" className="mt-8 flex items-center justify-between gap-3 rounded-[1.6rem] border border-border/75 bg-card/70 px-4 py-3">
            <PaginationLink
              disabled={archive.page <= 1}
              href={buildArchiveHref(archive.q, archive.page - 1)}
              label="صفحه قبل"
            />
            <p className="whitespace-nowrap text-sm text-muted-foreground">
              <span className="sm:hidden">{archive.page.toLocaleString("fa-IR")} / {archive.pageCount.toLocaleString("fa-IR")}</span>
              <span className="hidden sm:inline">صفحه {archive.page.toLocaleString("fa-IR")} از {archive.pageCount.toLocaleString("fa-IR")}</span>
            </p>
            <PaginationLink
              disabled={archive.page >= archive.pageCount}
              href={buildArchiveHref(archive.q, archive.page + 1)}
              label="صفحه بعد"
            />
          </nav>
        ) : null}
      </main>
    </PublicShell>
  );
}

function buildArchiveHref(q: string, page: number) {
  const params = new URLSearchParams();
  if (q.trim()) params.set("q", q.trim());
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? "/genres?" + query : "/genres";
}

function PaginationLink({
  href,
  label,
  disabled,
}: {
  href: string;
  label: string;
  disabled: boolean;
}) {
  if (disabled) {
    return <span className="inline-flex h-10 shrink-0 items-center rounded-2xl border border-border/70 px-3 text-sm text-muted-foreground opacity-50 sm:px-4">{label}</span>;
  }

  return <Link href={href} className="inline-flex h-10 shrink-0 items-center rounded-2xl border border-border/70 px-3 text-sm text-foreground transition hover:border-primary/25 hover:text-primary sm:px-4">{label}</Link>;
}

import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import { getBookQuotesPage } from "@/lib/book/detail-service";
import PublicShell from "@/components/PublicShell";
import BookCoverImage from "@/components/books/BookCoverImage";
import BookQuotesSection from "@/components/books/BookQuotesSection";

export const dynamic = "force-dynamic";

const PLACEHOLDER = "/placeholder-cover.svg";

export default async function BookQuotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const ref = decodeURIComponent(id);
  const viewer = await getCurrentUser();
  const requestedPage = Number.parseInt(pageParam ?? "1", 10);
  const result = await getBookQuotesPage(
    ref,
    viewer?.id,
    Number.isFinite(requestedPage) ? requestedPage : 1,
  );

  if (!result.found) notFound();

  const { book, quotes, total, page, pageCount, viewerEntryId } = result;
  const isLoggedIn = !!viewer;

  if (ref !== book.slug) {
    permanentRedirect(`/book/${encodeURIComponent(book.slug)}/quotes`);
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
        <Link
          href={`/book/${encodeURIComponent(book.slug)}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به صفحه کتاب
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-xl border border-border bg-white/5">
            <BookCoverImage
              src={book.coverImage || PLACEHOLDER}
              alt={book.title}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0">
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              همه‌ی تکه‌های «{book.title}»
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
          </div>
        </div>

        <div className="mt-8">
          <BookQuotesSection
            variant="all"
            subjectBookId={book.id}
            viewerEntryId={viewerEntryId}
            viewerIsAdmin={isAdmin(viewer)}
            isLoggedIn={isLoggedIn}
            quotes={quotes}
            totalQuoteCount={total}
          />
        </div>

        {pageCount > 1 ? (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-[1.6rem] border border-border/75 bg-card/70 px-3 py-3 sm:px-4">
            <Link
              href={page > 1 ? `?page=${page - 1}` : "#"}
              aria-disabled={page <= 1}
              className={`inline-flex h-10 items-center gap-1.5 rounded-2xl border border-border/70 px-3 text-sm font-bold transition-colors sm:px-4 ${page <= 1 ? "pointer-events-none opacity-45" : "hover:border-primary/30 hover:bg-primary/10 hover:text-primary"}`}
            >
              <ArrowRight className="h-4 w-4" />
              <span className="hidden sm:inline">صفحه قبل</span>
            </Link>
            <p className="text-xs text-muted-foreground sm:text-sm">
              صفحه {page.toLocaleString("fa-IR")} از {pageCount.toLocaleString("fa-IR")}
            </p>
            <Link
              href={page < pageCount ? `?page=${page + 1}` : "#"}
              aria-disabled={page >= pageCount}
              className={`inline-flex h-10 items-center gap-1.5 rounded-2xl border border-border/70 px-3 text-sm font-bold transition-colors sm:px-4 ${page >= pageCount ? "pointer-events-none opacity-45" : "hover:border-primary/30 hover:bg-primary/10 hover:text-primary"}`}
            >
              <span className="hidden sm:inline">صفحه بعد</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </div>
    </PublicShell>
  );
}

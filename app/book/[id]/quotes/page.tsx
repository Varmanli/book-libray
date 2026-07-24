import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

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

  const initialHasMore = page < pageCount;

  return (
    <PublicShell>
      <main className="relative mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10" dir="rtl">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-[radial-gradient(circle_at_top,rgba(128,167,150,0.1),transparent_52%)]" />

        <div className="space-y-6">
          {/* Back link */}
          <div className="text-right">
            <Link
              href={`/book/${encodeURIComponent(book.slug)}`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              بازگشت به صفحه کتاب
            </Link>
          </div>

          {/* Book Editorial Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
            <div className="flex items-center gap-4">
              {/* Book Cover */}
              <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-xl border border-border/80 bg-white/5 sm:w-16 shadow-sm">
                <BookCoverImage
                  src={book.coverImage || PLACEHOLDER}
                  alt={book.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="space-y-2 text-right">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-black text-foreground sm:text-xl leading-none">
                    {book.title}
                  </h1>
                  <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                    تکه‌های کتاب
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  اثر {book.author}
                </p>
              </div>
            </div>

            {total > 0 && (
              <div className="text-right sm:text-left">
                <span className="inline-flex h-6 items-center rounded-full bg-foreground/[0.045] px-3.5 text-[11px] font-bold text-muted-foreground border border-border/40">
                  {total.toLocaleString("fa-IR")} تکه منتشر شده
                </span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <BookQuotesSection
              variant="all"
              subjectBookId={book.id}
              viewerEntryId={viewerEntryId}
              viewerIsAdmin={isAdmin(viewer)}
              isLoggedIn={isLoggedIn}
              quotes={quotes}
              totalQuoteCount={total}
              initialHasMore={initialHasMore}
            />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}

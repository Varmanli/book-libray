import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getBookQuotesPage } from "@/lib/book/detail-service";
import PublicShell from "@/components/PublicShell";
import BookCoverImage from "@/components/books/BookCoverImage";
import BookQuotesSection from "@/components/books/BookQuotesSection";

export const dynamic = "force-dynamic";

const PLACEHOLDER = "/placeholder-cover.svg";

export default async function BookQuotesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ref = decodeURIComponent(id);
  const viewer = await getCurrentUser();
  const result = await getBookQuotesPage(ref, viewer?.id);

  if (!result.found) notFound();

  const { book, quotes, viewerEntryId } = result;
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
            isLoggedIn={isLoggedIn}
            quotes={quotes}
          />
        </div>
      </div>
    </PublicShell>
  );
}

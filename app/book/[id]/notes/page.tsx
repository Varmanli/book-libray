import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowRight, NotebookPen } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { getBookDetail } from "@/lib/book/detail-service";
import { buildPageMetadata } from "@/lib/seo/metadata";
import PublicShell from "@/components/PublicShell";
import BookEditionSelector from "@/components/books/BookEditionSelector";
import BookNotesTabsSection from "@/components/books/BookNotesTabsSection";
import ReferenceChip from "@/components/books/ReferenceChip";

export const dynamic = "force-dynamic";

const PLACEHOLDER = "/placeholder-cover.svg";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getBookDetail(decodeURIComponent(id));

  if (!result.found) {
    return { title: "یادداشت‌های کتاب | قفسه" };
  }

  const { book } = result;

  return buildPageMetadata({
    title: `یادداشت‌های کتاب ${book.title}`,
    description: `یادداشت‌ها و برداشت‌های عمومی کاربران درباره کتاب ${book.title} در قفسه.`,
    path: `/book/${encodeURIComponent(book.slug)}/notes`,
    image: book.coverImage,
    type: "book",
    keywords: [book.title, book.author, "یادداشت کتاب", "نقد و نظر کاربران"],
  });
}

export default async function BookNotesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edition?: string }>;
}) {
  const { id } = await params;
  const { edition } = await searchParams;

  const ref = decodeURIComponent(id);
  const viewer = await getCurrentUser();
  const result = await getBookDetail(ref, viewer?.id, edition ?? null);

  if (!result.found) notFound();

  const {
    book,
    selectedEdition,
    editions,
    authorChip,
    bookNotes,
    editionNotes,
  } = result;

  if (ref !== book.slug) {
    permanentRedirect(`/book/${encodeURIComponent(book.slug)}/notes`);
  }

  const isLoggedIn = !!viewer;
  const loginHref = `/auth/login?redirect=/book/${encodeURIComponent(book.slug)}/notes`;

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        <Link
          href={`/book/${encodeURIComponent(book.slug)}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به صفحه کتاب
        </Link>

        <section className="mt-4 overflow-hidden rounded-[2rem] border border-border/80 bg-card/70 p-4 shadow-[0_24px_70px_-48px_rgba(0,0,0,0.45)] backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-background/40 sm:w-20">
                <Image
                  src={book.coverImage || PLACEHOLDER}
                  alt={book.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                  <NotebookPen className="h-3.5 w-3.5" />
                  یادداشت‌ها
                </div>

                <h1 className="mt-3 text-xl font-black tracking-tight text-foreground sm:text-2xl">
                  {book.title}
                </h1>

                {book.originalTitle ? (
                  <p dir="ltr" className="mt-1 text-sm text-muted-foreground">
                    {book.originalTitle}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ReferenceChip
                    name={authorChip.name}
                    href={authorChip.href}
                    image={authorChip.image}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {editions.length > 1 ? (
              <div className="w-full max-w-sm sm:w-[320px]">
                <BookEditionSelector
                  editions={editions}
                  selectedEditionId={selectedEdition?.id ?? null}
                />
              </div>
            ) : null}
          </div>
        </section>

        <div className="mt-8">
          <BookNotesTabsSection
            catalogBookId={book.id}
            selectedEditionId={selectedEdition?.id ?? null}
            isLoggedIn={isLoggedIn}
            bookNotes={bookNotes}
            editionNotes={editionNotes}
            viewerId={viewer?.id ?? null}
            loginHref={loginHref}
            title="یادداشت‌ها"
            editionSummary={
              selectedEdition
                ? {
                    label:
                      selectedEdition.editionLabel ??
                      selectedEdition.titleOverride ??
                      null,
                    publisher: selectedEdition.publisher,
                    translator: selectedEdition.translator,
                    publishedYear: selectedEdition.publishedYear,
                  }
                : null
            }
          />
        </div>
      </div>
    </PublicShell>
  );
}

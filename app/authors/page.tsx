import type { Metadata } from "next";

import PublicShell from "@/components/PublicShell";
import AuthorsArchivePage from "@/components/reference/AuthorsArchivePage";
import { searchReferencePage } from "@/lib/reference/service";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "نویسنده‌ها",
    description: "فهرست نویسنده‌ها و کتاب‌های مرتبط در قفسه.",
    path: "/authors",
  });
}

function firstOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = firstOf(resolvedSearchParams.q).trim();
  const result = await searchReferencePage("AUTHOR", q, {
    approvedOnly: true,
    page: 1,
    pageSize: 20,
  });

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <AuthorsArchivePage initialQuery={q} result={result} />
      </main>
    </PublicShell>
  );
}

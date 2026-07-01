import type { Metadata } from "next";

import PublicShell from "@/components/PublicShell";
import ReferenceArchivePage from "@/components/reference/ReferenceArchivePage";
import { searchReferencePage } from "@/lib/reference/service";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    title: "ناشرها",
    description: "فهرست ناشرهای عمومی و کتاب‌های مرتبط در قفسه.",
    path: "/publishers",
  });
}

function firstOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function PublishersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = firstOf(resolvedSearchParams.q).trim();
  const rawPage = Number(firstOf(resolvedSearchParams.page) || "1");
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.trunc(rawPage)) : 1;

  const result = await searchReferencePage("PUBLISHER", q, {
    approvedOnly: true,
    page,
    pageSize: 20,
  });

  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <ReferenceArchivePage
          initialQuery={q}
          result={result}
          routeBase="/publishers"
          searchPlaceholder="جستجو در ناشرها..."
          emptyTitle="ناشری پیدا نشد"
        />
      </main>
    </PublicShell>
  );
}

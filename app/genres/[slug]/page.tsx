import type { Metadata } from "next";

import ReferencePublicView, {
  buildReferenceMetadata,
} from "@/components/reference/ReferencePublicView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildReferenceMetadata("GENRE", slug);
}

export default async function GenrePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  return (
    <ReferencePublicView
      type="GENRE"
      slugParam={slug}
      searchParams={resolvedSearchParams}
    />
  );
}

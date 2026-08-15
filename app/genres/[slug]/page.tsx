import type { Metadata } from "next";

import { notFound, permanentRedirect } from "next/navigation";
import GenreLandingPage from "@/components/genre/GenreLandingPage";
import { getReferenceEntity } from "@/lib/reference/public-service";
import { getPublicGenreHref } from "@/lib/genre/paths";
import { buildReferenceMetadata } from "@/components/reference/ReferencePublicView";

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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const genre = await getReferenceEntity("GENRE", decodeURIComponent(slug));
  if (!genre) notFound();
  if (decodeURIComponent(slug) !== genre.slug) permanentRedirect(getPublicGenreHref(genre)!);
  return <GenreLandingPage genre={genre} />;
}

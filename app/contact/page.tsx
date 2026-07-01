import type { Metadata } from "next";

import PublicStaticPage from "@/components/layout/PublicStaticPage";
import { buildStaticPageMetadata } from "@/lib/static-pages/metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("contact");
}

export default function ContactPage() {
  return <PublicStaticPage slug="contact" />;
}

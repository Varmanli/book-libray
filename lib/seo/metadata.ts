import type { Metadata } from "next";

import { getSiteSettings } from "@/lib/settings/service";
import { getSiteMetadataBase, toAbsoluteUrl } from "@/lib/seo/site";

type PageMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  type?: "website" | "article" | "book" | "profile";
  keywords?: string[];
};

function normalizeDescription(description: string | null | undefined) {
  const value = description?.trim();
  if (!value) return undefined;
  return value.length <= 160 ? value : `${value.slice(0, 157)}...`;
}

export async function buildPageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  keywords = [],
}: PageMetadataInput): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteName = settings.siteName?.trim() || "قفسه";
  const resolvedTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const resolvedDescription =
    normalizeDescription(description) ||
    normalizeDescription(settings.seoDescription) ||
    normalizeDescription(settings.siteDescription) ||
    "قفسه، پلتفرم فارسی کشف کتاب و تجربه اجتماعی مطالعه.";
  const ogImage = toAbsoluteUrl(
    image?.trim() || settings.ogImageUrl?.trim() || "/og-image.png",
  );

  return {
    metadataBase: getSiteMetadataBase(),
    title: resolvedTitle,
    description: resolvedDescription,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      url: path,
      siteName,
      locale: "fa_IR",
      type,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [ogImage],
    },
  };
}

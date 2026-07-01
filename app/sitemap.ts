import type { MetadataRoute } from "next";
import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { BlogPost, CatalogBook, ReferenceItem, StaticPage } from "@/db/schema";
import { ensureCatalogBookSlug } from "@/lib/book/public-slug";
import { getSiteOrigin } from "@/lib/seo/site";

const STATIC_PUBLIC_ROUTES = [
  "",
  "/books",
  "/authors",
  "/translators",
  "/publishers",
  "/blog",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteOrigin = getSiteOrigin();

  const [catalogBooks, references, blogPosts, staticPages] = await Promise.all([
    db
      .select({
        id: CatalogBook.id,
        slug: CatalogBook.slug,
        title: CatalogBook.title,
        updatedAt: CatalogBook.updatedAt,
      })
      .from(CatalogBook)
      .where(eq(CatalogBook.status, "APPROVED")),
    db
      .select({
        type: ReferenceItem.type,
        slug: ReferenceItem.slug,
        updatedAt: ReferenceItem.updatedAt,
      })
      .from(ReferenceItem)
      .where(and(eq(ReferenceItem.status, "APPROVED"), isNotNull(ReferenceItem.slug))),
    db
      .select({
        slug: BlogPost.slug,
        updatedAt: BlogPost.updatedAt,
        publishedAt: BlogPost.publishedAt,
      })
      .from(BlogPost)
      .where(and(eq(BlogPost.status, "PUBLISHED"), isNotNull(BlogPost.publishedAt))),
    db
      .select({
        slug: StaticPage.slug,
        updatedAt: StaticPage.updatedAt,
      })
      .from(StaticPage)
      .where(eq(StaticPage.status, "PUBLISHED")),
  ]);

  const bookEntries = await Promise.all(
    catalogBooks.map(async (book) => ({
      url: `${siteOrigin}/book/${encodeURIComponent(
        await ensureCatalogBookSlug({
          id: book.id,
          title: book.title,
          slug: book.slug,
        }),
      )}`,
      lastModified: book.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  const referenceRouteByType = {
    AUTHOR: "authors",
    TRANSLATOR: "translators",
    PUBLISHER: "publishers",
    COUNTRY: "countries",
    GENRE: "genres",
  } as const;

  return [
    ...STATIC_PUBLIC_ROUTES.map((route) => ({
      url: `${siteOrigin}${route || "/"}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "daily" as const : "weekly" as const,
      priority: route === "" ? 1 : 0.7,
    })),
    ...bookEntries,
    ...references.map((item) => ({
      url: `${siteOrigin}/${referenceRouteByType[item.type]}/${encodeURIComponent(
        item.slug as string,
      )}`,
      lastModified: item.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...blogPosts.map((post) => ({
      url: `${siteOrigin}/blog/${encodeURIComponent(post.slug)}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...staticPages.map((page) => ({
      url: `${siteOrigin}/${encodeURIComponent(page.slug)}`,
      lastModified: page.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}

import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { CatalogBook } from "@/db/schema";
import { coalesceCoverImage } from "@/lib/book/cover";
import { preferredEditionFieldSql } from "@/lib/book/primary-edition";
export { extractBlogBookEmbedIds, splitBlogContentByEmbeds, type BlogContentPart } from "@/lib/blog/book-embed-content";

export type BlogBookEmbed = {
  id: string;
  slug: string | null;
  title: string;
  author: string;
  coverImage: string | null;
  publisher: string | null;
  translator: string | null;
};

/** Resolves all embeds for an article in one approved-catalog query. */
export async function resolveBlogBookEmbeds(bookIds: string[]) {
  const ids = [...new Set(bookIds.filter(Boolean))];
  if (!ids.length) return new Map<string, BlogBookEmbed>();

  const rows = await db
    .select({
      id: CatalogBook.id,
      slug: CatalogBook.slug,
      title: CatalogBook.title,
      author: CatalogBook.author,
      coverImage: CatalogBook.coverImage,
      editionCoverImage: preferredEditionFieldSql<string | null>("cover_image"),
      publisher: preferredEditionFieldSql<string | null>("publisher"),
      translator: preferredEditionFieldSql<string | null>("translator"),
    })
    .from(CatalogBook)
    .where(and(inArray(CatalogBook.id, ids), eq(CatalogBook.status, "APPROVED")));

  return new Map(
    rows.map((row) => [
      row.id,
      {
        ...row,
        coverImage: coalesceCoverImage(row.editionCoverImage, row.coverImage),
      },
    ]),
  );
}

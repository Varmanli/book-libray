import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { CatalogBook } from "@/db/schema";
import { displayCoverFieldSql } from "@/lib/book/display-cover";
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
      // Keep Magazine cards on the same cover-resolution path as normal
      // public book cards: primary approved edition → catalog → linked legacy
      // book.  Older catalog rows often only have the last of these populated.
      coverImage: displayCoverFieldSql(),
      publisher: preferredEditionFieldSql<string | null>("publisher"),
      translator: preferredEditionFieldSql<string | null>("translator"),
    })
    .from(CatalogBook)
    .where(and(inArray(CatalogBook.id, ids), eq(CatalogBook.status, "APPROVED")));

  return new Map(
    rows.map((row) => [
      row.id,
      row,
    ]),
  );
}

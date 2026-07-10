import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { BookEdition, CatalogBook } from "@/db/schema";
import {
  type AdminBookCoverListResult,
  type AdminBookCoverRow,
  type BulkCoverAmbiguousMatch,
  type BulkCoverMatch,
  type BulkCoverPreviewResult,
  COVER_RECENT_IMPORT_DAYS,
  COVER_UPLOAD_MAX_BYTES,
  COVER_UPLOAD_MAX_LABEL,
  type CoverStatus,
} from "@/lib/admin/book-covers.shared";
import { normalizeCoverImage } from "@/lib/book/cover";
import { getFilenameExtension, sanitizeFilename } from "@/lib/server/upload-key";

const COUNT = sql<number>`count(*)::int`;

function normalizeBaseForCompare(value: string) {
  return value
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeFilenameForCoverMatch(value: string | null | undefined) {
  return value ? normalizeBaseForCompare(value) : "";
}

function getManagedUploadPrefixes() {
  const prefixes: string[] = [];

  const s3PublicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/+$/, "");
  if (s3PublicBase) prefixes.push(`${s3PublicBase}/`);

  const endpoint = process.env.S3_ENDPOINT?.replace(/\/+$/, "");
  const bucket = process.env.S3_BUCKET?.trim();
  if (endpoint && bucket) prefixes.push(`${endpoint}/${bucket}/`);

  return prefixes;
}

export function isManagedCoverImage(value: string | null | undefined) {
  const normalized = normalizeCoverImage(value);
  if (!normalized) return false;

  return getManagedUploadPrefixes().some((prefix) =>
    normalized.startsWith(prefix),
  );
}

export function getCoverStatus(input: {
  coverImage: string | null;
  coverFilename: string | null;
}): CoverStatus {
  if (isManagedCoverImage(input.coverImage)) return "uploaded";
  if (!normalizeCoverImage(input.coverImage)) {
    return input.coverFilename ? "ready" : "missing";
  }
  return "unknown";
}

function mapCoverRow(row: {
  id: string;
  catalogBookId: string;
  catalogSlug: string | null;
  bookTitle: string;
  author: string;
  publisher: string | null;
  translator: string | null;
  isbn10: string | null;
  isbn13: string | null;
  sourceEditionCode: string | null;
  coverFilename: string | null;
  coverImage: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AdminBookCoverRow {
  return {
    ...row,
    coverImage: normalizeCoverImage(row.coverImage),
    coverStatus: getCoverStatus(row),
  };
}

function missingManagedCoverCondition(): SQL {
  const prefixes = getManagedUploadPrefixes();
  const internalLikeConds = prefixes.map(
    (prefix) => sql`${BookEdition.coverImage} ilike ${`${prefix}%`}`,
  );
  const hasInternalCover =
    internalLikeConds.length > 0
      ? or(...internalLikeConds)
      : sql`false`;

  return or(
    sql`${BookEdition.coverImage} is null`,
    sql`trim(${BookEdition.coverImage}) = ''`,
    sql`not (${hasInternalCover})`,
  ) as SQL;
}

export async function listAdminBookCovers(opts: {
  q?: string;
  onlyMissing?: boolean;
  recentOnly?: boolean;
  limit?: number;
  offset?: number;
}): Promise<AdminBookCoverListResult> {
  const conds = [];

  if (opts.q?.trim()) {
    const term = `%${opts.q.trim()}%`;
    conds.push(
      or(
        ilike(CatalogBook.title, term),
        ilike(CatalogBook.author, term),
        ilike(BookEdition.publisher, term),
        ilike(BookEdition.translator, term),
        ilike(BookEdition.isbn10, term),
        ilike(BookEdition.isbn13, term),
        ilike(BookEdition.sourceEditionCode, term),
        ilike(BookEdition.coverFilename, term),
      ),
    );
  }

  if (opts.onlyMissing) {
    conds.push(missingManagedCoverCondition());
  }

  if (opts.recentOnly) {
    const cutoff = new Date(
      Date.now() - COVER_RECENT_IMPORT_DAYS * 24 * 60 * 60 * 1000,
    );
    conds.push(sql`${BookEdition.createdAt} >= ${cutoff}`);
  }

  const where = conds.length ? and(...conds.filter(Boolean)) : undefined;
  const limit = Math.min(opts.limit ?? 24, 100);
  const offset = opts.offset ?? 0;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: BookEdition.id,
        catalogBookId: BookEdition.catalogBookId,
        catalogSlug: CatalogBook.slug,
        bookTitle: CatalogBook.title,
        author: CatalogBook.author,
        publisher: BookEdition.publisher,
        translator: BookEdition.translator,
        isbn10: BookEdition.isbn10,
        isbn13: BookEdition.isbn13,
        sourceEditionCode: BookEdition.sourceEditionCode,
        coverFilename: BookEdition.coverFilename,
        coverImage: BookEdition.coverImage,
        createdAt: BookEdition.createdAt,
        updatedAt: BookEdition.updatedAt,
      })
      .from(BookEdition)
      .innerJoin(CatalogBook, eq(BookEdition.catalogBookId, CatalogBook.id))
      .where(where)
      .orderBy(
        desc(BookEdition.createdAt),
        desc(sql`(${BookEdition.coverFilename} is not null)`),
        desc(CatalogBook.title),
      )
      .limit(limit)
      .offset(offset),
    db
      .select({ c: COUNT })
      .from(BookEdition)
      .innerJoin(CatalogBook, eq(BookEdition.catalogBookId, CatalogBook.id))
      .where(where),
  ]);

  return {
    items: rows.map(mapCoverRow),
    total: totalRow?.c ?? 0,
  };
}

export async function getAdminBookCoverEditionById(editionId: string) {
  const [row] = await db
    .select({
      id: BookEdition.id,
      catalogBookId: BookEdition.catalogBookId,
      catalogSlug: CatalogBook.slug,
      bookTitle: CatalogBook.title,
      author: CatalogBook.author,
      publisher: BookEdition.publisher,
      translator: BookEdition.translator,
      isbn10: BookEdition.isbn10,
      isbn13: BookEdition.isbn13,
      sourceEditionCode: BookEdition.sourceEditionCode,
      coverFilename: BookEdition.coverFilename,
      coverImage: BookEdition.coverImage,
      createdAt: BookEdition.createdAt,
      updatedAt: BookEdition.updatedAt,
    })
    .from(BookEdition)
    .innerJoin(CatalogBook, eq(BookEdition.catalogBookId, CatalogBook.id))
    .where(eq(BookEdition.id, editionId))
    .limit(1);

  return row ? mapCoverRow(row) : null;
}

export async function attachUploadedCoverToEdition(
  editionId: string,
  coverImage: string,
) {
  const [updated] = await db
    .update(BookEdition)
    .set({
      coverImage: normalizeCoverImage(coverImage),
      updatedAt: new Date(),
    })
    .where(eq(BookEdition.id, editionId))
    .returning({ id: BookEdition.id });

  if (!updated) {
    throw new Error("EDITION_NOT_FOUND");
  }
}

async function listCoverFilenameCandidates(opts?: { onlyMissing?: boolean }) {
  const conds = [
    sql`${BookEdition.coverFilename} is not null`,
    sql`trim(${BookEdition.coverFilename}) <> ''`,
  ];

  if (opts?.onlyMissing) {
    conds.push(missingManagedCoverCondition());
  }

  const rows = await db
    .select({
      id: BookEdition.id,
      catalogBookId: BookEdition.catalogBookId,
      catalogSlug: CatalogBook.slug,
      bookTitle: CatalogBook.title,
      author: CatalogBook.author,
      publisher: BookEdition.publisher,
      translator: BookEdition.translator,
      isbn10: BookEdition.isbn10,
      isbn13: BookEdition.isbn13,
      sourceEditionCode: BookEdition.sourceEditionCode,
      coverFilename: BookEdition.coverFilename,
      coverImage: BookEdition.coverImage,
      createdAt: BookEdition.createdAt,
      updatedAt: BookEdition.updatedAt,
    })
    .from(BookEdition)
    .innerJoin(CatalogBook, eq(BookEdition.catalogBookId, CatalogBook.id))
    .where(and(...conds.filter(Boolean)))
    .orderBy(desc(BookEdition.createdAt));

  return rows.map(mapCoverRow);
}

export async function previewBulkCoverMatches(
  filenames: string[],
  opts?: { onlyMissing?: boolean },
): Promise<BulkCoverPreviewResult> {
  const editions = await listCoverFilenameCandidates(opts);
  const editionMap = new Map<string, AdminBookCoverRow[]>();

  for (const edition of editions) {
    const key = normalizeFilenameForCoverMatch(edition.coverFilename);
    if (!key) continue;
    const bucket = editionMap.get(key) ?? [];
    bucket.push(edition);
    editionMap.set(key, bucket);
  }

  const matches: BulkCoverMatch[] = [];
  const unmatchedFiles: string[] = [];
  const ambiguousFiles: BulkCoverAmbiguousMatch[] = [];

  for (const filename of filenames) {
    const normalizedFilename = normalizeFilenameForCoverMatch(filename);
    if (!normalizedFilename) {
      unmatchedFiles.push(filename);
      continue;
    }

    const matchedEditions = editionMap.get(normalizedFilename) ?? [];
    if (matchedEditions.length === 1) {
      matches.push({
        filename,
        normalizedFilename,
        matchType: "exact",
        edition: matchedEditions[0],
      });
      continue;
    }

    if (matchedEditions.length > 1) {
      ambiguousFiles.push({
        filename,
        normalizedFilename,
        editions: matchedEditions,
      });
      continue;
    }

    unmatchedFiles.push(filename);
  }

  return { matches, unmatchedFiles, ambiguousFiles };
}

export function buildEditionCoverUploadFilename(input: {
  fileName: string;
  preferredFilename?: string | null;
  bookTitle: string;
  publisher?: string | null;
  translator?: string | null;
  createdAt?: Date;
}) {
  const extension = getFilenameExtension(input.fileName) || ".jpg";
  const now = input.createdAt ?? new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");

  const preferred = input.preferredFilename?.trim();
  const fallbackBase = [
    input.bookTitle,
    input.publisher,
    input.translator,
    String(Date.now()),
  ]
    .filter(Boolean)
    .join("-");

  const baseName = preferred
    ? preferred.replace(/\.[a-z0-9]+$/i, "")
    : fallbackBase;

  const safeName = sanitizeFilename(baseName);
  return `covers/book-covers/${year}/${month}/${safeName}${extension}`;
}

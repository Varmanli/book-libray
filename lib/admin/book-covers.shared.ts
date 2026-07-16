export type CoverStatus = "missing" | "ready" | "uploaded" | "unknown";

export interface AdminBookCoverRow {
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
  catalogCoverImage?: string | null;
  coverStatus: CoverStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminBookCoverListResult {
  items: AdminBookCoverRow[];
  total: number;
}

export interface BulkCoverMatch {
  filename: string;
  normalizedFilename: string;
  matchType: "exact";
  edition: AdminBookCoverRow;
}

export interface BulkCoverAmbiguousMatch {
  filename: string;
  normalizedFilename: string;
  editions: AdminBookCoverRow[];
}

export interface BulkCoverPreviewResult {
  matches: BulkCoverMatch[];
  unmatchedFiles: string[];
  ambiguousFiles: BulkCoverAmbiguousMatch[];
}

export const COVER_UPLOAD_MAX_BYTES = 2 * 1024 * 1024;
export const COVER_UPLOAD_MAX_LABEL = "۲ مگابایت";
export const COVER_RECENT_IMPORT_DAYS = 30;

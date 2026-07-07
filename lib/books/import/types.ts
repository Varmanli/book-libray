import type { ImportReferenceInput, ReferenceResolutionStatus } from "@/lib/reference/service";

export type ImportStatus = "pending" | "approved" | "rejected";

export type NormalizedImportReference = {
  id?: string;
  name: string;
  originalName?: string | null;
  slug?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  website?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceId?: string | null;
  status?: ImportStatus;
};

export type ImportEditionInput = {
  titleOverride?: string | null;
  translators: ImportReferenceInput[];
  publisher?: ImportReferenceInput | null;
  isbn10?: string | null;
  isbn13?: string | null;
  publishedYear?: number | null;
  pageCount?: number | null;
  coverFilename?: string | null;
  coverUrl?: string | null;
  editionDescription?: string | null;
  status: ImportStatus;
  sourceName?: string | null;
  sourceUrl?: string | null;
  sourceEditionCode?: string | null;
};

export type ImportBookInput = {
  rowNumbers: number[];
  title: string;
  subtitle?: string | null;
  originalTitle?: string | null;
  authors: ImportReferenceInput[];
  language: string;
  description?: string | null;
  genres: ImportReferenceInput[];
  country?: ImportReferenceInput | null;
  firstPublishedYear?: number | null;
  status: ImportStatus;
  sourceName?: string | null;
  sourceUrl?: string | null;
  editions: ImportEditionInput[];
};

export type ReferencePreviewSummary = {
  created: number;
  reused: number;
  updated: number;
};

export type ImportPreviewEdition = Omit<ImportEditionInput, "translators" | "publisher"> & {
  rowNumber: number;
  translators: NormalizedImportReference[];
  publisher?: NormalizedImportReference | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicateState: "none" | "existing_edition" | "file_duplicate";
  duplicateMessage?: string;
  referenceSummary: ReferencePreviewSummary;
};

export type ImportPreviewBook = Omit<
  ImportBookInput,
  "authors" | "genres" | "country" | "editions"
> & {
  authors: NormalizedImportReference[];
  genres: NormalizedImportReference[];
  country?: NormalizedImportReference | null;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  duplicateState: "none" | "possible_existing_book" | "existing_book";
  duplicateMessage?: string;
  referenceSummary: ReferencePreviewSummary;
  editions: ImportPreviewEdition[];
};

export type ImportPreviewResponse = {
  validCount: number;
  invalidCount: number;
  summary: {
    totalBooks: number;
    totalEditions: number;
    validBooks: number;
    invalidBooks: number;
    duplicateBooks: number;
    duplicateEditions: number;
    readyBooks: number;
    readyEditions: number;
  };
  books: ImportPreviewBook[];
};

export type ImportResultResponse = {
  receivedBooks: number;
  receivedEditions: number;
  validBooks: number;
  validEditions: number;
  importedCount: number;
  skippedCount: number;
  skippedBooks: number;
  skippedEditions: number;
  invalidCount: number;
  invalidBooks: number;
  createdBooks: number;
  updatedBooks: number;
  reusedBooks: number;
  createdEditions: number;
  updatedEditions: number;
  skippedDuplicateEditions: number;
  failedBooks: number;
  failedEditions: number;
  referenceItems: ReferencePreviewSummary;
  errors: string[];
};

export type NormalizedImportEdition = Omit<ImportEditionInput, "translators" | "publisher"> & {
  rowNumber: number;
  translators: NormalizedImportReference[];
  publisher?: NormalizedImportReference | null;
};

export type NormalizedImportBook = Omit<
  ImportBookInput,
  "authors" | "genres" | "country" | "editions"
> & {
  authors: NormalizedImportReference[];
  genres: NormalizedImportReference[];
  country?: NormalizedImportReference | null;
  editions: NormalizedImportEdition[];
};

export type ExistingBookMatch = {
  id: string;
  title: string;
  author: string;
  originalTitle: string | null;
  matchType: "existing_book" | "possible_existing_book";
};

export type ExistingEditionDuplicate = {
  id: string;
  catalogBookId: string;
  isbn10: string | null;
  isbn13: string | null;
};

export type ReferenceResolutionMap = Map<string, ReferenceResolutionStatus>;

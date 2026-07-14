export type GhafasehCountry = {
  name: string;
  originalName: string | null;
  slug: string;
};

export type GhafasehGenre = {
  name: string;
  slug: string;
};

export type GhafasehAuthor = {
  name: string;
  originalName: string | null;
  slug: string;
  country: GhafasehCountry | null;
};

export type GhafasehPublisher = {
  name: string;
  slug: string;
};

export type GhafasehEdition = {
  titleOverride: string;
  translators: GhafasehAuthor[];
  publisher: GhafasehPublisher;
  isbn10: null;
  isbn13: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  coverFilename: string;
  coverUrl: null;
  editionDescription: string | null;
  status: "approved";
  sourceName: "iranketab";
  sourceUrl: string;
  sourceEditionCode: string;
};

export type GhafasehBookImport = {
  title: string;
  subtitle: string | null;
  originalTitle: string | null;
  authors: GhafasehAuthor[];
  language: "fa";
  description: string | null;
  genres: GhafasehGenre[];
  country: GhafasehCountry | null;
  firstPublishedYear: number | null;
  status: "approved";
  sourceName: "iranketab";
  sourceUrl: string;
  editions: GhafasehEdition[];
};

export type GhafasehReferenceProfileType = "AUTHOR" | "TRANSLATOR" | "PUBLISHER";

export type DescriptionCompleteness = "full" | "partial" | "missing";

export type GhafasehReferenceProfileBase = {
  type: GhafasehReferenceProfileType;
  name: string;
  originalName: string | null;
  slug: string;
  country: GhafasehCountry | null;
  description: string | null;
  shortDescription: string | null;
  imageFilename: string;
  imageUrl: null;
  sourceName: "iranketab" | "manual";
  sourceUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  needsReview?: boolean;
};

export type GhafasehAuthorProfile = GhafasehReferenceProfileBase & {
  type: "AUTHOR";
  birthYear: number | null;
  deathYear: number | null;
};

export type GhafasehTranslatorProfile = GhafasehReferenceProfileBase & {
  type: "TRANSLATOR";
  birthYear: number | null;
  deathYear: number | null;
};

export type GhafasehPublisherProfile = GhafasehReferenceProfileBase & {
  type: "PUBLISHER";
  website: string | null;
};

export type GhafasehReferenceProfile =
  | GhafasehAuthorProfile
  | GhafasehTranslatorProfile
  | GhafasehPublisherProfile;

export type ProfileReportStatus = "created" | "skipped_existing" | "failed" | "needs_review";

export type ProfileReportItem = {
  type: GhafasehReferenceProfileType;
  name: string;
  slug: string;
  sourceUrl: string | null;
  profileJsonPath: string | null;
  imagePath: string | null;
  descriptionCompleteness: DescriptionCompleteness;
  status: ProfileReportStatus;
  warnings: string[];
};

export type ProfileReportSummary = {
  authors: {
    created: number;
    skippedExisting: number;
    failed: number;
  };
  translators: {
    created: number;
    skippedExisting: number;
    failed: number;
  };
  publishers: {
    created: number;
    skippedExisting: number;
    failed: number;
  };
  items: ProfileReportItem[];
};

export type DedupeReportItem = {
  type: "dedupe";
  reason: "physical_or_print_variant" | "ambiguous";
  bookTitle: string;
  publisher: string;
  translators: string[];
  keptSourceEditionCode: string;
  removedSourceEditionCodes: string[];
};

export type BuildReport = {
  sourceUrl: string;
  outputJson: string;
  coversDir: string;
  bookTitle: string;
  bookSlug: string;
  editionsParsed: number;
  editionsAfterDedup: number;
  coversDownloaded: number;
  warnings: string[];
  deduplications: DedupeReportItem[];
  needsReview: string[];
  descriptionCompleteness: DescriptionCompleteness;
  profiles: ProfileReportSummary;
};

export type SummaryReport = {
  sourceUrl: string;
  bookTitle: string;
  bookSlug: string;
  outputJson: string;
  buildReport: string;
  downloadReport: string | null;
  editionsParsed: number;
  editionsAfterDedup: number;
  coverStatus: {
    downloaded: number;
    skippedExisting: number;
    failed: number;
    ambiguous: number;
    notFound: number;
  };
  descriptionCompleteness: DescriptionCompleteness;
  profiles: Omit<ProfileReportSummary, "items">;
};





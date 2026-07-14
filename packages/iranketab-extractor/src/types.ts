import type { DedupeReportItem, GhafasehCountry, GhafasehEdition, GhafasehReferenceProfileType } from "./contract.js";
import type { IranKetabCoverCandidate } from "./parse-images.js";

export type ParsedEditionSnapshot = {
  sourceEditionCode: string;
  titleRaw: string;
  titleOverride: string;
  publisher: string;
  translators: string[];
  isbn13: string | null;
  pageCount: number | null;
  publishedYear: number | null;
  votes: number;
  rating: number | null;
  selected: boolean;
  duplicateKey: string;
};

export type RelatedProfileCandidate = {
  type: GhafasehReferenceProfileType;
  name: string;
  slug: string;
  sourceUrl: string | null;
  originalName: string | null;
  country: GhafasehCountry | null;
};

export type EditionCleanupResult = {
  editions: GhafasehEdition[];
  deduplications: DedupeReportItem[];
  needsReview: string[];
  warnings: string[];
};

export type ExtractionWarning = { code: "PARSER_WARNING" | "REVIEW_REQUIRED"; message: string };

export type ExtractionDiagnostics = {
  descriptionCompleteness: "full" | "partial" | "missing";
  editionsParsed: number;
  editionsAfterDedup: number;
  parsedEditions: ParsedEditionSnapshot[];
  relatedProfiles: RelatedProfileCandidate[];
  coverCandidatesByEdition: Record<string, IranKetabCoverCandidate[]>;
};



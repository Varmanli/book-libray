import type { GhafasehBookImport } from "./contract.js";
import { dedupeNormalizedEditions } from "./dedupe-editions.js";
import { IranKetabExtractionError } from "./errors.js";
import { fetchIranKetabHtml, type IranKetabFetcher } from "./fetch-html.js";
import { normalizeBook, resolveBookSlug } from "./normalize-book.js";
import { normalizeEditions } from "./normalize-editions.js";
import { parseIranKetabBookPage } from "./parse-book.js";
import { extractIranKetabCoverCandidates } from "./parse-images.js";
import type { ExtractionDiagnostics, ExtractionWarning } from "./types.js";
import { enrichIranKetabReferenceProfiles } from "./reference-profile.js";
import { extractIranKetabEditionCode, normalizeIranKetabBookUrl } from "./validate-url.js";

export type ExtractIranKetabBookInput = { url: string; html?: string; fetcher?: IranKetabFetcher; profileFetcher?: IranKetabFetcher; enrichProfiles?: boolean; selectedOnly?: boolean; limit?: number; preferredSourceEditionCode?: string };
export type IranKetabExtractionEnvelope = { contractVersion: 1; source: { name: "IRANKETAB"; submittedUrl: string; canonicalUrl: string; editionCode: string | null }; book: GhafasehBookImport; editions: GhafasehBookImport["editions"]; warnings: ExtractionWarning[]; diagnostics: ExtractionDiagnostics };

export async function extractIranKetabBook(input: ExtractIranKetabBookInput): Promise<IranKetabExtractionEnvelope> {
  const canonicalUrl = normalizeIranKetabBookUrl(input.url);
  const editionCode = extractIranKetabEditionCode(input.url);
  const html = input.html ?? (await fetchIranKetabHtml(input.url, input.fetcher)).html;
  try {
    const parsed = parseIranKetabBookPage({ html, pageUrl: canonicalUrl, selectedEditionCode: editionCode, selectedOnly: input.selectedOnly ?? false, limit: input.limit });
    if (!parsed.book.title) throw new IranKetabExtractionError({ code: "BOOK_TITLE_MISSING", message: "The IranKetab page does not contain a book title." });
    const normalizedBook = normalizeBook(parsed.book);
    const normalizedEditions = normalizeEditions(normalizedBook, resolveBookSlug(normalizedBook));
    const deduped = dedupeNormalizedEditions(normalizedEditions, parsed.parsedEditions, { preferredSourceEditionCode: input.preferredSourceEditionCode });
    const book = { ...normalizedBook, editions: sortFinalEditions(deduped.editions, parsed.parsedEditions, input.preferredSourceEditionCode) };
    const warnings: ExtractionWarning[] = [
      ...parsed.warnings.map(message => ({ code: "PARSER_WARNING" as const, message })),
      ...deduped.warnings.map(message => ({ code: "PARSER_WARNING" as const, message })),
      ...[...new Set([...parsed.needsReview, ...deduped.needsReview])].map(message => ({ code: "REVIEW_REQUIRED" as const, message }))
    ];
    const coverCandidatesByEdition = Object.fromEntries(book.editions.map(edition => [edition.sourceEditionCode, extractIranKetabCoverCandidates({ html, pageUrl: canonicalUrl, editionCode: edition.sourceEditionCode })]));
    const relatedProfiles = input.enrichProfiles ? await enrichIranKetabReferenceProfiles({ profiles: parsed.relatedProfiles, fetcher: input.profileFetcher ?? input.fetcher }) : parsed.relatedProfiles;
    return { contractVersion: 1, source: { name: "IRANKETAB", submittedUrl: input.url, canonicalUrl, editionCode }, book, editions: book.editions, warnings, diagnostics: { descriptionCompleteness: parsed.descriptionCompleteness, editionsParsed: parsed.editionsParsed, editionsAfterDedup: book.editions.length, parsedEditions: parsed.parsedEditions, relatedProfiles, coverCandidatesByEdition } };
  } catch (cause) {
    if (cause instanceof IranKetabExtractionError) throw cause;
    throw new IranKetabExtractionError({ code: "PARSE_FAILED", message: "Failed to parse the IranKetab book page.", cause });
  }
}

function sortFinalEditions(
  editions: GhafasehBookImport["editions"],
  parsedEditions: { sourceEditionCode: string; selected: boolean; votes: number; publishedYear: number | null }[],
  primarySourceEditionCode?: string
): GhafasehBookImport["editions"] {
  const parsedByCode = new Map(parsedEditions.map(edition => [edition.sourceEditionCode, edition] as const));
  return [...editions].sort((left, right) => {
    if (primarySourceEditionCode) {
      if (left.sourceEditionCode === primarySourceEditionCode && right.sourceEditionCode !== primarySourceEditionCode) return -1;
      if (right.sourceEditionCode === primarySourceEditionCode && left.sourceEditionCode !== primarySourceEditionCode) return 1;
    }
    const leftSnapshot = parsedByCode.get(left.sourceEditionCode);
    const rightSnapshot = parsedByCode.get(right.sourceEditionCode);
    if ((leftSnapshot?.selected ?? false) !== (rightSnapshot?.selected ?? false)) return (rightSnapshot?.selected ? 1 : 0) - (leftSnapshot?.selected ? 1 : 0);
    if ((leftSnapshot?.votes ?? 0) !== (rightSnapshot?.votes ?? 0)) return (rightSnapshot?.votes ?? 0) - (leftSnapshot?.votes ?? 0);
    return (right.publishedYear ?? 0) - (left.publishedYear ?? 0);
  });
}


import type { IranKetabExtractionEnvelope } from "@ghafaseh/iranketab-extractor";
import { sanitizeRichTextHtml } from "@/lib/content/rich-text";

const TRUSTED_COVER_HOSTS = new Set(["iranketab.ir", "www.iranketab.ir", "img.iranketab.ir"]);

export type AdminIranKetabPreview = ReturnType<typeof buildAdminIranKetabPreview>;

export function buildAdminIranKetabPreview(extraction: IranKetabExtractionEnvelope) {
  const missing = new Set<string>();
  if (!extraction.book.description) missing.add("توضیحات کتاب");
  if (!extraction.book.originalTitle) missing.add("عنوان اصلی");
  if (!extraction.book.authors.length) missing.add("نویسنده");
  const editions = extraction.editions.map(edition => {
    if (!edition.isbn10 && !edition.isbn13) missing.add(`شابک نسخه ${edition.sourceEditionCode}`);
    const coverCandidate = extraction.diagnostics.coverCandidatesByEdition[edition.sourceEditionCode]?.find(candidate => isTrustedCoverUrl(candidate.url))?.url ?? null;
    if (!coverCandidate) missing.add(`کاور نسخه ${edition.sourceEditionCode}`);
    return { titleOverride: edition.titleOverride || null, translators: edition.translators.map(item => item.name), publisher: edition.publisher.name || null, isbn10: edition.isbn10, isbn13: edition.isbn13, publishedYear: edition.publishedYear, pageCount: edition.pageCount, sourceEditionCode: edition.sourceEditionCode, sourceUrl: edition.sourceUrl, description: edition.editionDescription, coverCandidate };
  });
  return {
    catalog: { title: extraction.book.title, subtitle: extraction.book.subtitle, originalTitle: extraction.book.originalTitle, authors: extraction.book.authors.map(item => item.name), sanitizedDescriptionHtml: sanitizeRichTextHtml(extraction.book.description), genres: extraction.book.genres.map(item => item.name), country: extraction.book.country?.name ?? null, language: extraction.book.language, firstPublishedYear: extraction.book.firstPublishedYear, canonicalUrl: extraction.source.canonicalUrl, selectedEditionCode: extraction.source.editionCode },
    editions,
    diagnostics: { editionsBeforeDeduplication: extraction.diagnostics.editionsParsed, editionsAfterDeduplication: extraction.diagnostics.editionsAfterDedup, selectedEditionCode: extraction.source.editionCode, warningCount: extraction.warnings.length, warnings: extraction.warnings.map(item => item.message), missingFields: [...missing] }
  };
}

export function isTrustedCoverUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password && !url.port && TRUSTED_COVER_HOSTS.has(url.hostname.toLowerCase()) && (/^\/Images\/ProductImages\//i.test(url.pathname) || /^\/Files\/AttachFiles\//i.test(url.pathname)); } catch { return false; }
}

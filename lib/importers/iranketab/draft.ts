import { z } from "zod";
import { normalizeIsbn } from "@/lib/books/import/isbn";
import type { IranKetabExtractionEnvelope } from "@ghafaseh/iranketab-extractor";
import type { IranKetabMatchAnalysis } from "./match-analysis";
import { isValidIsbn } from "./hardening";
import { boundedArray, formatIranKetabSchemaIssues, IRANKETAB_COLLECTION_LIMITS as LIMITS } from "./collection-limits";

const entityType = z.enum([
  "AUTHOR",
  "TRANSLATOR",
  "PUBLISHER",
  "GENRE",
  "COUNTRY",
]);
const entityDraft = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("REUSE_EXISTING"),
    entityType,
    entityId: z.string().min(1),
    extractedName: z.string(),
    displayName: z.string().min(1),
  }),
  z.object({
    action: z.literal("CREATE_NEW"),
    entityType,
    extractedName: z.string(),
    proposedName: z.string().min(1).max(200),
  }),
  z.object({
    action: z.literal("UNRESOLVED"),
    entityType,
    extractedName: z.string(),
    reason: z.string().min(1),
  }),
]);
const coverAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("KEEP_EXISTING") }),
  z.object({
    action: z.literal("IMPORT_SOURCE"),
    candidateUrl: z.string().url(),
  }),
  z.object({ action: z.literal("SKIP") }),
]);
const catalogFieldAction = z.object({
  field: z.enum([
    "subtitle",
    "originalTitle",
    "description",
    "language",
    "firstPublishedYear",
  ]),
  action: z.enum([
    "KEEP_EXISTING",
    "FILL_IF_EMPTY",
    "USE_SOURCE",
    "USE_CUSTOM",
  ]),
  customValue: z.unknown().optional(),
});
const editionFieldAction = z.object({
  field: z.enum([
    "titleOverride",
    "publisher",
    "translators",
    "isbn10",
    "isbn13",
    "publishedYear",
    "pageCount",
    "editionDescription",
  ]),
  action: z.enum([
    "KEEP_EXISTING",
    "FILL_IF_EMPTY",
    "USE_SOURCE",
    "USE_CUSTOM",
  ]),
  customValue: z.unknown().optional(),
});
const catalogFields = z.object({
  title: z.string().trim().min(1).max(500),
  subtitle: z.string().nullable(),
  originalTitle: z.string().nullable(),
  description: z.string().nullable(),
  language: z.string().min(1).max(50),
  firstPublishedYear: z.number().int().min(0).max(3000).nullable(),
});
const editionFields = z.object({
  titleOverride: z.string().nullable(),
  isbn10: z.string().nullable(),
  isbn13: z.string().nullable(),
  publishedYear: z.number().int().min(0).max(3000).nullable(),
  pageCount: z.number().int().positive().max(100000).nullable(),
  editionDescription: z.string().nullable(),
  sourceEditionCode: z.string().min(1),
  sourceUrl: z.string().url(),
});
const approvedCoverCandidateUrls = z.preprocess(
  (value) => Array.isArray(value) ? [...new Set(value)] : value,
  boundedArray(z.string().url(), "نشانی‌های یکتای کاور", LIMITS.approvedCoverCandidateUrls),
);

export const iranKetabImportDraftSchema = z.object({
  draftVersion: z.literal(1),
  source: z.object({
    contractVersion: z.literal(1),
    submittedUrl: z.string().url(),
    canonicalUrl: z.string().url(),
    selectedEditionCode: z.string().nullable(),
    approvedCoverCandidateUrls,
  }),
  catalog: z.discriminatedUnion("action", [
    z.object({
      action: z.literal("CREATE_NEW"),
      fields: catalogFields,
      authors: boundedArray(entityDraft, "نویسندگان", LIMITS.authors).refine((items) => items.length > 0, "حداقل یک نویسنده الزامی است."),
      genres: boundedArray(entityDraft, "ژانرها", LIMITS.genres),
      country: entityDraft.nullable(),
    }),
    z.object({
      action: z.literal("REUSE_EXISTING"),
      catalogId: z.string().min(1),
      fieldActions: boundedArray(catalogFieldAction, "تصمیم‌های فیلد کتاب", LIMITS.catalogFieldActions).refine((items) => items.length >= 5, "پنج تصمیم فیلد کتاب الزامی است."),
      authors: boundedArray(entityDraft, "نویسندگان", LIMITS.authors).refine((items) => items.length > 0, "حداقل یک نویسنده الزامی است."),
      genres: boundedArray(entityDraft, "ژانرها", LIMITS.genres),
      country: entityDraft.nullable(),
    }),
  ]),
  editions: boundedArray(
    z.discriminatedUnion("action", [
      z.object({
        extractedEditionIndex: z.number().int().nonnegative(),
        action: z.literal("EXCLUDE"),
        reason: z.string().optional(),
      }),
      z.object({
        extractedEditionIndex: z.number().int().nonnegative(),
        action: z.literal("CREATE_NEW"),
        fields: editionFields,
        translators: boundedArray(entityDraft, "مترجمان نسخه", LIMITS.translators),
        publisher: entityDraft.nullable(),
        coverAction,
      }),
      z.object({
        extractedEditionIndex: z.number().int().nonnegative(),
        action: z.literal("REUSE_EXISTING"),
        editionId: z.string().min(1),
        fieldActions: boundedArray(editionFieldAction, "تصمیم‌های فیلد نسخه", LIMITS.editionFieldActions),
        translators: boundedArray(entityDraft, "مترجمان نسخه", LIMITS.translators),
        publisher: entityDraft.nullable(),
        coverAction,
      }),
    ]),
    "نسخه‌های بررسی‌شده",
    LIMITS.editions,
  ),
  entities: boundedArray(entityDraft, "مراجع استخراج‌شده", LIMITS.entities),
  unresolvedIssues: boundedArray(
    z.object({ id: z.string(), message: z.string(), blocking: z.boolean() }),
    "موارد نیازمند بررسی",
    LIMITS.unresolvedIssues,
  ),
  readiness: z.enum([
    "READY_FOR_COVER_IMPORT",
    "REQUIRES_CATALOG_DECISION",
    "REQUIRES_ENTITY_RESOLUTION",
    "REQUIRES_EDITION_RESOLUTION",
    "BLOCKED_BY_CONFLICT",
    "INVALID_DRAFT",
  ]),
});
export type IranKetabImportDraft = z.infer<typeof iranKetabImportDraftSchema>;

export function initializeIranKetabDraft(
  extraction: IranKetabExtractionEnvelope,
  analysis: IranKetabMatchAnalysis,
): IranKetabImportDraft {
  const resolve = (type: z.infer<typeof entityType>, name: string) => {
    const found = analysis.entities.find(
      (item) => item.type === type && item.extractedName === name,
    );
    return found?.candidate
      ? {
          action: "REUSE_EXISTING" as const,
          entityType: type,
          entityId: found.candidate.id,
          extractedName: name,
          displayName: found.candidate.name,
        }
      : {
          action: "CREATE_NEW" as const,
          entityType: type,
          extractedName: name,
          proposedName: name,
        };
  };
  const authors = extraction.book.authors.map((item) =>
    resolve("AUTHOR", item.name),
  );
  const genres = extraction.book.genres.map((item) =>
    resolve("GENRE", item.name),
  );
  const country = extraction.book.country
    ? resolve("COUNTRY", extraction.book.country.name)
    : null;
  const selected = analysis.catalog.selected;
  return {
    draftVersion: 1,
    source: {
      contractVersion: 1,
      submittedUrl: extraction.source.submittedUrl,
      canonicalUrl: extraction.source.canonicalUrl,
      selectedEditionCode: extraction.source.editionCode,
      approvedCoverCandidateUrls: [...new Set(Object.values(
        extraction.diagnostics.coverCandidatesByEdition,
      )
        .flat()
        .map((item) => item.url))],
    },
    catalog: selected
      ? {
          action: "REUSE_EXISTING",
          catalogId: selected.id,
          fieldActions: [
            "subtitle",
            "originalTitle",
            "description",
            "language",
            "firstPublishedYear",
          ].map((field) => ({
            field: field as z.infer<typeof catalogFieldAction>["field"],
            action: "KEEP_EXISTING" as const,
          })),
          authors,
          genres,
          country,
        }
      : {
          action: "CREATE_NEW",
          fields: {
            title: extraction.book.title,
            subtitle: extraction.book.subtitle,
            originalTitle: extraction.book.originalTitle,
            description: extraction.book.description,
            language: extraction.book.language,
            firstPublishedYear: extraction.book.firstPublishedYear,
          },
          authors,
          genres,
          country,
        },
    editions: extraction.editions.map((edition, index) => {
      const match = analysis.editions[index];
      const translators = edition.translators.map((item) =>
        resolve("TRANSLATOR", item.name),
      );
      const publisher = edition.publisher.name
        ? resolve("PUBLISHER", edition.publisher.name)
        : null;
      const candidate =
        extraction.diagnostics.coverCandidatesByEdition[
          edition.sourceEditionCode
        ]?.[0]?.url;
      const coverAction =
        match?.status === "EXACT_MATCH"
          ? { action: "KEEP_EXISTING" as const }
          : candidate
            ? { action: "IMPORT_SOURCE" as const, candidateUrl: candidate }
            : { action: "SKIP" as const };
      if (match?.status === "EXACT_MATCH" && match.existingEditionId)
        return {
          extractedEditionIndex: index,
          action: "REUSE_EXISTING" as const,
          editionId: match.existingEditionId,
          fieldActions: [
            "titleOverride",
            "publisher",
            "translators",
            "isbn10",
            "isbn13",
            "publishedYear",
            "pageCount",
            "editionDescription",
          ].map((field) => ({
            field: field as z.infer<typeof editionFieldAction>["field"],
            action: "KEEP_EXISTING" as const,
          })),
          translators,
          publisher,
          coverAction,
        };
      if (match?.status === "CONFLICT" || match?.status === "INSUFFICIENT_DATA")
        return {
          extractedEditionIndex: index,
          action: "EXCLUDE" as const,
          reason: "نیازمند تصمیم دستی",
        };
      return {
        extractedEditionIndex: index,
        action: "CREATE_NEW" as const,
        fields: {
          titleOverride: edition.titleOverride || null,
          isbn10: edition.isbn10,
          isbn13: edition.isbn13,
          publishedYear: edition.publishedYear,
          pageCount: edition.pageCount,
          editionDescription: edition.editionDescription,
          sourceEditionCode: edition.sourceEditionCode,
          sourceUrl: edition.sourceUrl,
        },
        translators,
        publisher,
        coverAction,
      };
    }),
    entities: [
      ...authors,
      ...genres,
      ...(country ? [country] : []),
      ...extraction.editions.flatMap((item) => [
        ...item.translators.map((person) => resolve("TRANSLATOR", person.name)),
        ...(item.publisher.name
          ? [resolve("PUBLISHER", item.publisher.name)]
          : []),
      ]),
    ],
    unresolvedIssues: analysis.conflicts.map((item) => ({
      id: item.id,
      message: item.message,
      blocking: item.blocksImport,
    })),
    readiness: "INVALID_DRAFT",
  };
}

export function validateIranKetabDraft(
  draft: IranKetabImportDraft,
  allowedCoverUrls: Set<string>,
) {
  const parsed = iranKetabImportDraftSchema.safeParse(draft);
  const issues: string[] = [];
  if (!parsed.success)
    issues.push(...formatIranKetabSchemaIssues(parsed.error));
  const included = draft.editions.filter((item) => item.action !== "EXCLUDE");
  if (!included.length) issues.push("حداقل یک نسخه باید انتخاب شود.");
  const isbns = new Set<string>();
  const codes = new Set<string>();
  const reused = new Set<string>();
  const check = (items: z.infer<typeof entityDraft>[]) => {
    const keys = new Set<string>();
    for (const item of items) {
      const key =
        item.action === "REUSE_EXISTING"
          ? `${item.entityType}:id:${item.entityId}`
          : `${item.entityType}:name:${item.action === "CREATE_NEW" ? item.proposedName : item.extractedName}`;
      if (keys.has(key)) issues.push("یک مرجع بیش از یک‌بار انتخاب شده است.");
      keys.add(key);
      if (item.action === "UNRESOLVED")
        issues.push("برخی مراجع هنوز حل نشده‌اند.");
    }
  };
  check(draft.entities);
  if (
    draft.catalog.action === "CREATE_NEW" &&
    !draft.catalog.fields.title.trim()
  )
    issues.push("عنوان کتاب الزامی است.");
  for (const edition of included) {
    if (edition.action === "REUSE_EXISTING") {
      if (reused.has(edition.editionId))
        issues.push("یک نسخه موجود بیش از یک‌بار انتخاب شده است.");
      reused.add(edition.editionId);
    } else {
      for (const value of [edition.fields.isbn10, edition.fields.isbn13]) {
        const isbn = normalizeIsbn(value);
        if (isbn && !isValidIsbn(isbn)) issues.push("شابک نسخه معتبر نیست.");
        if (isbn) {
          if (isbns.has(isbn))
            issues.push("شابک تکراری بین نسخه‌های انتخاب‌شده وجود دارد.");
          isbns.add(isbn);
        }
      }
      if (codes.has(edition.fields.sourceEditionCode))
        issues.push("کد نسخه منبع تکراری است.");
      codes.add(edition.fields.sourceEditionCode);
    }
    check(edition.translators);
    if (edition.publisher) check([edition.publisher]);
    if (
      edition.coverAction.action === "IMPORT_SOURCE" &&
      !allowedCoverUrls.has(edition.coverAction.candidateUrl)
    )
      issues.push("URL کاور انتخاب‌شده از پیش‌نمایش امن منبع نیست.");
  }
  if (draft.unresolvedIssues.some((item) => item.blocking))
    issues.push("تعارض مسدودکننده هنوز حل نشده است.");
  return { valid: !issues.length, issues: [...new Set(issues)] };
}

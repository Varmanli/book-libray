import { z } from "zod";

export const IRANKETAB_COLLECTION_LIMITS = {
  editions: 500,
  approvedCoverCandidateUrls: 500,
  authors: 50,
  translators: 50,
  genres: 100,
  entities: 2_000,
  unresolvedIssues: 200,
  warnings: 200,
  candidatesPerEdition: 500,
  catalogFieldActions: 5,
  editionFieldActions: 8,
} as const;

export function boundedArray<T extends z.ZodTypeAny>(item: T, collectionName: string, maximum: number) {
  return z.array(item).superRefine((items, context) => {
    if (items.length > maximum) context.addIssue({
      code: "custom",
      message: `تعداد «${collectionName}» ${items.length.toLocaleString("fa-IR")} مورد است؛ حداکثر مجاز ${maximum.toLocaleString("fa-IR")} مورد است.`,
    });
  });
}

export function formatIranKetabSchemaIssues(error: z.ZodError) {
  return error.issues.map((issue) => `${issue.path.length ? issue.path.join(".") + ": " : ""}${issue.message}`);
}

type ExtractionCollections = {
  book: { authors: unknown[]; genres: unknown[] };
  editions: Array<{ translators: unknown[] }>;
  warnings: unknown[];
  diagnostics: { coverCandidatesByEdition: Record<string, unknown[]> };
};

export function extractionCollectionLimitIssues(extraction: ExtractionCollections) {
  const issues: string[] = [];
  const check = (name: string, count: number, maximum: number) => {
    if (count > maximum) issues.push(`تعداد «${name}» ${count.toLocaleString("fa-IR")} مورد است؛ حداکثر مجاز ${maximum.toLocaleString("fa-IR")} مورد است.`);
  };
  check("نسخه‌های استخراج‌شده", extraction.editions.length, IRANKETAB_COLLECTION_LIMITS.editions);
  check("نویسندگان", extraction.book.authors.length, IRANKETAB_COLLECTION_LIMITS.authors);
  check("ژانرها", extraction.book.genres.length, IRANKETAB_COLLECTION_LIMITS.genres);
  check("هشدارهای استخراج", extraction.warnings.length, IRANKETAB_COLLECTION_LIMITS.warnings);
  extraction.editions.forEach((edition, index) => check(`مترجمان نسخه ${index + 1}`, edition.translators.length, IRANKETAB_COLLECTION_LIMITS.translators));
  for (const [code, candidates] of Object.entries(extraction.diagnostics.coverCandidatesByEdition)) check(`نامزدهای کاور نسخه ${code}`, candidates.length, IRANKETAB_COLLECTION_LIMITS.candidatesPerEdition);
  return issues;
}

export function assertExtractionCollectionLimits(extraction: ExtractionCollections) {
  const issues = extractionCollectionLimitIssues(extraction);
  if (issues.length) throw new Error(issues.join(" "));
}

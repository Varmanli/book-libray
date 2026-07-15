import type { DedupeReportItem, GhafasehEdition } from "./contract.js";
import type { EditionCleanupResult, ParsedEditionSnapshot } from "./types.js";
import { normalizePersianText } from "./slug.js";

export function dedupeNormalizedEditions(
  editions: GhafasehEdition[],
  parsedEditions: ParsedEditionSnapshot[],
  options: {
    preferredSourceEditionCode?: string;
  } = {}
): EditionCleanupResult {
  const bySourceCode = new Map<string, GhafasehEdition>();
  const duplicateSourceCodes = new Set<string>();
  editions.forEach((edition, inputIndex) => {
    const previous = bySourceCode.get(edition.sourceEditionCode);
    if (previous) {
      duplicateSourceCodes.add(edition.sourceEditionCode);
      console.warn(JSON.stringify({
        event: "iranketab.duplicate_source_edition_before_physical_deduplication",
        sourceEditionCode: edition.sourceEditionCode,
        objects: [
          { inputIndex: editions.indexOf(previous), ...previous },
          { inputIndex, ...edition },
        ],
      }));
      return;
    }
    bySourceCode.set(edition.sourceEditionCode, edition);
  });
  const uniqueEditions = [...bySourceCode.values()];
  const groups = new Map<string, GhafasehEdition[]>();
  const parsedByCode = new Map(
    parsedEditions.map((edition) => [edition.sourceEditionCode, edition] as const)
  );

  for (const edition of uniqueEditions) {
    const key = [
      normalizePersianText(edition.titleOverride),
      edition.publisher.slug,
      edition.translators.map((translator) => translator.slug).sort().join(",")
    ].join("|");
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, edition]);
  }

  const finalEditions: GhafasehEdition[] = [];
  const deduplications: DedupeReportItem[] = [];

  for (const group of groups.values()) {
    const sorted = [...group].sort((left, right) =>
      compareEditionPriority(left, right, parsedByCode, options.preferredSourceEditionCode)
    );
    const kept = sorted[0];
    finalEditions.push(kept);

    if (group.length > 1) {
      deduplications.push({
        type: "dedupe",
        reason: "physical_or_print_variant",
        bookTitle: kept.titleOverride,
        publisher: kept.publisher.name,
        translators: kept.translators.map((translator) => translator.name),
        keptSourceEditionCode: kept.sourceEditionCode,
        removedSourceEditionCodes: sorted.slice(1).map((edition) => edition.sourceEditionCode)
      });
    }
  }

  const warnings = deduplications.map((item) =>
    `Deduplicated ${item.removedSourceEditionCodes.length} physical/print variant(s) for ${item.bookTitle} / ${item.publisher} / ${item.translators.join("، ")}. Kept sourceEditionCode=${item.keptSourceEditionCode}.`
  );
  return {
    editions: finalEditions,
    deduplications,
    warnings,
    needsReview: duplicateSourceCodes.size
      ? [`Duplicate source edition codes: ${[...duplicateSourceCodes].join(", ")}`]
      : []
  };
}

function compareEditionPriority(
  left: GhafasehEdition,
  right: GhafasehEdition,
  parsedByCode: Map<string, ParsedEditionSnapshot>,
  preferredSourceEditionCode?: string
): number {
  if (preferredSourceEditionCode) {
    if (left.sourceEditionCode === preferredSourceEditionCode && right.sourceEditionCode !== preferredSourceEditionCode) {
      return -1;
    }

    if (right.sourceEditionCode === preferredSourceEditionCode && left.sourceEditionCode !== preferredSourceEditionCode) {
      return 1;
    }
  }

  const leftSnapshot = parsedByCode.get(left.sourceEditionCode);
  const rightSnapshot = parsedByCode.get(right.sourceEditionCode);

  if ((leftSnapshot?.selected ?? false) !== (rightSnapshot?.selected ?? false)) {
    return (rightSnapshot?.selected ? 1 : 0) - (leftSnapshot?.selected ? 1 : 0);
  }

  if ((leftSnapshot?.votes ?? 0) !== (rightSnapshot?.votes ?? 0)) {
    return (rightSnapshot?.votes ?? 0) - (leftSnapshot?.votes ?? 0);
  }

  if ((right.publishedYear ?? 0) !== (left.publishedYear ?? 0)) {
    return (right.publishedYear ?? 0) - (left.publishedYear ?? 0);
  }

  const leftCompleteness = countMetadata(left);
  const rightCompleteness = countMetadata(right);
  if (rightCompleteness !== leftCompleteness) {
    return rightCompleteness - leftCompleteness;
  }

  return 0;
}

function countMetadata(edition: GhafasehEdition): number {
  return [
    edition.isbn13,
    edition.publishedYear,
    edition.pageCount,
    edition.editionDescription,
    edition.publisher.name,
    edition.translators.length > 0 ? edition.translators[0]?.name : null
  ].filter(Boolean).length;
}



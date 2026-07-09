export type EditionIdentityLike = {
  id: string;
  catalogBookId?: string;
};

export type EditionSetInvariantResult = {
  ok: boolean;
  beforeIds: string[];
  afterIds: string[];
  beforeCount: number;
  afterCount: number;
  missingIds: string[];
  addedIds: string[];
  duplicateIds: string[];
};

function sortedIds(editions: EditionIdentityLike[]) {
  return editions.map((edition) => edition.id).sort();
}

/**
 * Mutation responses must never be allowed to replace an edition list unless
 * they are unequivocally for the catalog book currently being edited.
 */
export function validatePrimaryEditionResponse(
  catalogBookId: string,
  response: {
    catalogBook?: { id?: string } | null;
    catalogBookId?: string;
    primaryEditionId?: string | null;
    editions?: unknown;
  },
) {
  const editions = Array.isArray(response.editions)
    ? (response.editions as EditionIdentityLike[])
    : null;
  const duplicateIds = editions ? findDuplicateEditionIds(editions) : [];
  const crossBookEditionIds = editions
    ? editions
        .filter((edition) => edition.catalogBookId !== catalogBookId)
        .map((edition) => edition.id)
    : [];
  const responseBookId = response.catalogBook?.id ?? response.catalogBookId;
  const primaryExists =
    response.primaryEditionId == null ||
    !!editions?.some((edition) => edition.id === response.primaryEditionId);

  return {
    ok:
      responseBookId === catalogBookId &&
      editions !== null &&
      duplicateIds.length === 0 &&
      crossBookEditionIds.length === 0 &&
      primaryExists,
    editions,
    responseBookId,
    duplicateIds,
    crossBookEditionIds,
    primaryExists,
  };
}

export function findDuplicateEditionIds(editions: EditionIdentityLike[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const edition of editions) {
    if (seen.has(edition.id)) {
      duplicates.add(edition.id);
    } else {
      seen.add(edition.id);
    }
  }

  return [...duplicates].sort();
}

export function compareEditionSets(
  before: EditionIdentityLike[],
  after: EditionIdentityLike[],
): EditionSetInvariantResult {
  const beforeIds = sortedIds(before);
  const afterIds = sortedIds(after);
  const beforeSet = new Set(beforeIds);
  const afterSet = new Set(afterIds);
  const duplicateIds = findDuplicateEditionIds(after);
  const missingIds = beforeIds.filter((id) => !afterSet.has(id));
  const addedIds = afterIds.filter((id) => !beforeSet.has(id));

  return {
    ok:
      beforeIds.length === afterIds.length &&
      missingIds.length === 0 &&
      addedIds.length === 0 &&
      duplicateIds.length === 0,
    beforeIds,
    afterIds,
    beforeCount: beforeIds.length,
    afterCount: afterIds.length,
    missingIds,
    addedIds,
    duplicateIds,
  };
}

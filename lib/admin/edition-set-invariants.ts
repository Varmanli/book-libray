export type EditionIdentityLike = {
  id: string;
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

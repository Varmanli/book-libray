import { sanitizeRichTextHtml } from "@/lib/content/rich-text";
import { normalizeIsbn } from "@/lib/books/import/isbn";
import type { ExplicitFieldAction } from "./field-actions";

export type RelationDiff<T> = { add: T[]; remove: T[]; keep: T[] };

export function diffRelations<T>(
  current: readonly T[],
  desired: readonly T[],
  explicitlyRemoved: readonly T[] = [],
): RelationDiff<T> {
  const old = [...new Set(current)];
  const next = [...new Set(desired)];
  const removals = new Set(explicitlyRemoved);
  return {
    add: next.filter((item) => !old.includes(item)),
    remove: old.filter((item) => removals.has(item)),
    keep: old.filter((item) => !removals.has(item)),
  };
}

export function applyRelationDiff<T>(
  diff: RelationDiff<T>,
  options: { requireOne?: boolean } = {},
): T[] {
  const result = [...new Set([...diff.keep, ...diff.add])];
  if (options.requireOne && result.length === 0)
    throw new Error("RELATION_REQUIRED");
  return result;
}

export function splitRelations(value: string | null | undefined): string[] {
  return (
    value
      ?.split(/\s*[،,]\s*/)
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export function isValidIsbn(value: string | null): boolean {
  const isbn = normalizeIsbn(value);
  if (!isbn || !/^(?:\d{9}[\dX]|\d{13})$/.test(isbn)) return false;
  if (isbn.length === 10)
    return (
      [...isbn].reduce(
        (sum, char, index) =>
          sum + (char === "X" ? 10 : Number(char)) * (10 - index),
        0,
      ) %
        11 ===
      0
    );
  return (
    [...isbn].reduce(
      (sum, char, index) => sum + Number(char) * (index % 2 ? 3 : 1),
      0,
    ) %
      10 ===
    0
  );
}

type EditionSource = {
  titleOverride: string | null;
  publisher: string | null;
  translators: string | null;
  isbn10: string | null;
  isbn13: string | null;
  publishedYear: number | null;
  pageCount: number | null;
  editionDescription: string | null;
};

export function validateEditionFieldValue(
  field: keyof EditionSource,
  value: unknown,
): unknown {
  if (field === "isbn10" || field === "isbn13") {
    const normalized = normalizeIsbn(value);
    if (
      normalized !== null &&
      (!isValidIsbn(normalized) ||
        normalized.length !== (field === "isbn10" ? 10 : 13))
    )
      throw new Error("ISBN_CONFLICT");
    return normalized;
  }
  if (field === "publishedYear") {
    if (
      value !== null &&
      (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 3000)
    )
      throw new Error("INVALID_DRAFT");
    return value;
  }
  if (field === "pageCount") {
    if (
      value !== null &&
      (!Number.isInteger(value) || Number(value) < 1 || Number(value) > 100000)
    )
      throw new Error("INVALID_DRAFT");
    return value;
  }
  if (field === "editionDescription")
    return value == null
      ? null
      : sanitizeRichTextHtml(String(value).slice(0, 100_000));
  if (value !== null && String(value).length > 500)
    throw new Error("INVALID_DRAFT");
  return value == null ? null : String(value).trim() || null;
}

export function editionFieldPatch(
  current: EditionSource,
  source: EditionSource,
  actions: Array<{
    field: keyof EditionSource;
    action: ExplicitFieldAction;
    customValue?: unknown;
  }>,
): Partial<EditionSource> {
  const patch: Partial<EditionSource> = {};
  for (const item of actions) {
    if (item.action === "KEEP_EXISTING") continue;
    if (
      item.action === "FILL_IF_EMPTY" &&
      current[item.field] != null &&
      current[item.field] !== ""
    )
      continue;
    const raw =
      item.action === "USE_CUSTOM" ? item.customValue : source[item.field];
    if (
      item.action === "USE_SOURCE" &&
      (item.field === "publisher" || item.field === "translators") &&
      (raw == null || raw === "")
    )
      continue;
    if (item.field === "translators" && item.action !== "USE_CUSTOM") {
      const desired = applyRelationDiff(
        diffRelations(
          splitRelations(current.translators),
          splitRelations(raw == null ? null : String(raw)),
        ),
      );
      const value = desired.join("، ") || null;
      if (!Object.is(value, current.translators)) patch.translators = value;
      continue;
    }
    const value = validateEditionFieldValue(item.field, raw);
    if (value !== undefined && !Object.is(value, current[item.field]))
      (patch as Record<string, unknown>)[item.field] = value;
  }
  return patch;
}

export const LEGACY_IRANKETAB_COVER_PREFIX = "/uploads/covers/iranketab-";

export function finalIranKetabCoverValue(finalKey: string) {
  if (!/^covers\/iranketab-[a-f0-9-]+\.webp$/i.test(finalKey)) throw new Error("کلید نهایی کاور ایران‌کتاب معتبر نیست.");
  return finalKey;
}

/** Canonical managed media for IranKetab contributor profiles and banners. */
export function finalIranKetabReferenceMediaValue(finalKey: string) {
  if (!/^references\/iranketab-(author|translator|publisher)-[a-f0-9]{20}(?:-[a-f0-9]{16})?-(profile|banner)\.webp$/i.test(finalKey))
    throw new Error("کلید نهایی تصویر مرجع ایران‌کتاب معتبر نیست.");
  return finalKey;
}

export function legacyIranKetabCoverToKey(value: string) {
  return value.startsWith(LEGACY_IRANKETAB_COVER_PREFIX)
    ? value.replace(/^\/uploads\//, "")
    : null;
}

export async function repairVerifiedIranKetabCoverPaths<T extends { id: string; coverImage: string }>(input: {
  rows: T[];
  objectExists: (key: string) => Promise<boolean>;
  updateCoverImage: (id: string, key: string) => Promise<void>;
}) {
  const repaired: Array<{ id: string; from: string; to: string }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];
  for (const row of input.rows) {
    const key = legacyIranKetabCoverToKey(row.coverImage);
    if (!key) { skipped.push({ id: row.id, reason: "unrelated" }); continue; }
    if (!(await input.objectExists(key))) { skipped.push({ id: row.id, reason: "object-not-found" }); continue; }
    await input.updateCoverImage(row.id, key);
    repaired.push({ id: row.id, from: row.coverImage, to: key });
  }
  return { repaired, skipped };
}

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { QuoteBackground as QuoteBackgroundTable } from "@/db/schema";
import { normalizeMediaUrl } from "@/lib/book/cover";
import {
  QUOTE_BACKGROUNDS,
  type ManagedQuoteBackground,
} from "./backgrounds";

export async function getManagedQuoteBackgrounds(
  onlyActive = true,
): Promise<ManagedQuoteBackground[]> {
  try {
    const query = db
      .select()
      .from(QuoteBackgroundTable)
      .orderBy(asc(QuoteBackgroundTable.displayOrder), asc(QuoteBackgroundTable.createdAt));

    const rows = onlyActive
      ? await query.where(eq(QuoteBackgroundTable.isActive, true))
      : await query;

    if (!rows || rows.length === 0) {
      return QUOTE_BACKGROUNDS.map((bg, idx) => ({
        id: bg.value,
        value: bg.value,
        label: bg.label,
        image: bg.image,
        imageKey: null,
        imageUrl: bg.image,
        isActive: true,
        displayOrder: idx,
        isSystem: true,
      }));
    }

    return rows.map((r) => ({
      id: r.id,
      value: r.value,
      label: r.label,
      image: r.imageUrl || (r.imageKey ? normalizeMediaUrl(r.imageKey) : null),
      imageKey: r.imageKey,
      imageUrl: r.imageUrl,
      isActive: r.isActive,
      displayOrder: r.displayOrder,
      isSystem: r.isSystem,
    }));
  } catch (error) {
    console.error(
      "[getManagedQuoteBackgrounds] DB query failed, falling back to static presets:",
      error,
    );
    return QUOTE_BACKGROUNDS.map((bg, idx) => ({
      id: bg.value,
      value: bg.value,
      label: bg.label,
      image: bg.image,
      imageKey: null,
      imageUrl: bg.image,
      isActive: true,
      displayOrder: idx,
      isSystem: true,
    }));
  }
}

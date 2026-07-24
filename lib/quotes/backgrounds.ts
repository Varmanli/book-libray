import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { QuoteBackground as QuoteBackgroundTable } from "@/db/schema";
import { normalizeMediaUrl } from "@/lib/book/cover";

export const QUOTE_BACKGROUNDS = [
  { value: "default", label: "پیش‌فرض", image: null },
  { value: "bg-1", label: "طرح ۱", image: "/quotebg/bg-1.webp" },
  { value: "bg-2", label: "طرح ۲", image: "/quotebg/bg-2.webp" },
  { value: "bg-3", label: "طرح ۳", image: "/quotebg/bg-3.webp" },
  { value: "bg-4", label: "طرح ۴", image: "/quotebg/bg-4.webp" },
  { value: "bg-5", label: "طرح ۵", image: "/quotebg/bg-5.webp" },
  { value: "bg-6", label: "طرح ۶", image: "/quotebg/bg-6.webp" },
  { value: "bg-7", label: "طرح ۷", image: "/quotebg/bg-7.webp" },
  { value: "bg-8", label: "طرح ۸", image: "/quotebg/bg-8.webp" },
  { value: "bg-9", label: "طرح ۹", image: "/quotebg/bg-9.webp" },
  { value: "bg-10", label: "طرح ۱۰", image: "/quotebg/bg-10.webp" },
  { value: "bg-11", label: "طرح ۱۱", image: "/quotebg/bg-11.webp" },
  { value: "bg-12", label: "طرح ۱۲", image: "/quotebg/bg-12.webp" },
] as const;

export type QuoteBackground = string;

export interface ManagedQuoteBackground {
  id: string;
  value: string;
  label: string;
  image: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
  isSystem: boolean;
}

const LEGACY_UNSUPPORTED = new Set(["paper", "grid", "editorial"]);

export function normalizeQuoteBackground(value: unknown): string {
  if (
    typeof value === "string" &&
    value.trim() &&
    !LEGACY_UNSUPPORTED.has(value.trim())
  ) {
    return value.trim();
  }
  return "default";
}

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

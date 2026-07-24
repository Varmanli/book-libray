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

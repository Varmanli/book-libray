// متادیتای لینک‌های بیرونیِ کتاب — بدون وابستگی به سرور/دیتابیس تا هم در
// کامپوننت‌های کلاینت و هم در سرویس‌ها قابل استفاده باشد.

export const EXTERNAL_LINK_PROVIDERS = [
  "taaghche",
  "fidibo",
  "iranketab",
  "ketabrah",
  "digikala",
  "publisher",
  "other",
] as const;

export type ExternalLinkProviderValue = (typeof EXTERNAL_LINK_PROVIDERS)[number];

export const EXTERNAL_LINK_TYPES = [
  "print",
  "ebook",
  "audiobook",
  "unknown",
] as const;

export type ExternalLinkTypeValue = (typeof EXTERNAL_LINK_TYPES)[number];

export const PROVIDER_LABELS: Record<ExternalLinkProviderValue, string> = {
  taaghche: "طاقچه",
  fidibo: "فیدیبو",
  iranketab: "ایران‌کتاب",
  ketabrah: "کتابراه",
  digikala: "دیجی‌کالا",
  publisher: "ناشر",
  other: "سایر",
};

export const TYPE_LABELS: Record<ExternalLinkTypeValue, string> = {
  print: "نسخه چاپی",
  ebook: "نسخه دیجیتال",
  audiobook: "نسخه صوتی",
  unknown: "نامشخص",
};

export function isExternalLinkProvider(
  value: string,
): value is ExternalLinkProviderValue {
  return (EXTERNAL_LINK_PROVIDERS as readonly string[]).includes(value);
}

export function isExternalLinkType(
  value: string,
): value is ExternalLinkTypeValue {
  return (EXTERNAL_LINK_TYPES as readonly string[]).includes(value);
}

/** مقدار provider را به یک گزینه‌ی معتبر نگاشت می‌کند (پیش‌فرض: other). */
export function normalizeExternalBookLinkProvider(
  value: string | null | undefined,
): ExternalLinkProviderValue {
  const v = (value ?? "").trim().toLowerCase();
  return isExternalLinkProvider(v) ? v : "other";
}

export function normalizeExternalBookLinkType(
  value: string | null | undefined,
): ExternalLinkTypeValue {
  const v = (value ?? "").trim().toLowerCase();
  return isExternalLinkType(v) ? v : "unknown";
}

/**
 * برچسب نمایشِ یک لینک: برچسب سفارشی اولویت دارد؛ در نبود آن از «ناشر · نوع»
 * استفاده می‌شود (نوعِ نامشخص حذف می‌شود).
 */
export function externalLinkDisplayLabel(input: {
  provider: ExternalLinkProviderValue;
  type: ExternalLinkTypeValue;
  label?: string | null;
}): string {
  const custom = input.label?.trim();
  if (custom) return custom;
  const provider = PROVIDER_LABELS[input.provider];
  if (input.type && input.type !== "unknown") {
    return `${provider} · ${TYPE_LABELS[input.type]}`;
  }
  return provider;
}

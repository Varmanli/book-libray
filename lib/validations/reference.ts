import { z } from "zod";
import { REFERENCE_DESCRIPTION_LIMITS } from "@/lib/reference/limits";

const nullableTrimmedString = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    })
    .refine((value) => value == null || value.length <= max, {
      message: `حداکثر ${max} کاراکتر مجاز است`,
    });

const nullableUrl = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  })
  .refine((value) => value == null || /^https?:\/\//i.test(value), {
    message: "آدرس باید با http:// یا https:// شروع شود",
  })
  .refine((value) => value == null || z.url().safeParse(value).success, {
    message: "آدرس معتبر نیست",
  });

const nullableYear = z
  .union([z.number().int(), z.null()])
  .optional()
  .refine((value) => value == null || (value >= 0 && value <= 2100), {
    message: "سال واردشده معتبر نیست",
  });

export const referenceTypeSchema = z.enum([
  "AUTHOR",
  "GENRE",
  "TRANSLATOR",
  "PUBLISHER",
  "COUNTRY",
]);

export const approvalStatusSchema = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
]);

export const createReferenceSchema = z.object({
  type: referenceTypeSchema,
  name: z.string().trim().min(1, "نام الزامی است").max(200),
});

export const updateReferenceSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  slug: z.string().trim().max(200).optional(),
  coverImage: z.string().max(2000).nullish(),
  bannerImage: z.string().max(2000).nullish(),
  description: z.string().max(REFERENCE_DESCRIPTION_LIMITS.full).nullish(),
  originalName: nullableTrimmedString(200),
  shortDescription: nullableTrimmedString(REFERENCE_DESCRIPTION_LIMITS.short),
  imageFilename: nullableTrimmedString(255),
  sourceName: nullableTrimmedString(200),
  sourceUrl: nullableUrl,
  seoTitle: nullableTrimmedString(255),
  seoDescription: nullableTrimmedString(180),
  birthYear: nullableYear,
  deathYear: nullableYear,
  countryName: nullableTrimmedString(200),
  countrySlug: nullableTrimmedString(200),
  website: nullableUrl,
  status: approvalStatusSchema.optional(),
}).superRefine((value, ctx) => {
  if (
    value.birthYear != null &&
    value.deathYear != null &&
    value.deathYear < value.birthYear
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["deathYear"],
      message: "سال وفات نمی‌تواند قبل از سال تولد باشد",
    });
  }
});

export type ReferenceTypeValue = z.infer<typeof referenceTypeSchema>;
export type CreateReferenceInput = z.infer<typeof createReferenceSchema>;
export type UpdateReferenceInput = z.infer<typeof updateReferenceSchema>;

// برچسب‌های فارسی برای نمایش
export const REFERENCE_TYPE_LABELS: Record<ReferenceTypeValue, string> = {
  AUTHOR: "نویسنده",
  GENRE: "ژانر",
  TRANSLATOR: "مترجم",
  PUBLISHER: "ناشر",
  COUNTRY: "کشور",
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  PENDING: "در انتظار تأیید",
  APPROVED: "تأییدشده",
  REJECTED: "ردشده",
};

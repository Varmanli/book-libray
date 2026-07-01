import { z } from "zod";

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
  description: z.string().max(5000).nullish(),
  status: approvalStatusSchema.optional(),
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

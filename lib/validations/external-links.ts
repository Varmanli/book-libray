import { z } from "zod";

import {
  EXTERNAL_LINK_PROVIDERS,
  EXTERNAL_LINK_TYPES,
} from "@/lib/book/external-links-meta";

/** حداکثر تعداد لینکِ هر کتاب (سقف منطقی برای جلوگیری از سوءاستفاده). */
export const MAX_EXTERNAL_LINKS = 20;

const urlSchema = z
  .string()
  .trim()
  .min(1, "آدرس لینک الزامی است")
  .max(2048, "آدرس لینک خیلی بلند است")
  .refine(
    (v) => /^https?:\/\//i.test(v),
    "آدرس باید با http:// یا https:// شروع شود",
  );

export const externalLinkInputSchema = z
  .object({
    provider: z.enum(EXTERNAL_LINK_PROVIDERS),
    type: z.enum(EXTERNAL_LINK_TYPES).default("unknown"),
    url: urlSchema,
    label: z.string().trim().max(120, "برچسب خیلی بلند است").nullish(),
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(9999).optional(),
  })
  .refine(
    (link) => link.provider !== "other" || Boolean(link.label?.trim()),
    {
      message: "برای «سایر» وارد کردن برچسب الزامی است",
      path: ["label"],
    },
  );

export const externalLinksArraySchema = z
  .array(externalLinkInputSchema)
  .max(MAX_EXTERNAL_LINKS, `حداکثر ${MAX_EXTERNAL_LINKS} لینک مجاز است`);

export type ExternalLinkInput = z.infer<typeof externalLinkInputSchema>;

import { z } from "zod";

/** آدرس CTA: مسیر داخلی (شروع با /) یا URL مطلق http(s). خالی مجاز است. */
const hrefSchema = z
  .string()
  .max(500)
  .refine(
    (v) => !v || v.startsWith("/") || /^https?:\/\//i.test(v),
    "آدرس باید با / یا http شروع شود"
  );

export const heroSlideInputSchema = z.object({
  title: z.string().trim().min(1, "عنوان الزامی است").max(200),
  description: z.string().max(2000).nullish(),
  badge: z.string().max(100).nullish(),
  primaryCtaLabel: z.string().max(100).nullish(),
  primaryCtaHref: hrefSchema.nullish(),
  secondaryCtaLabel: z.string().max(100).nullish(),
  secondaryCtaHref: hrefSchema.nullish(),
  imageUrl: z.string().max(2000).nullish(),
  isActive: z.boolean().optional(),
});

export const heroActiveSchema = z.object({ isActive: z.boolean() });

export const heroReorderSchema = z.object({
  orderedIds: z.array(z.string().min(1)),
});

export const heroBooksSchema = z.object({
  bookIds: z.array(z.string().min(1)).max(3, "حداکثر ۳ کتاب مجاز است"),
});

export type HeroSlideInputParsed = z.infer<typeof heroSlideInputSchema>;

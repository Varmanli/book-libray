import { z } from "zod";

export const staticPageStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

// اسلاگ از ورودی گرفته نمی‌شود؛ از مسیر می‌آید و در سرویس محافظت می‌شود.
export const staticPageUpdateSchema = z.object({
  title: z.string().min(1, "عنوان صفحه الزامی است").max(500),
  subtitle: z.string().max(1000).optional().nullable(),
  content: z.string().max(200000).optional().default(""),
  seoTitle: z.string().max(500).optional().nullable(),
  seoDescription: z.string().max(1000).optional().nullable(),
  status: staticPageStatusSchema.default("PUBLISHED"),
});

export type StaticPageUpdateInput = z.infer<typeof staticPageUpdateSchema>;

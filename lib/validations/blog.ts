import { z } from "zod";

export const blogPostStatusSchema = z.enum(["DRAFT", "PUBLISHED"]);

export const blogPostInputSchema = z.object({
  title: z.string().min(1, "عنوان نوشته الزامی است").max(500),
  // اسلاگ به‌صورت خودکار در سرویس از عنوان ساخته می‌شود؛ از ادمین گرفته نمی‌شود.
  categoryId: z.string().min(1, "انتخاب دسته‌بندی الزامی است"),
  excerpt: z.string().min(1, "خلاصه کوتاه الزامی است").max(1000),
  content: z.string().min(1, "محتوا الزامی است").max(100000),
  bannerImage: z.string().min(1, "تصویر بنر الزامی است").max(5000),
  status: blogPostStatusSchema.default("DRAFT"),
  publishedAt: z.string().datetime().optional().nullable(),
  seoTitle: z.string().max(500).optional(),
  seoDescription: z.string().max(1000).optional(),
});

export const adminBlogListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().optional().default(""),
  status: z.enum(["ALL", "DRAFT", "PUBLISHED"]).default("ALL"),
});

export const blogCategoryInputSchema = z.object({
  name: z.string().min(1, "نام دسته‌بندی الزامی است").max(200),
  description: z.string().max(1000).optional().nullable(),
});

export type BlogPostInput = z.infer<typeof blogPostInputSchema>;
export type BlogCategoryInput = z.infer<typeof blogCategoryInputSchema>;

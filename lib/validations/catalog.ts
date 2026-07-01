import { z } from "zod";

import { externalLinksArraySchema } from "@/lib/validations/external-links";

// وضعیت مطالعه — هم‌راستا با enum موجود BookStatus در دیتابیس
export const readingStatusSchema = z.enum(["UNREAD", "READING", "FINISHED"]);

export const bookFormatSchema = z.enum(["PHYSICAL", "ELECTRONIC"]);

// افزودن یک نسخه‌ی موجود از کاتالوگ به کتابخانه‌ی کاربر
export const addToLibrarySchema = z.object({
  editionId: z.string().min(1, "نسخه نامعتبر است"),
  status: readingStatusSchema.optional().default("UNREAD"),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
});

// ساخت دستی کتاب: کتاب کانونی + یک نسخه + افزودن به کتابخانه
export const manualBookSchema = z.object({
  // کتاب کانونی
  title: z.string().min(1, "عنوان الزامی است").max(500),
  author: z.string().min(1, "نویسنده الزامی است").max(300),
  originalTitle: z.string().max(500).optional(),
  description: z.string().max(5000).optional(),
  genre: z.string().min(1, "ژانر الزامی است").max(200),
  country: z.string().max(200).optional(),
  language: z.string().max(50).optional(),
  // نسخه
  translator: z.string().max(300).optional(),
  publisher: z.string().max(300).optional(),
  isbn: z.string().max(20).optional(),
  // قالب چاپی/فیزیکی از محصول حذف شده؛ پیش‌فرض دیجیتال نگه داشته می‌شود تا
  // ستون‌های موجود (notNull) بدون نیاز به انتخاب کاربر مقداردهی شوند.
  format: bookFormatSchema.default("ELECTRONIC"),
  // جلد اختیاری است
  coverImage: z.string().min(1).optional(),
  publishedYear: z.number().int().min(0).max(3000).optional(),
  editionLabel: z.string().max(200).optional(),
  pageCount: z.number().int().min(1, "تعداد صفحات باید حداقل ۱ باشد"),
  // کتابخانه‌ی کاربر
  status: readingStatusSchema.optional().default("UNREAD"),
  rating: z.number().int().min(1).max(5).optional(),
  notes: z.string().max(2000).optional(),
});

// ویرایش ادمینیِ یک کتاب کاتالوگ: فیلدهای کانونی + فیلدهای نسخه‌ی نماینده.
// جلد به‌صورت صریح مقداردهی می‌شود: رشته = جلد جدید، null = حذف جلد، نبودن = بدون تغییر.
export const adminBookUpdateSchema = z.object({
  // کتاب کانونی
  title: z.string().min(1, "عنوان الزامی است").max(500),
  author: z.string().min(1, "نویسنده الزامی است").max(300),
  originalTitle: z.string().max(500).nullish(),
  description: z.string().max(5000).nullish(),
  genre: z.string().min(1, "ژانر الزامی است").max(200),
  country: z.string().max(200).nullish(),
  language: z.string().max(50).nullish(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  // نسخه‌ی نماینده
  translator: z.string().max(300).nullish(),
  publisher: z.string().max(300).nullish(),
  isbn: z.string().max(20).nullish(),
  format: bookFormatSchema.optional(),
  publishedYear: z.number().int().min(0).max(3000).nullish(),
  editionLabel: z.string().max(200).nullish(),
  pageCount: z.number().int().min(1, "تعداد صفحات باید حداقل ۱ باشد").nullish(),
  // جلد مشترکِ کانونی/نسخه
  coverImage: z.string().min(1).nullable().optional(),
  // بازتولید صریح اسلاگ (پیش‌فرض خاموش تا لینک عمومی پایدار بماند)
  regenerateSlug: z.boolean().optional(),
});

// ساخت ادمینیِ کتاب کاتالوگ + لینک‌های بیرونیِ اختیاری (هنگام ساخت).
export const adminBookCreateSchema = manualBookSchema.extend({
  externalLinks: externalLinksArraySchema.optional(),
});

// ویرایش ادمینی + لینک‌های بیرونی (در صورت ارسال، جایگزین کاملِ لینک‌ها).
export const adminBookUpdateWithLinksSchema = adminBookUpdateSchema.extend({
  externalLinks: externalLinksArraySchema.optional(),
});

export type AddToLibraryInput = z.infer<typeof addToLibrarySchema>;
export type ManualBookInput = z.infer<typeof manualBookSchema>;
export type AdminBookUpdateInput = z.infer<typeof adminBookUpdateSchema>;
export type AdminBookCreateInput = z.infer<typeof adminBookCreateSchema>;
export type AdminBookUpdateWithLinksInput = z.infer<
  typeof adminBookUpdateWithLinksSchema
>;

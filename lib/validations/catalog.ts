import { z } from "zod";

import { externalLinksArraySchema } from "@/lib/validations/external-links";
import { ADMIN_BOOK_STRING_LIMITS } from "@/lib/validations/catalog-limits";

// وضعیت مطالعه — هم‌راستا با enum موجود BookStatus در دیتابیس
export const readingStatusSchema = z.enum(["UNREAD", "READING", "FINISHED"]);

export const bookFormatSchema = z.enum(["PHYSICAL", "ELECTRONIC"]);

const editionStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

const adminEditionBaseSchema = z.object({
  titleOverride: z.string().max(500).nullish(),
  translator: z.string().max(ADMIN_BOOK_STRING_LIMITS.translator).nullish(),
  publisher: z.string().max(ADMIN_BOOK_STRING_LIMITS.publisher).nullish(),
  isbn10: z.string().max(ADMIN_BOOK_STRING_LIMITS.isbn).nullish(),
  isbn13: z.string().max(ADMIN_BOOK_STRING_LIMITS.isbn).nullish(),
  publishedYear: z.number().int().min(0).max(3000).nullish(),
  pageCount: z.number().int().min(1, "تعداد صفحات باید حداقل ۱ باشد").nullish(),
  coverImage: z.string().min(1).nullable().optional(),
  editionDescription: z.string().max(5000).nullish(),
  editionLabel: z.string().max(ADMIN_BOOK_STRING_LIMITS.editionLabel).nullish(),
  language: z.string().max(ADMIN_BOOK_STRING_LIMITS.language).nullish(),
  format: bookFormatSchema.optional(),
  status: editionStatusSchema.optional(),
  sourceName: z.string().max(200).nullish(),
  sourceUrl: z.string().url("آدرس منبع معتبر نیست").nullish(),
  sourceEditionCode: z.string().max(200).nullish(),
});

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
  title: z.string().min(1, "عنوان الزامی است").max(ADMIN_BOOK_STRING_LIMITS.title),
  author: z.string().min(1, "نویسنده الزامی است").max(ADMIN_BOOK_STRING_LIMITS.author),
  originalTitle: z.string().max(ADMIN_BOOK_STRING_LIMITS.originalTitle).optional(),
  description: z.string().max(ADMIN_BOOK_STRING_LIMITS.description).optional(),
  genre: z.string().min(1, "ژانر الزامی است").max(ADMIN_BOOK_STRING_LIMITS.genre),
  country: z.string().max(ADMIN_BOOK_STRING_LIMITS.country).optional(),
  language: z.string().max(ADMIN_BOOK_STRING_LIMITS.language).optional(),
  // نسخه
  translator: z.string().max(ADMIN_BOOK_STRING_LIMITS.translator).optional(),
  publisher: z.string().max(ADMIN_BOOK_STRING_LIMITS.publisher).optional(),
  isbn: z.string().max(ADMIN_BOOK_STRING_LIMITS.isbn).optional(),
  // قالب چاپی/فیزیکی از محصول حذف شده؛ پیش‌فرض دیجیتال نگه داشته می‌شود تا
  // ستون‌های موجود (notNull) بدون نیاز به انتخاب کاربر مقداردهی شوند.
  format: bookFormatSchema.default("ELECTRONIC"),
  // جلد اختیاری است
  coverImage: z.string().min(1).optional(),
  publishedYear: z.number().int().min(0).max(3000).optional(),
  editionLabel: z.string().max(ADMIN_BOOK_STRING_LIMITS.editionLabel).optional(),
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
  title: z.string().min(1, "عنوان الزامی است").max(ADMIN_BOOK_STRING_LIMITS.title),
  author: z.string().min(1, "نویسنده الزامی است").max(ADMIN_BOOK_STRING_LIMITS.author),
  originalTitle: z.string().max(ADMIN_BOOK_STRING_LIMITS.originalTitle).nullish(),
  description: z.string().max(ADMIN_BOOK_STRING_LIMITS.description).nullish(),
  genre: z.string().min(1, "ژانر الزامی است").max(ADMIN_BOOK_STRING_LIMITS.genre),
  country: z.string().max(ADMIN_BOOK_STRING_LIMITS.country).nullish(),
  language: z.string().max(ADMIN_BOOK_STRING_LIMITS.language).nullish(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  // نسخه‌ی نماینده
  translator: z.string().max(ADMIN_BOOK_STRING_LIMITS.translator).nullish(),
  publisher: z.string().max(ADMIN_BOOK_STRING_LIMITS.publisher).nullish(),
  isbn: z.string().max(ADMIN_BOOK_STRING_LIMITS.isbn).nullish(),
  format: bookFormatSchema.optional(),
  publishedYear: z.number().int().min(0).max(3000).nullish(),
  editionLabel: z.string().max(ADMIN_BOOK_STRING_LIMITS.editionLabel).nullish(),
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

export const adminEditionCreateSchema = adminEditionBaseSchema.extend({
  catalogBookId: z.string().min(1, "شناسه‌ی کتاب نامعتبر است"),
}).superRefine((value, ctx) => {
  const hasMeaningfulField = [
    value.titleOverride,
    value.translator,
    value.publisher,
    value.isbn10,
    value.isbn13,
    value.coverImage,
    value.editionDescription,
    value.publishedYear,
    value.pageCount,
  ].some((item) => item != null && String(item).trim() !== "");

  if (!hasMeaningfulField) {
    ctx.addIssue({
      code: "custom",
      path: ["titleOverride"],
      message: "این نسخه باید حداقل یک مشخصه‌ی متمایزکننده داشته باشد",
    });
  }
});

export const adminEditionUpdateSchema = adminEditionBaseSchema.superRefine(
  (value, ctx) => {
    const hasMeaningfulField = [
      value.titleOverride,
      value.translator,
      value.publisher,
      value.isbn10,
      value.isbn13,
      value.coverImage,
      value.editionDescription,
      value.publishedYear,
      value.pageCount,
    ].some((item) => item != null && String(item).trim() !== "");

    if (!hasMeaningfulField) {
      ctx.addIssue({
        code: "custom",
        path: ["titleOverride"],
        message: "این نسخه باید حداقل یک مشخصه‌ی متمایزکننده داشته باشد",
      });
    }
  },
);

export type AddToLibraryInput = z.infer<typeof addToLibrarySchema>;
export type ManualBookInput = z.infer<typeof manualBookSchema>;
export type AdminBookUpdateInput = z.infer<typeof adminBookUpdateSchema>;
export type AdminBookCreateInput = z.infer<typeof adminBookCreateSchema>;
export type AdminBookUpdateWithLinksInput = z.infer<
  typeof adminBookUpdateWithLinksSchema
>;
export type AdminEditionCreateInput = z.infer<typeof adminEditionCreateSchema>;
export type AdminEditionUpdateInput = z.infer<typeof adminEditionUpdateSchema>;

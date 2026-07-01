import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo/metadata";
import { getStaticPageBySlug } from "@/lib/static-pages/service";

/**
 * متادیتای صفحه‌ی ثابت را از مقادیر دیتابیس می‌سازد. اگر SEO خالی باشد به
 * عنوان/زیرعنوان برمی‌گردد. صفحه‌ی منتشرنشده عنوان «پیدا نشد» می‌گیرد.
 */
export async function buildStaticPageMetadata(slug: string): Promise<Metadata> {
  const page = await getStaticPageBySlug(slug);

  if (!page) {
    return { title: "صفحه پیدا نشد | قفسه" };
  }

  return buildPageMetadata({
    title: page.seoTitle?.trim() || page.title,
    description: page.seoDescription?.trim() || page.subtitle?.trim(),
    path: `/${slug}`,
    type: "article",
  });
}

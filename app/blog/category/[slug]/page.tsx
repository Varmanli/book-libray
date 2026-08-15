import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BlogArchiveGrid from "@/components/blog/BlogArchiveGrid";
import BlogCategoryHeader from "@/components/blog/BlogCategoryHeader";
import PublicShell from "@/components/PublicShell";
import { getMagazineCategory } from "@/lib/blog/categories";
import { BLOG_PAGE_SIZE, getPublicBlogCategoryBySlug, listPublicBlogPosts } from "@/lib/blog/service";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getMagazineCategory(slug) ?? await getPublicBlogCategoryBySlug(slug);
  if (!category) return { title: "دسته‌بندی پیدا نشد | قفسه" };
  return buildPageMetadata({ title: `${category.name} | مجله قفسه`, description: category.description || "مطالب منتخب مجله قفسه برای پیدا کردن کتاب بعدی.", path: `/blog/category/${encodeURIComponent(slug)}` });
}

export default async function MagazineCategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const fallback = getMagazineCategory(slug);
  const category = await getPublicBlogCategoryBySlug(slug);
  if (!fallback && !category) notFound();
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const archive = await listPublicBlogPosts({ categorySlug: slug, page, pageSize: BLOG_PAGE_SIZE });
  const name = category?.name ?? fallback!.name;
  const description = category?.description || fallback?.description;

  return <PublicShell><main dir="rtl" className="mx-auto max-w-7xl px-4 pb-20 sm:px-6"><BlogCategoryHeader name={name} description={description} slug={slug} /><BlogArchiveGrid posts={archive.posts} page={archive.page} pageCount={archive.pageCount} category={slug} /></main></PublicShell>;
}

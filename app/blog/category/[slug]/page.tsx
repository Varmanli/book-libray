import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BlogCard from "@/components/blog/BlogCard";
import PublicShell from "@/components/PublicShell";
import { getMagazineCategory } from "@/lib/blog/categories";
import { BLOG_PAGE_SIZE, getPublicBlogCategoryBySlug, listPublicBlogPosts } from "@/lib/blog/service";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = getMagazineCategory(slug) ?? await getPublicBlogCategoryBySlug(slug);
  if (!category) return { title: "دسته‌بندی پیدا نشد | قفسه" };
  return buildPageMetadata({ title: `${category.name} | مجله قفسه`, description: "مطالب منتخب مجله قفسه برای پیدا کردن کتاب بعدی.", path: `/blog/category/${encodeURIComponent(slug)}` });
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
  const pageHref = (target: number) => target > 1 ? `/blog/category/${encodeURIComponent(slug)}?page=${target}` : `/blog/category/${encodeURIComponent(slug)}`;
  return <PublicShell><main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6"><nav className="text-sm text-muted-foreground"><Link href="/">خانه</Link><span className="px-2">/</span><Link href="/blog">مجله قفسه</Link><span className="px-2">/</span><span>{name}</span></nav><header className="mt-6 rounded-[2rem] border border-border/70 bg-card/60 px-5 py-8 sm:px-8"><p className="text-sm font-bold text-primary">دسته‌بندی مجله</p><h1 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">{name}</h1><p className="mt-3 max-w-2xl leading-8 text-muted-foreground">{description ?? "مطالب منتخب مجله قفسه در این موضوع."}</p></header><section className="mt-8" aria-labelledby="category-articles"><h2 id="category-articles" className="mb-4 text-xl font-black">مطالب {name}</h2>{archive.posts.length ? <><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{archive.posts.map((post) => <BlogCard key={post.id} post={post} />)}</div>{archive.pageCount > 1 ? <nav aria-label="صفحه‌بندی مطالب" className="mt-8 flex items-center justify-between"><span>{archive.page > 1 ? <Link className="text-primary" href={pageHref(archive.page - 1)}>صفحه قبل</Link> : null}</span><span className="text-sm text-muted-foreground">صفحه {archive.page.toLocaleString("fa-IR")} از {archive.pageCount.toLocaleString("fa-IR")}</span><span>{archive.page < archive.pageCount ? <Link className="text-primary" href={pageHref(archive.page + 1)}>صفحه بعد</Link> : null}</span></nav> : null}</> : <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">هنوز مطلبی در این دسته‌بندی منتشر نشده است.</div>}</section></main></PublicShell>;
}

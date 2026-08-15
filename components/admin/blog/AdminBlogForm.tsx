"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

import AdminFormField from "@/components/admin/AdminFormField";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminBlogBannerUpload from "@/components/admin/blog/AdminBlogBannerUpload";
import AdminRichTextEditor from "@/components/admin/AdminRichTextEditor";
import AdminBlogCategorySelect from "@/components/admin/blog/BlogCategorySelect";
import BlogEntityRelations from "@/components/admin/blog/BlogEntityRelations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  AdminBlogPostDetail,
  BlogCategoryOption,
} from "@/lib/blog/service";

type BlogFormState = {
  title: string;
  categoryId: string;
  excerpt: string;
  content: string;
  bannerImage: string | null;
  status: "DRAFT" | "PUBLISHED";
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  ogImage: string;
  relatedBookIds: string[];
  relatedAuthorIds: string[];
  relatedGenreIds: string[];
};

function toFormState(post?: AdminBlogPostDetail | null): BlogFormState {
  return {
    title: post?.title ?? "",
    categoryId: post?.categoryId ?? "",
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    bannerImage: post?.bannerImage ?? null,
    status: post?.status ?? "DRAFT",
    seoTitle: post?.seoTitle ?? "",
    seoDescription: post?.seoDescription ?? "",
    canonicalUrl: post?.canonicalUrl ?? "",
    ogImage: post?.ogImage ?? "",
    relatedBookIds: post?.relatedBookIds ?? [],
    relatedAuthorIds: post?.relatedAuthorIds ?? [],
    relatedGenreIds: post?.relatedGenreIds ?? [],
  };
}

export default function AdminBlogForm({
  mode,
  post,
  categories,
}: {
  mode: "create" | "edit";
  post?: AdminBlogPostDetail | null;
  categories: BlogCategoryOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<BlogFormState>(() => toFormState(post));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BlogFormState, string>>
  >({});

  const setField = <K extends keyof BlogFormState>(
    key: K,
    value: BlogFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof BlogFormState, string>> = {};
    if (!form.title.trim()) nextErrors.title = "عنوان نوشته الزامی است.";
    if (!form.categoryId)
      nextErrors.categoryId = "انتخاب دسته‌بندی الزامی است.";
    if (!form.excerpt.trim()) nextErrors.excerpt = "خلاصه کوتاه الزامی است.";
    if (!form.content.trim()) nextErrors.content = "محتوا الزامی است.";
    if (!form.bannerImage?.trim())
      nextErrors.bannerImage = "تصویر بنر الزامی است.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (status: "DRAFT" | "PUBLISHED") => {
    if (!validate()) {
      toast.error("چند فیلد مهم هنوز کامل نشده است.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        categoryId: form.categoryId,
        excerpt: form.excerpt.trim(),
        content: form.content,
        bannerImage: form.bannerImage!,
        status,
        seoTitle: form.seoTitle.trim() || undefined,
        seoDescription: form.seoDescription.trim() || undefined,
        canonicalUrl: form.canonicalUrl.trim() || undefined,
        ogImage: form.ogImage.trim() || undefined,
        relatedBookIds: form.relatedBookIds,
        relatedAuthorIds: form.relatedAuthorIds,
        relatedGenreIds: form.relatedGenreIds,
      };

      const url =
        mode === "create" ? "/api/admin/blog" : `/api/admin/blog/${post?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
        id?: string;
        slug?: string;
      };

      if (!response.ok) {
        toast.error(data.error || "ذخیره نوشته ناموفق بود.");
        return;
      }

      toast.success(
        data.message ||
          (status === "PUBLISHED" ? "نوشته منتشر شد." : "پیش‌نویس ذخیره شد."),
      );

      router.push("/admin/blog");
      router.refresh();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px] 2xl:gap-8">
      {/* Main content */}
      <main className="min-w-0 space-y-6">
        <AdminFormSection title="اطلاعات اصلی نوشته">
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminFormField label="عنوان نوشته" required error={errors.title}>
              <Input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                className="h-11 rounded-xl border-border/70 bg-background shadow-none"
              />
            </AdminFormField>

            <AdminFormField
              label="دسته‌بندی"
              required
              error={errors.categoryId}
            >
              <AdminBlogCategorySelect
                value={form.categoryId || null}
                onChange={(id) => setField("categoryId", id)}
                options={categories}
                disabled={saving}
              />
            </AdminFormField>
          </div>

          <div className="mt-5">
            <AdminFormField label="خلاصه کوتاه" required error={errors.excerpt}>
              <Textarea
                value={form.excerpt}
                onChange={(event) => setField("excerpt", event.target.value)}
                className="min-h-24 resize-y rounded-xl border-border/70 bg-background shadow-none"
              />
            </AdminFormField>
          </div>
        </AdminFormSection>

        <AdminFormSection title="محتوا">
          <AdminFormField label="محتوا" required error={errors.content}>
            <AdminRichTextEditor
              value={form.content}
              onChange={(value) => setField("content", value)}
              placeholder="متن کامل نوشته را اینجا بنویس..."
              stickyToolbar
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="تنظیمات سئو">
          <div className="grid gap-4">
            <AdminFormField label="SEO title">
              <Input
                value={form.seoTitle}
                onChange={(event) => setField("seoTitle", event.target.value)}
                className="h-11 rounded-xl border-border/70 bg-background shadow-none"
              />
            </AdminFormField>

            <AdminFormField label="SEO description">
              <Textarea
                value={form.seoDescription}
                onChange={(event) =>
                  setField("seoDescription", event.target.value)
                }
                className="min-h-24 resize-y rounded-xl border-border/70 bg-background shadow-none"
              />
            </AdminFormField>

            <div className="grid gap-4 lg:grid-cols-2">
              <AdminFormField label="Canonical URL (اختیاری)">
                <Input
                  dir="ltr"
                  value={form.canonicalUrl}
                  onChange={(event) =>
                    setField("canonicalUrl", event.target.value)
                  }
                  placeholder="https://ghafaseh.ir/blog/..."
                  className="h-11 rounded-xl border-border/70 bg-background text-left shadow-none"
                />
              </AdminFormField>

              <AdminFormField label="تصویر Open Graph (اختیاری)">
                <Input
                  dir="ltr"
                  value={form.ogImage}
                  onChange={(event) => setField("ogImage", event.target.value)}
                  placeholder="در صورت خالی‌بودن از بنر استفاده می‌شود"
                  className="h-11 rounded-xl border-border/70 bg-background text-left shadow-none"
                />
              </AdminFormField>
            </div>
          </div>
        </AdminFormSection>

        <AdminFormSection title="ارتباط با قفسه">
          <p className="-mt-1 mb-4 text-sm leading-6 text-muted-foreground">
            کتاب‌ها، نویسنده‌ها و موضوعات مرتبط با این مطلب را انتخاب کنید.
          </p>

          <BlogEntityRelations
            bookIds={form.relatedBookIds}
            authorIds={form.relatedAuthorIds}
            genreIds={form.relatedGenreIds}
            onChange={(field, ids) => setField(field, ids)}
          />
        </AdminFormSection>
      </main>

      {/* Sidebar */}
      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        {/* Banner */}
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3.5">
            <div>
              <p className="text-sm font-bold text-foreground">تصویر بنر</p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                تصویر اصلی مطلب
              </p>
            </div>

            <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              الزامی
            </span>
          </div>

          <div className="p-4">
            <AdminBlogBannerUpload
              value={form.bannerImage}
              onChange={(value) => setField("bannerImage", value)}
              disabled={saving}
            />

            {errors.bannerImage ? (
              <p className="mt-2 text-xs font-medium text-destructive">
                {errors.bannerImage}
              </p>
            ) : null}
          </div>
        </section>

        {/* Publish */}
        <section className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-foreground">انتشار</p>

              <p className="mt-0.5 text-xs text-muted-foreground">
                مدیریت وضعیت نوشته
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                post?.status === "PUBLISHED"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {post?.status === "PUBLISHED" ? "منتشرشده" : "پیش‌نویس"}
            </span>
          </div>

          <div className="space-y-2.5">
            <Button
              onClick={() => submit("PUBLISHED")}
              disabled={saving}
              className="h-11 w-full gap-2 rounded-xl font-bold"
            >
              {saving && form.status === "PUBLISHED" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}

              {mode === "edit" ? "به‌روزرسانی و انتشار" : "انتشار نوشته"}
            </Button>

            <Button
              onClick={() => submit("DRAFT")}
              disabled={saving}
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl border-border/80"
            >
              {saving && form.status === "DRAFT" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              ذخیره پیش‌نویس
            </Button>

            {mode === "edit" && post?.status === "PUBLISHED" ? (
              <Button
                onClick={() => submit("DRAFT")}
                disabled={saving}
                variant="ghost"
                className="h-10 w-full rounded-xl text-muted-foreground"
              >
                خروج از انتشار
              </Button>
            ) : null}
          </div>

          <div className="my-3 border-t border-border/60" />

          <Button
            asChild
            type="button"
            variant="ghost"
            className="h-10 w-full gap-2 rounded-xl text-muted-foreground"
          >
            <Link href="/admin/blog">
              <ArrowRight className="h-4 w-4" />
              بازگشت به لیست
            </Link>
          </Button>
        </section>
      </aside>
    </div>
  );
}

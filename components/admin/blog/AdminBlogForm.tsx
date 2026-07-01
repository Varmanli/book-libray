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
  const [errors, setErrors] = useState<Partial<Record<keyof BlogFormState, string>>>({});

  const setField = <K extends keyof BlogFormState>(key: K, value: BlogFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof BlogFormState, string>> = {};
    if (!form.title.trim()) nextErrors.title = "عنوان نوشته الزامی است.";
    if (!form.categoryId) nextErrors.categoryId = "انتخاب دسته‌بندی الزامی است.";
    if (!form.excerpt.trim()) nextErrors.excerpt = "خلاصه کوتاه الزامی است.";
    if (!form.content.trim()) nextErrors.content = "محتوا الزامی است.";
    if (!form.bannerImage?.trim()) nextErrors.bannerImage = "تصویر بنر الزامی است.";

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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <AdminFormSection title="اطلاعات اصلی نوشته">
          <div className="grid gap-5 lg:grid-cols-2">
            <AdminFormField label="عنوان نوشته" required error={errors.title}>
              <Input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                className="h-12 rounded-2xl border-border/70 bg-background/75"
              />
            </AdminFormField>

            <AdminFormField label="دسته‌بندی" required error={errors.categoryId}>
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
                className="min-h-28 rounded-[1.35rem] border-border/70 bg-background/75"
              />
            </AdminFormField>
          </div>
        </AdminFormSection>

        <AdminFormSection title="تصویر بنر">
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
        </AdminFormSection>

        <AdminFormSection title="محتوا">
          <AdminFormField label="محتوا" required error={errors.content}>
            <AdminRichTextEditor
              value={form.content}
              onChange={(value) => setField("content", value)}
              placeholder="متن کامل نوشته را اینجا بنویس..."
            />
          </AdminFormField>
        </AdminFormSection>

        <AdminFormSection title="تنظیمات سئو">
          <div className="grid gap-5">
            <AdminFormField label="SEO title">
              <Input
                value={form.seoTitle}
                onChange={(event) => setField("seoTitle", event.target.value)}
                className="h-12 rounded-2xl border-border/70 bg-background/75"
              />
            </AdminFormField>

            <AdminFormField label="SEO description">
              <Textarea
                value={form.seoDescription}
                onChange={(event) => setField("seoDescription", event.target.value)}
                className="min-h-28 rounded-[1.35rem] border-border/70 bg-background/75"
              />
            </AdminFormField>
          </div>
        </AdminFormSection>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-[1.8rem] border border-primary/15 bg-primary/8 p-5 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.85)]">
          <p className="text-sm font-black text-foreground">انتشار</p>
          <div className="mt-5 space-y-3">
            <Button
              onClick={() => submit("DRAFT")}
              disabled={saving}
              variant="outline"
              className="h-12 w-full rounded-2xl gap-2"
            >
              {saving && form.status === "DRAFT" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              ذخیره پیش‌نویس
            </Button>

            <Button
              onClick={() => submit("PUBLISHED")}
              disabled={saving}
              className="h-12 w-full rounded-2xl gap-2"
            >
              {saving && form.status === "PUBLISHED" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {mode === "edit" ? "به‌روزرسانی و انتشار" : "انتشار نوشته"}
            </Button>

            {mode === "edit" && post?.status === "PUBLISHED" ? (
              <Button
                onClick={() => submit("DRAFT")}
                disabled={saving}
                variant="ghost"
                className="h-12 w-full rounded-2xl"
              >
                خروج از انتشار
              </Button>
            ) : null}

            <Button asChild type="button" variant="ghost" className="h-12 w-full rounded-2xl">
              <Link href="/admin/blog">
                <ArrowRight className="h-4 w-4" />
                بازگشت به لیست
              </Link>
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

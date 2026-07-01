"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ExternalLink, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

import AdminFormField from "@/components/admin/AdminFormField";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminRichTextEditor from "@/components/admin/AdminRichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminStaticPageDetail } from "@/lib/static-pages/service";

type StaticPageFormState = {
  title: string;
  subtitle: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  status: "DRAFT" | "PUBLISHED";
};

function toFormState(page: AdminStaticPageDetail): StaticPageFormState {
  return {
    title: page.title ?? "",
    subtitle: page.subtitle ?? "",
    content: page.content ?? "",
    seoTitle: page.seoTitle ?? "",
    seoDescription: page.seoDescription ?? "",
    status: page.status ?? "PUBLISHED",
  };
}

export default function AdminStaticPageForm({
  page,
}: {
  page: AdminStaticPageDetail;
}) {
  const router = useRouter();
  const [form, setForm] = useState<StaticPageFormState>(() => toFormState(page));
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | undefined>();

  const setField = <K extends keyof StaticPageFormState>(
    key: K,
    value: StaticPageFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (key === "title") setTitleError(undefined);
  };

  const save = async (status: "DRAFT" | "PUBLISHED") => {
    if (!form.title.trim()) {
      setTitleError("عنوان صفحه الزامی است.");
      toast.error("عنوان صفحه الزامی است.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || null,
        content: form.content,
        seoTitle: form.seoTitle.trim() || null,
        seoDescription: form.seoDescription.trim() || null,
        status,
      };

      const response = await fetch(`/api/admin/static-pages/${page.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        toast.error(data.error || "ذخیره صفحه ناموفق بود.");
        return;
      }

      setForm((current) => ({ ...current, status }));
      toast.success(data.message || "صفحه ذخیره شد.");
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
        <AdminFormSection title="اطلاعات اصلی صفحه">
          <div className="space-y-5">
            <AdminFormField label="عنوان" required error={titleError}>
              <Input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                className="h-12 rounded-2xl border-border/70 bg-background/75"
              />
            </AdminFormField>

            <AdminFormField label="زیرعنوان">
              <Textarea
                value={form.subtitle}
                onChange={(event) => setField("subtitle", event.target.value)}
                className="min-h-24 rounded-[1.35rem] border-border/70 bg-background/75"
                placeholder="یک توضیح کوتاه که زیر عنوان صفحه نمایش داده می‌شود..."
              />
            </AdminFormField>
          </div>
        </AdminFormSection>

        <AdminFormSection title="محتوا">
          <AdminFormField label="محتوای صفحه">
            <AdminRichTextEditor
              value={form.content}
              onChange={(value) => setField("content", value)}
              placeholder="محتوای کامل صفحه را اینجا بنویس..."
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
                placeholder="اگر خالی بماند از عنوان صفحه استفاده می‌شود."
              />
            </AdminFormField>

            <AdminFormField label="SEO description">
              <Textarea
                value={form.seoDescription}
                onChange={(event) =>
                  setField("seoDescription", event.target.value)
                }
                className="min-h-24 rounded-[1.35rem] border-border/70 bg-background/75"
                placeholder="اگر خالی بماند از زیرعنوان صفحه استفاده می‌شود."
              />
            </AdminFormField>
          </div>
        </AdminFormSection>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-[1.8rem] border border-primary/15 bg-primary/8 p-5 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.85)]">
          <p className="text-sm font-black text-foreground">وضعیت انتشار</p>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            وضعیت فعلی:{" "}
            <span className="font-bold text-foreground">
              {form.status === "PUBLISHED" ? "منتشرشده" : "پیش‌نویس"}
            </span>
          </p>

          <div className="mt-5 space-y-3">
            <Button
              onClick={() => save("PUBLISHED")}
              disabled={saving}
              className="h-12 w-full rounded-2xl gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              ذخیره و انتشار
            </Button>

            <Button
              onClick={() => save("DRAFT")}
              disabled={saving}
              variant="outline"
              className="h-12 w-full rounded-2xl gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              ذخیره به‌عنوان پیش‌نویس
            </Button>

            <Button
              asChild
              type="button"
              variant="ghost"
              className="h-12 w-full rounded-2xl"
            >
              <Link href={`/${page.slug}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                پیش‌نمایش عمومی
              </Link>
            </Button>

            <Button
              asChild
              type="button"
              variant="ghost"
              className="h-12 w-full rounded-2xl"
            >
              <Link href="/admin/static-pages">
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2, Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

import AdminFormField from "@/components/admin/AdminFormField";
import AdminFormSection from "@/components/admin/AdminFormSection";
import AdminReferenceCombobox from "@/components/admin/AdminReferenceCombobox";
import AdminReferenceMultiSelect from "@/components/admin/AdminReferenceMultiSelect";
import AdminRichTextEditor from "@/components/admin/AdminRichTextEditor";
import AdminBookExternalLinksEditor, {
  type ExternalLinkDraft,
} from "@/components/admin/AdminBookExternalLinksEditor";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { serializeGenres } from "@/lib/book/genres";
import { sanitizeRichTextHtml } from "@/lib/content/rich-text";

const COMMON_LANGUAGES = [
  "فارسی",
  "انگلیسی",
  "فرانسوی",
  "آلمانی",
  "عربی",
  "روسی",
  "ترکی",
  "اسپانیایی",
  "ایتالیایی",
];

type FormState = {
  title: string;
  originalTitle: string;
  author: string;
  genres: string[];
  description: string;
  language: string;
  country: string;
  publisher: string;
  translator: string;
  pageCount: string;
  isbn: string;
  editionLabel: string;
  publishedYear: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export interface AdminBookFormInitialValues {
  id: string;
  slug: string | null;
  title: string;
  originalTitle: string | null;
  author: string;
  genres: string[];
  description: string | null;
  language: string | null;
  country: string | null;
  publisher: string | null;
  translator: string | null;
  pageCount: number | null;
  isbn: string | null;
  editionLabel: string | null;
  publishedYear: number | null;
  coverImage: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  externalLinks?: ExternalLinkDraft[];
}

const EMPTY: FormState = {
  title: "",
  originalTitle: "",
  author: "",
  genres: [],
  description: "",
  language: "",
  country: "",
  publisher: "",
  translator: "",
  pageCount: "",
  isbn: "",
  editionLabel: "",
  publishedYear: "",
  status: "APPROVED",
};

function toFormState(initial: AdminBookFormInitialValues): FormState {
  return {
    title: initial.title ?? "",
    originalTitle: initial.originalTitle ?? "",
    author: initial.author ?? "",
    genres: initial.genres ?? [],
    description: initial.description ?? "",
    language: initial.language ?? "",
    country: initial.country ?? "",
    publisher: initial.publisher ?? "",
    translator: initial.translator ?? "",
    pageCount: initial.pageCount != null ? String(initial.pageCount) : "",
    isbn: initial.isbn ?? "",
    editionLabel: initial.editionLabel ?? "",
    publishedYear:
      initial.publishedYear != null ? String(initial.publishedYear) : "",
    status: initial.status ?? "APPROVED",
  };
}

interface AdminBookFormProps {
  mode: "create" | "edit";
  /** برای حالت ویرایش: شناسه‌ی کتاب کانونی و مقادیر اولیه. */
  bookId?: string;
  initialValues?: AdminBookFormInitialValues;
}

/**
 * فرم مشترکِ ساخت/ویرایش کتاب کاتالوگ در پنل ادمین. هویت = CatalogBook.
 * در حالت ساخت → POST /api/admin/books، در حالت ویرایش → PATCH /api/admin/books/[id].
 */
export default function AdminBookForm({
  mode,
  bookId,
  initialValues,
}: AdminBookFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initialValues ? toFormState(initialValues) : EMPTY,
  );
  const [cover, setCover] = useState<string | null>(
    initialValues?.coverImage ?? null,
  );
  const [links, setLinks] = useState<ExternalLinkDraft[]>(
    initialValues?.externalLinks ?? [],
  );
  const [regenerateSlug, setRegenerateSlug] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const isEdit = mode === "edit";

  const hasRequiredValues =
    form.title.trim() &&
    form.author.trim() &&
    form.genres.length > 0 &&
    Number(form.pageCount) > 0;

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.title.trim()) nextErrors.title = "عنوان کتاب الزامی است.";
    if (!form.author.trim()) nextErrors.author = "انتخاب نویسنده الزامی است.";
    if (form.genres.length === 0)
      nextErrors.genres = "حداقل یک دسته‌بندی انتخاب کن.";

    const pages = Number(form.pageCount);
    if (!pages || pages < 1) nextErrors.pageCount = "تعداد صفحات معتبر وارد کن.";

    if (form.publishedYear.trim()) {
      const year = Number(form.publishedYear);
      if (!year || year < 0 || year > 3000) {
        nextErrors.publishedYear = "سال انتشار معتبر نیست.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  /**
   * لینک‌های آماده‌ی ارسال: ردیف‌های بدون URL حذف می‌شوند. در صورت خطای اعتبار
   * (URL نامعتبر یا «سایر» بدون برچسب) null برمی‌گرداند و خطا نشان می‌دهد.
   */
  const buildLinksPayload = () => {
    const cleaned = links.filter((l) => l.url.trim());
    for (const link of cleaned) {
      if (!/^https?:\/\//i.test(link.url.trim())) {
        toast.error("آدرس لینک باید با http:// یا https:// شروع شود.");
        return null;
      }
      if (link.provider === "other" && !link.label.trim()) {
        toast.error("برای لینک با فروشگاه «سایر» وارد کردن برچسب الزامی است.");
        return null;
      }
    }
    return cleaned.map((l, index) => ({
      provider: l.provider,
      type: l.type,
      url: l.url.trim(),
      label: l.label.trim() || null,
      isActive: l.isActive,
      sortOrder: index,
    }));
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("چند فیلد مهم هنوز کامل نشده است.");
      return;
    }

    const externalLinks = buildLinksPayload();
    if (externalLinks === null) return;

    setSaving(true);
    try {
      if (isEdit && bookId) {
        // PATCH: همه‌ی فیلدها صریح ارسال می‌شوند (null = پاک‌کردن مقدار).
        const payload = {
          title: form.title.trim(),
          author: form.author.trim(),
          genre: serializeGenres(form.genres),
          originalTitle: form.originalTitle.trim() || null,
          description: form.description.trim()
            ? sanitizeRichTextHtml(form.description)
            : null,
          language: form.language.trim() || null,
          country: form.country.trim() || null,
          publisher: form.publisher.trim() || null,
          translator: form.translator.trim() || null,
          isbn: form.isbn.trim() || null,
          editionLabel: form.editionLabel.trim() || null,
          pageCount: Number(form.pageCount),
          publishedYear: form.publishedYear.trim()
            ? Number(form.publishedYear)
            : null,
          coverImage: cover ?? null,
          status: form.status,
          regenerateSlug,
          externalLinks,
        };

        const res = await fetch(`/api/admin/books/${bookId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) {
          toast.error(data.error || "ذخیره‌ی تغییرات ناموفق بود.");
          return;
        }
        toast.success(data.message || "تغییرات ذخیره شد.");
        router.push("/admin/books");
        router.refresh();
        return;
      }

      // create
      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        author: form.author.trim(),
        genre: serializeGenres(form.genres),
        pageCount: Number(form.pageCount),
      };
      if (form.originalTitle.trim())
        payload.originalTitle = form.originalTitle.trim();
      if (form.description.trim())
        payload.description = sanitizeRichTextHtml(form.description);
      if (form.language.trim()) payload.language = form.language.trim();
      if (form.country.trim()) payload.country = form.country.trim();
      if (form.publisher.trim()) payload.publisher = form.publisher.trim();
      if (form.translator.trim()) payload.translator = form.translator.trim();
      if (form.isbn.trim()) payload.isbn = form.isbn.trim();
      if (form.editionLabel.trim())
        payload.editionLabel = form.editionLabel.trim();
      if (form.publishedYear.trim())
        payload.publishedYear = Number(form.publishedYear);
      if (cover) payload.coverImage = cover;
      if (externalLinks.length > 0) payload.externalLinks = externalLinks;

      const res = await fetch("/api/admin/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        toast.error(data.error || "ثبت کتاب ناموفق بود.");
        return;
      }
      toast.success(data.message || "کتاب با موفقیت ثبت شد.");
      router.push("/admin/books");
      router.refresh();
    } catch {
      toast.error("ارتباط با سرور برقرار نشد.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-10">
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <AdminFormSection title="اطلاعات اصلی کتاب">
            <div className="grid gap-5 lg:grid-cols-2">
              <AdminFormField label="عنوان کتاب" required error={errors.title}>
                <Input
                  value={form.title}
                  onChange={(event) => setField("title", event.target.value)}
                  className="h-12 rounded-2xl border-border/70 bg-background/75"
                />
              </AdminFormField>

              <AdminFormField label="عنوان به زبان اصلی">
                <Input
                  dir="ltr"
                  value={form.originalTitle}
                  onChange={(event) =>
                    setField("originalTitle", event.target.value)
                  }
                  className="h-12 rounded-2xl border-border/70 bg-background/75"
                />
              </AdminFormField>
            </div>
          </AdminFormSection>

          <AdminFormSection title="نویسنده و عوامل">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminFormField label="نویسنده" required error={errors.author}>
                <AdminReferenceCombobox
                  type="AUTHOR"
                  value={form.author}
                  onChange={(value) => setField("author", value)}
                  placeholder="جست‌وجو در نویسنده‌ها..."
                  manageHref="/admin/reference"
                  invalid={Boolean(errors.author)}
                />
              </AdminFormField>

              <AdminFormField label="مترجم">
                <AdminReferenceCombobox
                  type="TRANSLATOR"
                  value={form.translator}
                  onChange={(value) => setField("translator", value)}
                  placeholder="جست‌وجو در مترجم‌ها..."
                  manageHref="/admin/reference"
                />
              </AdminFormField>

              <AdminFormField label="ناشر">
                <AdminReferenceCombobox
                  type="PUBLISHER"
                  value={form.publisher}
                  onChange={(value) => setField("publisher", value)}
                  placeholder="جست‌وجو در ناشرها..."
                  manageHref="/admin/reference"
                />
              </AdminFormField>

              <AdminFormField label="کشور">
                <AdminReferenceCombobox
                  type="COUNTRY"
                  value={form.country}
                  onChange={(value) => setField("country", value)}
                  placeholder="جست‌وجو در کشورها..."
                  manageHref="/admin/reference"
                />
              </AdminFormField>
            </div>
          </AdminFormSection>

          <AdminFormSection title="دسته‌بندی‌ها و مشخصات">
            <div className="space-y-5">
              <AdminFormField label="دسته‌بندی‌ها" required error={errors.genres}>
                <AdminReferenceMultiSelect
                  type="GENRE"
                  values={form.genres}
                  onChange={(values) => setField("genres", values)}
                  placeholder="جست‌وجو و افزودن دسته‌بندی..."
                  invalid={Boolean(errors.genres)}
                />
              </AdminFormField>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <AdminFormField label="زبان">
                  <AdminReferenceCombobox
                    value={form.language}
                    onChange={(value) => setField("language", value)}
                    placeholder="جست‌وجو در زبان‌ها..."
                    localOptions={COMMON_LANGUAGES}
                  />
                </AdminFormField>

                <AdminFormField
                  label="تعداد صفحات"
                  required
                  error={errors.pageCount}
                >
                  <Input
                    inputMode="numeric"
                    value={form.pageCount}
                    onChange={(event) =>
                      setField(
                        "pageCount",
                        event.target.value.replace(/[^0-9]/g, ""),
                      )
                    }
                    className="h-12 rounded-2xl border-border/70 bg-background/75"
                  />
                </AdminFormField>

                <AdminFormField label="سال انتشار" error={errors.publishedYear}>
                  <Input
                    inputMode="numeric"
                    value={form.publishedYear}
                    onChange={(event) =>
                      setField(
                        "publishedYear",
                        event.target.value.replace(/[^0-9]/g, ""),
                      )
                    }
                    className="h-12 rounded-2xl border-border/70 bg-background/75"
                  />
                </AdminFormField>

                <AdminFormField label="شابک">
                  <Input
                    dir="ltr"
                    value={form.isbn}
                    onChange={(event) => setField("isbn", event.target.value)}
                    className="h-12 rounded-2xl border-border/70 bg-background/75"
                  />
                </AdminFormField>

                <AdminFormField label="عنوان نسخه/چاپ">
                  <Input
                    value={form.editionLabel}
                    onChange={(event) =>
                      setField("editionLabel", event.target.value)
                    }
                    className="h-12 rounded-2xl border-border/70 bg-background/75"
                  />
                </AdminFormField>
              </div>
            </div>
          </AdminFormSection>

          <AdminFormSection title="تصویر جلد">
            <div>
              <AdminFormField label="تصویر جلد">
                <ImageUploader
                  value={cover}
                  onChange={(url) => setCover(url || null)}
                  folder="covers"
                  aspect="cover"
                  placeholder="برای انتخاب جلد کلیک کن یا فایل را رها کن"
                  description="JPG، PNG یا WEBP تا ۵۰۰ کیلوبایت"
                  disabled={saving}
                  className="max-w-[220px]"
                />
              </AdminFormField>
            </div>
          </AdminFormSection>

          <AdminFormSection title="توضیحات">
            <AdminFormField label="توضیحات">
              <AdminRichTextEditor
                value={form.description}
                onChange={(value) => setField("description", value)}
                placeholder="خلاصه، فضای اثر، نکات مهم یا معرفی کوتاه کتاب را اینجا بنویس..."
              />
            </AdminFormField>
          </AdminFormSection>

          <AdminFormSection title="لینک‌های خرید و مطالعه">
            <AdminBookExternalLinksEditor value={links} onChange={setLinks} />
          </AdminFormSection>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <div className="rounded-[1.8rem] border border-primary/15 bg-primary/8 p-5 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.85)]">
            <p className="text-sm font-black text-foreground">اکشن‌ها</p>

            <div className="mt-5 space-y-3">
              <Button
                onClick={submit}
                disabled={saving || !hasRequiredValues}
                className="h-12 w-full rounded-2xl gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isEdit ? "ذخیره‌ی تغییرات" : "ثبت کتاب"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/admin/books")}
                disabled={saving}
                className="h-12 w-full rounded-2xl"
              >
                <ArrowRight className="h-4 w-4" />
                بازگشت به لیست کتاب‌ها
              </Button>
            </div>
          </div>

          {isEdit ? (
            <div className="space-y-4 rounded-[1.8rem] border border-border/70 bg-card p-5">
              <AdminFormField label="وضعیت تأیید">
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setField("status", v as FormState["status"])
                  }
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">تأییدشده</SelectItem>
                    <SelectItem value="PENDING">در انتظار</SelectItem>
                    <SelectItem value="REJECTED">ردشده</SelectItem>
                  </SelectContent>
                </Select>
              </AdminFormField>

              <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
                <label className="flex items-start gap-2 text-xs leading-6 text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={regenerateSlug}
                    onChange={(e) => setRegenerateSlug(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[var(--primary)]"
                  />
                  <span>
                    <span className="flex items-center gap-1 font-bold text-foreground">
                      <Link2 className="h-3.5 w-3.5" />
                      بازتولید اسلاگ عمومی
                    </span>
                    آدرس فعلی کتاب پایدار می‌ماند. فقط اگر این گزینه را فعال کنی،
                    اسلاگ از روی عنوان جدید دوباره ساخته می‌شود (ممکن است لینک
                    قبلی را بشکند).
                    {initialValues?.slug ? (
                      <span dir="ltr" className="mt-1 block font-mono text-[11px]">
                        /book/{initialValues.slug}
                      </span>
                    ) : null}
                  </span>
                </label>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

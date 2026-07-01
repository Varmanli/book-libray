"use client";

import React, { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/upload/ImageUploader";
import { ReferenceSelect } from "@/components/reference/ReferenceSelect";
import {
  BookText,
  Users,
  ListChecks,
  ImageIcon,
  Loader2,
  Save,
  AlertCircle,
} from "lucide-react";

export const bookSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  author: z.string().min(1, "نویسنده الزامی است"),
  translator: z.string().optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  genre: z.string().min(1, "ژانر الزامی است"),
  pageCount: z
    .number({ message: "تعداد صفحات را وارد کنید" })
    .min(1, "تعداد صفحات باید حداقل ۱ باشد"),
  // جلد اختیاری است
  cover: z.any().optional(),
  status: z.enum(["UNREAD", "READING", "FINISHED"]).optional(),
  progress: z.number().min(0).max(100).optional(),
});

export type BookFormType = z.infer<typeof bookSchema>;

interface BookFormProps {
  initialValues?: Partial<BookFormType>;
  onSubmit: (data: BookFormType) => Promise<void>;
  submitLabel?: string;
}

/** سرفصل هر بخش از فرم */
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}

/** برچسب فیلد با نشانگر الزامی هم‌تراز */
function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <Label htmlFor={htmlFor} className="gap-1 pb-2 text-foreground/90">
      {children}
      {required && <span className="text-destructive/70">*</span>}
    </Label>
  );
}

/** پیام خطای زیر هر فیلد — خوانا اما ملایم */
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-[13px] text-destructive/90">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}

export default function BookForm({
  initialValues,
  onSubmit,
  submitLabel = "ثبت کتاب",
}: BookFormProps) {
  const router = useRouter();

  const form = useForm<BookFormType>({
    resolver: zodResolver(bookSchema),
    mode: "onTouched",
    defaultValues: {
      title: "",
      author: "",
      translator: "",
      publisher: "",
      description: "",
      country: "",
      genre: "",
      pageCount: 0,
      cover: undefined,
      status: "UNREAD",
      progress: 0,
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!initialValues) return;

    const pageCount =
      initialValues.pageCount === undefined || initialValues.pageCount === null
        ? 0
        : Number(initialValues.pageCount);

    reset({
      title: initialValues.title ?? "",
      author: initialValues.author ?? "",
      translator: initialValues.translator ?? "",
      publisher: initialValues.publisher ?? "",
      description: initialValues.description ?? "",
      country: initialValues.country ?? "",
      genre: initialValues.genre ?? "",
      pageCount,
      cover: initialValues.cover ?? undefined,
      status:
        (initialValues.status as "UNREAD" | "READING" | "FINISHED") ?? "UNREAD",
      progress: initialValues.progress ?? 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-card/70 to-card/40 shadow-xl shadow-black/20"
    >
      <div className="divide-y divide-white/[0.06]">
        {/* ===== اطلاعات اصلی ===== */}
        <section className="px-6 py-7 sm:px-9 sm:py-8">
          <SectionHeader
            icon={BookText}
            title="اطلاعات کتاب"
            description="عنوان و ژانر کتاب"
          />

          <div className="space-y-5">
            <div>
              <FieldLabel htmlFor="title" required>
                عنوان
              </FieldLabel>
              <Input
                id="title"
                {...register("title")}
                aria-invalid={!!errors.title}
                placeholder="مثلاً: صد سال تنهایی"
              />
              <FieldError message={errors.title?.message} />
            </div>

            <div>
              <FieldLabel htmlFor="genre" required>
                ژانر
              </FieldLabel>
              <Controller
                control={control}
                name="genre"
                render={({ field }) => (
                  <ReferenceSelect
                    id="genre"
                    type="GENRE"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    invalid={!!errors.genre}
                    placeholder="جست‌وجو یا افزودن ژانر"
                  />
                )}
              />
              <FieldError message={errors.genre?.message} />
            </div>
          </div>
        </section>

        {/* ===== پدیدآورندگان ===== */}
        <section className="px-6 py-7 sm:px-9 sm:py-8">
          <SectionHeader
            icon={Users}
            title="پدیدآورندگان و نشر"
            description="نویسنده، مترجم، ناشر و کشور"
          />

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="author" required>
                  نویسنده
                </FieldLabel>
                <Controller
                  control={control}
                  name="author"
                  render={({ field }) => (
                    <ReferenceSelect
                      id="author"
                      type="AUTHOR"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      invalid={!!errors.author}
                      placeholder="جست‌وجو یا افزودن نویسنده"
                    />
                  )}
                />
                <FieldError message={errors.author?.message} />
              </div>

              <div>
                <FieldLabel htmlFor="translator">مترجم</FieldLabel>
                <Controller
                  control={control}
                  name="translator"
                  render={({ field }) => (
                    <ReferenceSelect
                      id="translator"
                      type="TRANSLATOR"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="در صورت ترجمه بودن"
                    />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="publisher">ناشر</FieldLabel>
                <Controller
                  control={control}
                  name="publisher"
                  render={({ field }) => (
                    <ReferenceSelect
                      id="publisher"
                      type="PUBLISHER"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="نام انتشارات"
                    />
                  )}
                />
              </div>

              <div>
                <FieldLabel htmlFor="country">کشور</FieldLabel>
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <ReferenceSelect
                      id="country"
                      type="COUNTRY"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="کشور محل انتشار"
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== جزئیات ===== */}
        <section className="px-6 py-7 sm:px-9 sm:py-8">
          <SectionHeader
            icon={ListChecks}
            title="جزئیات"
            description="تعداد صفحات و توضیحات"
          />

          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <FieldLabel htmlFor="pageCount" required>
                  تعداد صفحات
                </FieldLabel>
                <Input
                  id="pageCount"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  {...register("pageCount", { valueAsNumber: true })}
                  aria-invalid={!!errors.pageCount}
                  placeholder="مثلاً: ۳۲۰"
                />
                <FieldError message={errors.pageCount?.message} />
              </div>
            </div>

            <div>
              <FieldLabel htmlFor="description">توضیحات</FieldLabel>
              <Textarea
                id="description"
                {...register("description")}
                className="min-h-36"
                placeholder="خلاصه، یادداشت یا هر توضیحی درباره‌ی کتاب..."
              />
            </div>
          </div>
        </section>

        {/* ===== جلد کتاب ===== */}
        <section className="px-6 py-7 sm:px-9 sm:py-8">
          <SectionHeader
            icon={ImageIcon}
            title="جلد کتاب"
            description="اختیاری — در نبود جلد، تصویر پیش‌فرض نمایش داده می‌شود"
          />

          <Controller
            control={control}
            name="cover"
            render={({ field }) => (
              <ImageUploader
                value={typeof field.value === "string" ? field.value : null}
                onChange={field.onChange}
                folder="covers"
                aspect="cover"
                placeholder="بکشید و رها کنید یا برای انتخاب جلد کلیک کنید"
                description="JPG، PNG یا WEBP تا ۵۰۰ کیلوبایت"
                disabled={isSubmitting}
              />
            )}
          />
          <FieldError message={errors.cover?.message as string | undefined} />
        </section>

        {/* ===== نوار اقدامات ===== */}
        <section className="border-t border-border bg-white/[0.02] px-6 py-5 sm:px-9">
          <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-xs text-muted-foreground">
              فیلدهای دارای <span className="text-destructive/70">*</span> الزامی
              هستند.
            </p>

            <div className="flex w-full gap-3 sm:w-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border-border sm:flex-none"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gap-2 rounded-xl px-8 font-semibold sm:flex-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ثبت...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {submitLabel}
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}

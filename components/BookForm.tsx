"use client";

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Upload, X } from "lucide-react";

export const bookSchema = z.object({
  title: z.string().min(1, "عنوان الزامی است"),
  author: z.string().min(1, "نویسنده الزامی است"),
  translator: z.string().optional(),
  publisher: z.string().optional(),
  description: z.string().optional(),
  country: z.string().optional(),
  genre: z.string().min(1, "ژانر الزامی است"),
  pageCount: z.number().min(1, "تعداد صفحات معتبر نیست"),
  format: z.enum(["PHYSICAL", "ELECTRONIC"]),
  cover: z.any().optional(),
});

export type BookFormType = z.infer<typeof bookSchema>;

interface BookFormProps {
  initialValues?: Partial<BookFormType>;
  onSubmit: (data: BookFormType) => Promise<void>;
}

export default function BookForm({ initialValues, onSubmit }: BookFormProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<BookFormType>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      title: "",
      author: "",
      translator: "",
      publisher: "",
      description: "",
      country: "",
      genre: "",
      pageCount: 0,
      format: "PHYSICAL",
      cover: undefined,
    },
  });

  // debug logs
  useEffect(() => {
    console.log("[BookForm] initialValues changed:", initialValues);
  }, [initialValues]);

  useEffect(() => {
    if (!initialValues) return;

    // normalize pageCount
    const pageCount =
      initialValues.pageCount === undefined || initialValues.pageCount === null
        ? 0
        : Number(initialValues.pageCount);

    const vals: Partial<BookFormType> = {
      title: initialValues.title ?? "",
      author: initialValues.author ?? "",
      translator: initialValues.translator ?? "",
      publisher: initialValues.publisher ?? "",
      description: initialValues.description ?? "",
      country: initialValues.country ?? "",
      genre: initialValues.genre ?? "",
      pageCount,
      format: (initialValues.format as "PHYSICAL" | "ELECTRONIC") ?? "PHYSICAL",
      cover: initialValues.cover ?? undefined,
    };

    // reset all at once
    form.reset(vals as any);

    // additionally set individually (fallback اگر reset اثر نکرد)
    Object.entries(vals).forEach(([k, v]) =>
      form.setValue(k as any, v as any, {
        shouldValidate: false,
        shouldDirty: false,
      })
    );

    // preview handling
    if (initialValues.cover instanceof File) {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = URL.createObjectURL(initialValues.cover);
      previewUrlRef.current = url;
      setPreview(url);
    } else if (typeof initialValues.cover === "string") {
      setPreview(initialValues.cover);
    } else {
      setPreview(null);
    }

    // short delay then log current form values
    setTimeout(() => {
      console.log("[BookForm] after reset getValues:", form.getValues());
    }, 50);

    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    setPreview(url);
    form.setValue("cover", file, { shouldDirty: true, shouldValidate: true });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    form.setValue("cover", undefined, { shouldDirty: true });
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 rounded-3xl p-10 bg-[#242428] shadow-xl"
    >
      {/* Upload */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1">
          <Label className="font-semibold text-gray-200">جلد کتاب</Label>
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed"
          >
            <Upload className="w-5 h-5" />
            انتخاب تصویر
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          <p className="text-xs text-gray-400 mt-2">فرمت‌های مجاز: JPG, PNG</p>
        </div>

        {preview && (
          <div className="relative w-36 h-52 border rounded-2xl overflow-hidden shadow-md">
            {/* fallback to img if next/image errors */}
            {preview.startsWith("blob:") || preview.startsWith("data:") ? (
              // blob/data url => use img
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                className="object-cover w-full h-full"
              />
            ) : (
              <Image
                src={preview}
                alt="پیش‌نمایش جلد"
                fill
                className="object-cover"
              />
            )}
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* title */}
      <div>
        <Label className="pb-2">عنوان</Label>
        <Input {...form.register("title")} placeholder="مثلاً: صد سال تنهایی" />
      </div>

      {/* author / translator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="pb-2">نویسنده</Label>
          <Input {...form.register("author")} />
        </div>
        <div>
          <Label className="pb-2">مترجم</Label>
          <Input {...form.register("translator")} />
        </div>
      </div>

      {/* publisher / country */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="pb-2">ناشر</Label>
          <Input {...form.register("publisher")} />
        </div>
        <div>
          <Label className="pb-2">کشور</Label>
          <Input {...form.register("country")} />
        </div>
      </div>

      {/* genre / pageCount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label className="pb-2">ژانر</Label>
          <Input {...form.register("genre")} />
        </div>
        <div>
          <Label className="pb-2">تعداد صفحات</Label>
          <Input
            type="number"
            {...form.register("pageCount", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <Label className="pb-2">توضیحات</Label>
        <Textarea {...form.register("description")} className="h-70" />
      </div>

      <div>
        <Label className="pb-2">فرمت</Label>
        <Controller
          control={form.control}
          name="format"
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={(v) => field.onChange(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="انتخاب فرمت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHYSICAL">چاپی</SelectItem>
                <SelectItem value="ELECTRONIC">الکترونیکی</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <Button
        type="submit"
        className="w-full text-lg py-5 rounded-2xl bg-primary"
      >
        ثبت کتاب
      </Button>
    </form>
  );
}

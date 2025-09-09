"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
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

// ✅ اسکیمای ولیدیشن
const bookSchema = z.object({
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

type BookForm = z.infer<typeof bookSchema>;

export default function AddBookPage() {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  type BookForm = z.infer<typeof bookSchema>;
  const form = useForm<BookForm>({
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
    },
  });

  const onSubmit = (data: BookForm) => {
    console.log("📚 فرم ثبت شد:", data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("cover", file);
      const url = URL.createObjectURL(file);
      setPreview(url);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    form.setValue("cover", undefined);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-primary">
        📚 ثبت کتاب جدید
      </h1>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 bg  rounded-3xl p-10 bg-[#242428] shadow-xl"
      >
        {/* آپلود جلد */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1">
            <Label className="font-semibold text-gray-200">جلد کتاب</Label>
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              className="mt-3 w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
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
            <p className="text-xs text-gray-400 mt-2">
              فرمت‌های مجاز: JPG, PNG
            </p>
          </div>

          {preview && (
            <div className="relative w-36 h-52 border rounded-2xl overflow-hidden shadow-md hover:scale-105 transition-transform duration-200">
              <Image
                src={preview}
                alt="پیش‌نمایش جلد"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* عنوان */}
        <div>
          <Label>عنوان</Label>
          <Input
            {...form.register("title")}
            placeholder="مثلاً: صد سال تنهایی"
            className="mt-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
          {form.formState.errors.title && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        {/* نویسنده + مترجم */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>نویسنده</Label>
            <Input
              {...form.register("author")}
              placeholder="مثلاً: گابریل گارسیا مارکز"
              className="mt-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
          <div>
            <Label>مترجم</Label>
            <Input
              {...form.register("translator")}
              placeholder="مثلاً: بهمن فرزانه"
              className="mt-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
        </div>

        {/* ناشر + کشور */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>ناشر</Label>
            <Input
              {...form.register("publisher")}
              placeholder="مثلاً: نشر نی"
              className="mt-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
          <div>
            <Label>کشور</Label>
            <Input
              {...form.register("country")}
              placeholder="مثلاً: کلمبیا"
              className="mt-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
        </div>

        {/* ژانر + تعداد صفحات */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>ژانر</Label>
            <Input
              {...form.register("genre")}
              placeholder="مثلاً: رئالیسم جادویی"
              className="mt-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
          <div>
            <Label>تعداد صفحات</Label>
            <Input
              type="number"
              {...form.register("pageCount")}
              className="mt-2 focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
        </div>

        {/* توضیحات */}
        <div>
          <Label>توضیحات</Label>
          <Textarea
            {...form.register("description")}
            placeholder="خلاصه‌ای از کتاب..."
            className="mt-2 min-h-[140px] focus:ring-2 focus:ring-primary focus:border-primary transition"
          />
        </div>

        {/* فرمت */}
        <div>
          <Label>فرمت</Label>
          <Select
            defaultValue="PHYSICAL"
            onValueChange={(val) =>
              form.setValue("format", val as "PHYSICAL" | "ELECTRONIC")
            }
          >
            <SelectTrigger className="mt-2 focus:ring-2 focus:ring-primary transition">
              <SelectValue placeholder="انتخاب فرمت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PHYSICAL">چاپی</SelectItem>
              <SelectItem value="ELECTRONIC">الکترونیکی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* دکمه ثبت */}
        <Button
          type="submit"
          className="w-full text-lg py-5 rounded-2xl bg-primary hover:bg-primary-dark transition-all cursor-pointer"
        >
          ثبت کتاب
        </Button>
      </form>
    </div>
  );
}

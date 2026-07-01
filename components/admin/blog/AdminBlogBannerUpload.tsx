"use client";

import AdminFormField from "@/components/admin/AdminFormField";
import { ImageUploader } from "@/components/upload/ImageUploader";

export default function AdminBlogBannerUpload({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <AdminFormField label="تصویر بنر" required>
      <ImageUploader
        value={value}
        onChange={(url) => onChange(url || null)}
        folder="blog"
        aspect="wide"
        description="JPG، PNG یا WEBP تا ۵۰۰ کیلوبایت"
        placeholder="برای انتخاب تصویر بنر کلیک کن یا فایل را رها کن"
        disabled={disabled}
      />
    </AdminFormField>
  );
}

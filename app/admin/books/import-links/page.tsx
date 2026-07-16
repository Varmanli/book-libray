import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { requireAdmin } from "@/lib/admin/permissions";
import IranKetabPreviewClient from "./IranKetabPreviewClient";

export const dynamic = "force-dynamic";

export default async function IranKetabImportLinksPage() {
  await requireAdmin();
  return (
    <div className="w-full">
      <div className="mb-1 inline-flex rounded-full border bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
        ورود هوشمند اطلاعات
      </div>
      <AdminPageHeader
        title="دریافت کتاب از ایران‌کتاب"
        description="لینک کتاب را وارد کنید؛ اطلاعات، نسخه‌ها، مراجع و کاورها پیش از ثبت نهایی بررسی و تطبیق داده می‌شوند."
        action={null}
      />
      <IranKetabPreviewClient />
    </div>
  );
}

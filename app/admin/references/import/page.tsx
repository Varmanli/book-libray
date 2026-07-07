import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminReferenceImportPage from "@/components/admin/AdminReferenceImportPage";
import { requireAdmin } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export default async function AdminReferenceImportRoute() {
  await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="ایمپورت پروفایل نویسنده، مترجم و ناشر"
        description="فایل JSON پروفایل‌ها را بررسی و ثبت کنید، سپس تصویر نویسنده‌ها، مترجم‌ها یا لوگوی ناشرها را آپلود و متصل کنید."
      />
      <AdminReferenceImportPage />
    </div>
  );
}

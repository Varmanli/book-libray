import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBookCoversPage from "@/components/admin/AdminBookCoversPage";
import { requireAdmin } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export default async function AdminBookCoversRoute() {
  await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="مدیریت کاور نسخه‌ها"
        description="نسخه‌هایی را که هنوز کاور واقعی آپلودشده ندارند پیدا کنید، فایل مناسب را متصل کنید و کاورهای ایران‌کتاب را بعد از ورود گروهی سریع‌تر سامان بدهید."
      />
      <AdminBookCoversPage />
    </div>
  );
}

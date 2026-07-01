import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBlogForm from "@/components/admin/blog/AdminBlogForm";
import { listBlogCategoryOptions } from "@/lib/blog/service";

export const dynamic = "force-dynamic";

export default async function AdminNewBlogPage() {
  const categories = await listBlogCategoryOptions();
  return (
    <div className="space-y-6">
      <AdminPageHeader title="افزودن نوشته" description="ایجاد نوشته جدید بلاگ" />
      <AdminBlogForm mode="create" categories={categories} />
    </div>
  );
}

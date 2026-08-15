import AdminBlogForm from "@/components/admin/blog/AdminBlogForm";
import { listBlogCategoryOptions } from "@/lib/blog/service";

export const dynamic = "force-dynamic";

export default async function AdminNewBlogPage() {
  const categories = await listBlogCategoryOptions();
  return (
    <div className="space-y-6">
      <AdminBlogForm mode="create" categories={categories} />
    </div>
  );
}

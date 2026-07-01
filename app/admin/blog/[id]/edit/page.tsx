import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminBlogForm from "@/components/admin/blog/AdminBlogForm";
import {
  getAdminBlogPostById,
  listBlogCategoryOptions,
} from "@/lib/blog/service";

export const dynamic = "force-dynamic";

export default async function AdminEditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post, categories] = await Promise.all([
    getAdminBlogPostById(id),
    listBlogCategoryOptions(),
  ]);
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader title="ویرایش نوشته" description={post.title} />
      <AdminBlogForm mode="edit" post={post} categories={categories} />
    </div>
  );
}

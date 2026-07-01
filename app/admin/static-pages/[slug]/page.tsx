import { notFound } from "next/navigation";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStaticPageForm from "@/components/admin/static-pages/AdminStaticPageForm";
import { getAdminStaticPageBySlug } from "@/lib/static-pages/service";

export const dynamic = "force-dynamic";

export default async function AdminEditStaticPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getAdminStaticPageBySlug(decodeURIComponent(slug));
  if (!page) notFound();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="ویرایش صفحه ثابت"
        description={`${page.title} — /${page.slug}`}
      />
      <AdminStaticPageForm page={page} />
    </div>
  );
}

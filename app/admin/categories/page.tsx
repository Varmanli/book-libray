import ReferenceManager from "@/components/admin/ReferenceManager";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <ReferenceManager
      type="GENRE"
      title="دسته‌بندی‌ها"
      description="مدیریت ژانرها و دسته‌بندی‌های کتاب"
      itemLabel="دسته‌بندی"
    />
  );
}

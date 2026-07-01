import ReferenceManager from "@/components/admin/ReferenceManager";

export const dynamic = "force-dynamic";

export default function AdminTranslatorsPage() {
  return (
    <ReferenceManager
      type="TRANSLATOR"
      title="مترجم‌ها"
      description="مدیریت فهرست مترجمان"
      itemLabel="مترجم"
    />
  );
}

import ReferenceManager from "@/components/admin/ReferenceManager";

export const dynamic = "force-dynamic";

export default function AdminAuthorsPage() {
  return (
    <ReferenceManager
      type="AUTHOR"
      title="نویسنده‌ها"
      description="مدیریت فهرست نویسندگان"
      itemLabel="نویسنده"
    />
  );
}

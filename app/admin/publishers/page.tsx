import ReferenceManager from "@/components/admin/ReferenceManager";

export const dynamic = "force-dynamic";

export default function AdminPublishersPage() {
  return (
    <ReferenceManager
      type="PUBLISHER"
      title="ناشرها"
      description="مدیریت فهرست ناشران"
      itemLabel="ناشر"
    />
  );
}

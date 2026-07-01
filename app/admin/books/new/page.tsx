import AdminBookForm from "@/components/admin/AdminBookForm";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

export const dynamic = "force-dynamic";

export default function AdminNewBookPage() {
  return (
    <div>
      <AdminPageHeader
        title="افزودن کتاب"
        description="ثبت یک کتاب تازه در کاتالوگ سراسری"
      />
      <AdminBookForm mode="create" />
    </div>
  );
}

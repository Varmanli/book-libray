import Link from "next/link";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/permissions";
import ImportBooksClient from "@/app/admin/books/import/ImportBooksClient";

export const dynamic = "force-dynamic";

export default async function AdminBooksImportPage() {
  await requireAdmin();

  return (
    <div>
      <AdminPageHeader
        title="ورود گروهی کتاب‌ها"
        description="فایل JSON یا Excel را بارگذاری کنید، ابتدا پیش‌نمایش و خطاها را بررسی کنید، سپس کتاب‌ها و نسخه‌های معتبر را وارد دیتابیس کنید."
        action={
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/admin/books">بازگشت به کتاب‌ها</Link>
          </Button>
        }
      />
      <ImportBooksClient />
    </div>
  );
}

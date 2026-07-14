import Link from "next/link";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/permissions";
import IranKetabPreviewClient from "./IranKetabPreviewClient";

export const dynamic = "force-dynamic";

export default async function IranKetabImportLinksPage() {
  await requireAdmin();
  return (
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="mb-2 inline-flex rounded-full border bg-primary/8 px-3 py-1 text-xs font-bold text-primary">
        ورود هوشمند اطلاعات
      </div>
      <AdminPageHeader
        title="دریافت کتاب از ایران‌کتاب"
        description="لینک کتاب را وارد کنید؛ اطلاعات، نسخه‌ها، مراجع و کاورها پیش از ثبت نهایی بررسی و تطبیق داده می‌شوند."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/admin/books/import-history">تاریخچه ورود</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-xl">
              <Link href="/admin/books">بازگشت به کتاب‌ها</Link>
            </Button>
          </div>
        }
      />
      <IranKetabPreviewClient />
    </div>
  );
}

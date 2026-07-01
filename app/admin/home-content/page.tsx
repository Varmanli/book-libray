import AdminPageHeader from "@/components/admin/AdminPageHeader";
import FeaturedBooksManager from "@/components/admin/FeaturedBooksManager";
import HeroSlidesManager from "@/components/admin/HeroSlidesManager";

export const dynamic = "force-dynamic";

export default function AdminHomeContentPage() {
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="محتوای صفحه اصلی"
        description="مدیریت اسلایدر و کتاب‌های پیشنهادیِ صفحه‌ی اصلی"
      />

      <HeroSlidesManager />

      <FeaturedBooksManager />
    </div>
  );
}

import {
  BookCopy,
  Eye,
  Flame,
  Heart,
  MessageSquareQuote,
  NotebookPen,
  Users,
} from "lucide-react";

import { getAdminOverview } from "@/lib/admin/service";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";

export const dynamic = "force-dynamic";

// Analytics that require signals the app doesn't track yet (per-book views,
// activity ranking). Listed as a clear boundary instead of fake data.
const PENDING_ANALYTICS = [
  { label: "فعال‌ترین کاربران", icon: Flame },
  { label: "بیشترین کتاب‌های افزوده‌شده", icon: BookCopy },
  { label: "پراستنادترین کتاب‌ها", icon: MessageSquareQuote },
  { label: "محبوب‌ترین تکه‌ها", icon: Heart },
  { label: "پربازدیدترین کتاب‌ها", icon: Eye },
];

export default async function AdminStatsPage() {
  const { counts } = await getAdminOverview();

  return (
    <div>
      <AdminPageHeader title="آمار" description="نمای کلی اعداد سامانه" />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <AdminStatCard label="کاربران" value={counts.users} icon={Users} />
        <AdminStatCard label="کتاب‌های کاتالوگ" value={counts.books} icon={BookCopy} />
        <AdminStatCard label="تکه‌های کتاب" value={counts.quotes} icon={MessageSquareQuote} />
        <AdminStatCard label="یادداشت‌ها" value={counts.notes} icon={NotebookPen} />
        <AdminStatCard label="در انتظار تأیید (کتاب)" value={counts.pendingBooks} icon={BookCopy} />
        <AdminStatCard label="در انتظار تأیید (مرجع)" value={counts.pendingReferences} icon={MessageSquareQuote} />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-bold text-foreground">تحلیل‌های پیشرفته</h2>
        <div className="rounded-2xl border border-dashed border-border bg-card p-5">
          <p className="text-sm leading-7 text-muted-foreground">
            موارد زیر به سیستم رهگیری بازدید و رتبه‌بندی فعالیت نیاز دارند که هنوز
            پیاده‌سازی نشده است. مرز سرویس آماده است تا با افزودن داده‌ی واقعی
            تکمیل شود.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PENDING_ANALYTICS.map((a) => (
              <div
                key={a.label}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3"
              >
                <span className="flex items-center gap-2 text-sm text-foreground">
                  <a.icon className="h-4 w-4 text-muted-foreground" />
                  {a.label}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  به‌زودی
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

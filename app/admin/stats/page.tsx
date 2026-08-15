import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminAnalyticsDashboard from "@/components/admin/AdminAnalyticsDashboard";
import { getAdminAnalytics, parseAnalyticsPeriod } from "@/lib/admin/analytics";

export const dynamic = "force-dynamic";

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const period = parseAnalyticsPeriod((await searchParams).period);
  const analytics = await getAdminAnalytics(period);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="تحلیل و آمار" description="تصویری روشن از بازدید، رشد و تعامل واقعی کاربران قفسه" />
      <AdminAnalyticsDashboard analytics={analytics} />
    </div>
  );
}

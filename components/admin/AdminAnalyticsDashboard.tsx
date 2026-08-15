"use client";

import { useRouter } from "next/navigation";
import {
  Activity,
  BookOpen,
  Eye,
  FileText,
  Globe2,
  MessageSquareQuote,
  MousePointerClick,
  NotebookPen,
  UserCheck,
  Users,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AdminAnalytics, AnalyticsPeriod } from "@/lib/admin/analytics";
import AdminStatCard from "@/components/admin/AdminStatCard";

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: 1, label: "امروز" },
  { value: 7, label: "۷ روز" },
  { value: 30, label: "۳۰ روز" },
  { value: 90, label: "۹۰ روز" },
];

const number = (value: number) => value.toLocaleString("fa-IR");

function Change({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={positive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
      {positive ? "+" : ""}{number(value)}٪ نسبت به دوره قبل
    </span>
  );
}

function Ranking({ title, items, empty }: { title: string; items: { label: string; views: number }[]; empty: string }) {
  return (
    <section className="overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/75 shadow-sm">
      <div className="border-b border-border/70 px-4 py-3"><h2 className="text-sm font-black text-foreground">{title}</h2></div>
      {items.length ? (
        <ol className="divide-y divide-border/55">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">{number(index + 1)}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{item.label}</span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{number(item.views)} بازدید</span>
            </li>
          ))}
        </ol>
      ) : <p className="px-4 py-9 text-center text-xs font-bold text-muted-foreground">{empty}</p>}
    </section>
  );
}

export default function AdminAnalyticsDashboard({ analytics }: { analytics: AdminAnalytics }) {
  const router = useRouter();
  const { summary, engagement, totals } = analytics;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-[1.7rem] border border-border/70 bg-card/75 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-foreground">رفت‌وآمد و تعامل کاربران</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">داده‌های واقعیِ ثبت‌شده از زمان فعال‌سازی تحلیل‌های داخلی؛ بدون سرویس شخص ثالث.</p>
        </div>
        <div className="flex rounded-xl border border-border/70 bg-background/60 p-1">
          {PERIODS.map((item) => (
            <button key={item.value} type="button" onClick={() => router.push(`/admin/stats?period=${item.value}`)} className={`rounded-lg px-3 py-2 text-xs font-black transition-colors ${analytics.period === item.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <AdminStatCard label="بازدید صفحه" value={summary.pageViews} icon={Eye} hint={`${number(analytics.today.pageViews)} امروز · ${summary.pageViewsChange >= 0 ? "+" : ""}${number(summary.pageViewsChange)}٪`} tone="primary" />
        <AdminStatCard label="بازدیدکننده یکتا" value={summary.visitors} icon={Users} hint={`${number(analytics.today.visitors)} امروز · ${summary.visitorsChange >= 0 ? "+" : ""}${number(summary.visitorsChange)}٪`} tone="primary" />
        <AdminStatCard label="کاربر فعال" value={engagement.activeUsers} icon={Activity} hint="فعالیت مطالعه یا ثبت محتوا" />
        <AdminStatCard label="کاربر جدید" value={engagement.newUsers} icon={UserCheck} hint="حساب‌های ساخته‌شده در این دوره" />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-[1.7rem] border border-border/70 bg-card/75 p-4 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div><h2 className="text-sm font-black text-foreground">روند بازدید و بازدیدکننده</h2><p className="mt-1 text-xs text-muted-foreground">مقایسه‌ی روزانه در بازه انتخاب‌شده</p></div>
            <div className="text-xs font-bold text-muted-foreground"><Change value={summary.visitorsChange} /></div>
          </div>
          <div className="mt-4 h-72" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs><linearGradient id="pageViewsFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))", background: "hsl(var(--card))" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                <Area type="monotone" dataKey="pageViews" name="بازدید صفحه" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#pageViewsFill)" />
                <Area type="monotone" dataKey="visitors" name="بازدیدکننده" stroke="#8b5cf6" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <section className="rounded-[1.7rem] border border-border/70 bg-card/75 p-4 shadow-sm">
          <h2 className="text-sm font-black text-foreground">ترکیب بازدیدکنندگان</h2>
          <div className="mt-5 space-y-4">
            <Metric label="کاربران واردشده" value={summary.signedInVisitors} total={summary.visitors} color="bg-primary" />
            <Metric label="مهمان‌ها" value={summary.guestVisitors} total={summary.visitors} color="bg-violet-500" />
            <Metric label="بازدیدکننده جدید" value={summary.newVisitors} total={summary.visitors} color="bg-amber-500" />
          </div>
        </section>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Ranking title="کتاب‌های پربازدید" items={analytics.popularBooks} empty="هنوز بازدیدی از صفحه کتاب ثبت نشده است." />
        <Ranking title="نویسنده‌های پربازدید" items={analytics.popularAuthors} empty="هنوز بازدیدی از صفحه نویسنده ثبت نشده است." />
        <Ranking title="صفحه‌های پربازدید" items={analytics.popularPages.map((page) => ({ label: page.path, views: page.views }))} empty="هنوز بازدیدی ثبت نشده است." />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Engagement icon={BookOpen} label="افزودن به کتابخانه" value={engagement.libraryAdds} />
        <Engagement icon={MousePointerClick} label="شروع مطالعه" value={engagement.startedReading} />
        <Engagement icon={MessageSquareQuote} label="تکه‌های ثبت‌شده" value={engagement.quotes} />
        <Engagement icon={NotebookPen} label="یادداشت‌ها" value={engagement.publicNotes + engagement.privateNotes} />
      </section>

      <section className="rounded-[1.7rem] border border-border/70 bg-card/75 p-4 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><Globe2 className="h-4 w-4 text-primary" /><h2 className="text-sm font-black text-foreground">وضعیت کل پلتفرم</h2></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4 xl:grid-cols-8">
          <Total label="کاربران" value={totals.users} /><Total label="کتاب کاتالوگ" value={totals.catalogBooks} /><Total label="نسخه‌ها" value={totals.editions} /><Total label="تکه‌ها" value={totals.quotes} /><Total label="یادداشت‌ها" value={totals.notes} /><Total label="کتاب منتظر" value={totals.pendingBooks} /><Total label="نسخه منتظر" value={totals.pendingEditions} /><Total label="مرجع منتظر" value={totals.pendingReferences} />
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const percent = total ? Math.round((value / total) * 100) : 0;
  return <div><div className="mb-1.5 flex justify-between gap-3 text-xs font-bold"><span className="text-foreground">{label}</span><span className="tabular-nums text-muted-foreground">{number(value)} · {number(percent)}٪</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>;
}
function Engagement({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/75 p-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></span><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-black tabular-nums text-foreground">{number(value)}</p></div></div>;
}
function Total({ label, value }: { label: string; value: number }) { return <div><p className="text-[11px] text-muted-foreground">{label}</p><p className="mt-1 text-lg font-black tabular-nums text-foreground">{number(value)}</p></div>; }

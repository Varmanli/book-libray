import Link from "next/link";
import {
  BadgeCheck,
  BookCopy,
  FileText,
  MessageSquareQuote,
  NotebookPen,
  Plus,
  Settings,
  Users,
} from "lucide-react";

import { getAdminOverview } from "@/lib/admin/service";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  { href: "/admin/books/new", label: "افزودن کتاب", icon: Plus },
  { href: "/admin/approvals", label: "تایید اطلاعات", icon: BadgeCheck },
  { href: "/admin/blog", label: "نوشتن بلاگ", icon: FileText },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: Settings },
];

function faDate(d: Date) {
  return new Date(d).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AdminDashboardPage() {
  const overview = await getAdminOverview();
  const { counts } = overview;
  const pendingTotal = counts.pendingBooks + counts.pendingReferences;

  return (
    <div>
      <AdminPageHeader title="داشبورد" description="نمای کلی وضعیت سامانه" />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <AdminStatCard label="کاربران" value={counts.users} icon={Users} href="/admin/users" />
        <AdminStatCard label="کتاب‌های کاتالوگ" value={counts.books} icon={BookCopy} href="/admin/books" />
        <AdminStatCard
          label="در انتظار تأیید"
          value={pendingTotal}
          icon={BadgeCheck}
          href="/admin/approvals"
          tone={pendingTotal > 0 ? "warning" : "default"}
        />
        <AdminStatCard label="تکه‌های کتاب" value={counts.quotes} icon={MessageSquareQuote} />
        <AdminStatCard label="یادداشت‌ها" value={counts.notes} icon={NotebookPen} />
        <AdminStatCard label="کتاب‌های در انتظار" value={counts.pendingBooks} icon={BookCopy} href="/admin/approvals" />
      </section>

      {/* quick actions */}
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-bold text-foreground">اقدامات سریع</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <a.icon className="h-4 w-4" />
              </span>
              {a.label}
            </Link>
          ))}
        </div>
      </section>

      {/* recent lists */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <RecentCard title="کاربران اخیر" viewAll="/admin/users">
          {overview.recentUsers.length === 0 ? (
            <Empty />
          ) : (
            overview.recentUsers.map((u) => (
              <Row
                key={u.id}
                title={u.name || u.username || "کاربر"}
                subtitle={u.username ? `@${u.username}` : ""}
                meta={faDate(u.createdAt)}
              />
            ))
          )}
        </RecentCard>

        <RecentCard title="کتاب‌های اخیر" viewAll="/admin/books">
          {overview.recentBooks.length === 0 ? (
            <Empty />
          ) : (
            overview.recentBooks.map((b) => (
              <Row key={b.id} title={b.title} subtitle={b.author} meta={faDate(b.createdAt)} />
            ))
          )}
        </RecentCard>

        <RecentCard title="در انتظار تأیید" viewAll="/admin/approvals">
          {overview.recentPending.length === 0 ? (
            <Empty text="موردی در انتظار نیست" />
          ) : (
            overview.recentPending.map((b) => (
              <Row key={b.id} title={b.title} subtitle={b.author} meta={faDate(b.createdAt)} />
            ))
          )}
        </RecentCard>
      </section>
    </div>
  );
}

function RecentCard({
  title,
  viewAll,
  children,
}: {
  title: string;
  viewAll: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <Link href={viewAll} className="text-xs text-primary hover:underline">
          مشاهده همه
        </Link>
      </div>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

function Row({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: string;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-muted/40">
      <div className="min-w-0">
        <p className="truncate text-sm text-foreground">{title}</p>
        {subtitle ? (
          <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {meta ? (
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
          {meta}
        </span>
      ) : null}
    </li>
  );
}

function Empty({ text = "موردی نیست" }: { text?: string }) {
  return <li className="px-2 py-6 text-center text-xs text-muted-foreground">{text}</li>;
}

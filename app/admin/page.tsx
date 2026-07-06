import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  BookCopy,
  ChevronLeft,
  FileText,
  FileUp,
  MessageSquareQuote,
  NotebookPen,
  Plus,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";

import { getAdminOverview } from "@/lib/admin/service";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const QUICK_ACTIONS = [
  {
    href: "/admin/books/new",
    label: "افزودن کتاب",
    description: "ثبت کتاب جدید در کاتالوگ",
    icon: Plus,
  },
  {
    href: "/admin/approvals",
    label: "تأیید اطلاعات",
    description: "بررسی کتاب‌ها و مراجع منتظر",
    icon: BadgeCheck,
  },
  {
    href: "/admin/blog",
    label: "نوشتن بلاگ",
    description: "انتشار مطلب و محتوای سایت",
    icon: FileText,
  },
  {
    href: "/admin/settings",
    label: "تنظیمات سایت",
    description: "مدیریت تنظیمات عمومی",
    icon: Settings,
  },
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
    <div className="space-y-7">
      <AdminPageHeader
        title="داشبورد"
        description="نمای کلی وضعیت قفسه، محتوا، کاربران و موارد در انتظار بررسی"
      />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <AdminStatCard
          label="کاربران"
          value={counts.users}
          icon={Users}
          href="/admin/users"
        />

        <AdminStatCard
          label="کتاب‌های کاتالوگ"
          value={counts.books}
          icon={BookCopy}
          href="/admin/books"
        />

        <AdminStatCard
          label="در انتظار تأیید"
          value={pendingTotal}
          icon={BadgeCheck}
          href="/admin/approvals"
          tone={pendingTotal > 0 ? "warning" : "default"}
        />

        <AdminStatCard
          label="تکه‌های کتاب"
          value={counts.quotes}
          icon={MessageSquareQuote}
        />

        <AdminStatCard
          label="یادداشت‌ها"
          value={counts.notes}
          icon={NotebookPen}
        />

        <AdminStatCard
          label="کتاب‌های در انتظار"
          value={counts.pendingBooks}
          icon={BookCopy}
          href="/admin/approvals"
          tone={counts.pendingBooks > 0 ? "warning" : "default"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 p-5 shadow-[0_22px_80px_-58px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute -left-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/25 to-transparent" />

            <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  مدیریت سریع محتوا
                </div>

                <h2 className="text-lg font-black text-foreground">
                  امروز از کجا شروع کنیم؟
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
                  کتاب جدید اضافه کن، داده‌های منتظر تأیید را بررسی کن یا با
                  ورود گروهی، چندین کتاب و نسخه را یک‌جا وارد کاتالوگ کن.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
                <Button
                  asChild
                  className="h-11 rounded-2xl px-5 font-bold shadow-lg shadow-primary/10"
                >
                  <Link href="/admin/books/new">
                    <Plus className="h-4 w-4" />
                    افزودن کتاب
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-11 rounded-2xl border-border/80 bg-background/60 px-5 font-bold"
                >
                  <Link href="/admin/books/import">
                    <FileUp className="h-4 w-4" />
                    ورود گروهی
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-foreground">
                  اقدامات سریع
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  مسیرهای پرکاربرد مدیریت سایت
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {QUICK_ACTIONS.map((action) => (
                <QuickActionCard
                  key={action.href}
                  href={action.href}
                  label={action.label}
                  description={action.description}
                  icon={<action.icon className="h-4 w-4" />}
                />
              ))}
            </div>
          </div>
        </div>

        <ImportGuideCard />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <RecentCard title="کاربران اخیر" viewAll="/admin/users">
          {overview.recentUsers.length === 0 ? (
            <Empty />
          ) : (
            overview.recentUsers.map((user) => (
              <Row
                key={user.id}
                title={user.name || user.username || "کاربر"}
                subtitle={
                  user.username ? `@${user.username}` : "بدون نام کاربری"
                }
                meta={faDate(user.createdAt)}
              />
            ))
          )}
        </RecentCard>

        <RecentCard title="کتاب‌های اخیر" viewAll="/admin/books">
          {overview.recentBooks.length === 0 ? (
            <Empty />
          ) : (
            overview.recentBooks.map((book) => (
              <Row
                key={book.id}
                title={book.title}
                subtitle={book.author}
                meta={faDate(book.createdAt)}
              />
            ))
          )}
        </RecentCard>

        <RecentCard title="در انتظار تأیید" viewAll="/admin/approvals">
          {overview.recentPending.length === 0 ? (
            <Empty text="موردی در انتظار نیست" />
          ) : (
            overview.recentPending.map((book) => (
              <Row
                key={book.id}
                title={book.title}
                subtitle={book.author}
                meta={faDate(book.createdAt)}
              />
            ))
          )}
        </RecentCard>
      </section>
    </div>
  );
}

function QuickActionCard({
  href,
  label,
  description,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/75 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card hover:shadow-[0_18px_60px_-48px_rgba(0,0,0,0.55)]"
    >
      <div className="pointer-events-none absolute -left-10 -top-10 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
          {icon}
        </span>

        <ChevronLeft className="mt-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="relative mt-4">
        <p className="text-sm font-black text-foreground">{label}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </Link>
  );
}

function ImportGuideCard() {
  return (
    <div className="rounded-[2rem] border border-border/70 bg-card/70 p-4 shadow-[0_22px_80px_-64px_rgba(0,0,0,0.55)]">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
          <FileUp className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-black text-foreground">
            ورود گروهی کتاب‌ها
          </h2>

          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            راهنما و نمونه‌ها همیشه لازم نیستند؛ برای مشاهده جزئیات، بخش زیر را
            باز کن.
          </p>
        </div>
      </div>

      <Button
        asChild
        className="mt-4 h-11 w-full rounded-2xl font-bold shadow-lg shadow-primary/10"
      >
        <Link href="/admin/books/import">
          <FileUp className="h-4 w-4" />
          رفتن به صفحه ایمپورت
        </Link>
      </Button>
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
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-border/70 bg-card/75 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <h3 className="text-sm font-black text-foreground">{title}</h3>

        <Link
          href={viewAll}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          مشاهده همه
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      </div>

      <ul className="divide-y divide-border/55">{children}</ul>
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
    <li className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-background/55">
      <div className="min-w-0">
        <p className="line-clamp-1 text-sm font-bold text-foreground">
          {title}
        </p>

        {subtitle ? (
          <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>

      {meta ? (
        <span className="shrink-0 rounded-full border border-border/70 bg-background/55 px-2.5 py-1 text-[10px] font-bold tabular-nums text-muted-foreground">
          {meta}
        </span>
      ) : null}
    </li>
  );
}

function Empty({ text = "موردی نیست" }: { text?: string }) {
  return (
    <li className="px-4 py-8 text-center">
      <p className="text-xs font-bold text-muted-foreground">{text}</p>
    </li>
  );
}

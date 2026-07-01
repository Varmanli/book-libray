import Link from "next/link";
import { ExternalLink, FileText, Pencil } from "lucide-react";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { getAdminStaticPages } from "@/lib/static-pages/service";

export const dynamic = "force-dynamic";

export default async function AdminStaticPagesPage() {
  const pages = await getAdminStaticPages();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="صفحات ثابت"
        description="مدیریت محتوای صفحات عمومی سایت (درباره ما، تماس، قوانین، حریم خصوصی و راهنما)."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {pages.map((page) => (
          <div
            key={page.slug}
            className="flex flex-col gap-4 rounded-[1.6rem] border border-border/75 bg-card/75 p-5 shadow-[0_24px_70px_-56px_rgba(0,0,0,0.85)] backdrop-blur-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/15">
                  <FileText className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-foreground">
                    {page.title}
                  </p>
                  <p dir="ltr" className="mt-1 text-right text-[11px] text-muted-foreground">
                    /{page.slug}
                  </p>
                </div>
              </div>
              <span
                className={
                  page.status === "PUBLISHED"
                    ? "shrink-0 rounded-full bg-emerald-500/12 px-2.5 py-1 text-[10px] font-bold text-emerald-500 ring-1 ring-emerald-500/20"
                    : "shrink-0 rounded-full bg-amber-500/12 px-2.5 py-1 text-[10px] font-bold text-amber-500 ring-1 ring-amber-500/20"
                }
              >
                {page.status === "PUBLISHED" ? "منتشرشده" : "پیش‌نویس"}
              </span>
            </div>

            {page.subtitle ? (
              <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">
                {page.subtitle}
              </p>
            ) : null}

            <p className="text-[11px] text-muted-foreground">
              آخرین به‌روزرسانی:{" "}
              {page.updatedAt.toLocaleDateString("fa-IR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="mt-auto flex items-center gap-2 pt-1">
              <Link
                href={`/admin/static-pages/${page.slug}`}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-xs font-bold text-primary-foreground transition hover:opacity-90"
              >
                <Pencil className="h-3.5 w-3.5" />
                ویرایش
              </Link>
              <Link
                href={`/${page.slug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-4 text-xs font-bold text-foreground transition hover:border-primary/25 hover:text-primary"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                پیش‌نمایش
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

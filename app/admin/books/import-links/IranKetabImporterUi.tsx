"use client";
import Link from "next/link";
import {
  BookCheck,
  Check,
  FileSearch,
  History,
  Link2,
  ScanSearch,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const steps = [
  { label: "لینک کتاب", icon: Link2 },
  { label: "استخراج اطلاعات", icon: FileSearch },
  { label: "تطبیق و بررسی", icon: ScanSearch },
  { label: "آماده‌سازی کاورها", icon: UploadCloud },
  { label: "ثبت نهایی", icon: BookCheck },
];
export function ImportStepper({ current }: { current: number }) {
  return (
    <nav
      aria-label="مراحل ورود کتاب"
      className="overflow-x-auto rounded-2xl border bg-card/60 p-3"
    >
      <ol className="flex min-w-[640px] items-center gap-2">
        {steps.map((step, index) => {
          const complete = index < current;
          const active = index === current;
          const Icon = step.icon;
          return (
            <li
              key={step.label}
              aria-current={active ? "step" : undefined}
              className="flex flex-1 items-center gap-2"
            >
              <div
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-colors",
                  active
                    ? "bg-primary/12 text-primary ring-1 ring-primary/20"
                    : complete
                      ? "text-foreground"
                      : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-lg",
                    active || complete
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                  aria-hidden
                >
                  {complete ? (
                    <Check className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </span>
                <span className="truncate">{step.label}</span>
              </div>
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "h-px w-4 shrink-0",
                    complete ? "bg-primary" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function InitialGuide() {
  const items = [
    {
      title: "استخراج امن",
      text: "اطلاعات کتاب و نسخه‌ها از صفحه ایران‌کتاب دریافت و اعتبارسنجی می‌شوند.",
      icon: ShieldCheck,
    },
    {
      title: "تطبیق با قفسه",
      text: "کتاب‌ها، نسخه‌ها، نویسندگان، مترجمان و ناشران موجود بررسی می‌شوند.",
      icon: ScanSearch,
    },
    {
      title: "ثبت پس از تأیید",
      text: "هیچ اطلاعاتی پیش از بررسی و تأیید نهایی شما در سایت ثبت نمی‌شود.",
      icon: BookCheck,
    },
  ];
  return (
    <section aria-labelledby="workflow-guide">
      <h2 id="workflow-guide" className="mb-3 text-sm font-black">
        این فرآیند چگونه کار می‌کند؟
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map(({ title, text, icon: Icon }) => (
          <div key={title} className="rounded-2xl border bg-card/45 p-4">
            <Icon className="mb-3 size-5 text-primary" />
            <h3 className="text-sm font-black">{title}</h3>
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export type RecentImport = {
  id: string;
  sourceUrl: string;
  canonicalSourceUrl: string;
  status: string;
  updatedAt?: string;
  createdAt: string;
  resultSummary?: Record<string, unknown> | null;
  errorCode?: string | null;
};
const statusLabel: Record<string, string> = {
  SUCCESS: "موفق",
  FAILED: "ناموفق",
  READY_TO_COMMIT: "آماده ثبت",
  DRAFT_REVIEW: "در حال بررسی",
  COVER_PREPARATION: "آماده‌سازی کاور",
  PREVIEW_READY: "پیش‌نمایش آماده",
  EXTRACTING: "در حال استخراج",
};
export function RecoverableCard({
  session,
  onContinue,
  onRestart,
}: {
  session: RecentImport;
  onContinue: () => void;
  onRestart: () => void;
}) {
  const progress = Math.max(
    20,
    ([
      "CREATED",
      "EXTRACTING",
      "PREVIEW_READY",
      "DRAFT_REVIEW",
      "COVER_PREPARATION",
      "READY_TO_COMMIT",
      "COMMITTING",
    ].indexOf(session.status) +
      1) *
      14,
  );
  return (
    <Card className="border-primary/25 bg-primary/[0.035]">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
            <History className="size-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-base">
              یک فرآیند نیمه‌کاره دارید
            </CardTitle>
            <CardDescription className="mt-1 break-all" dir="ltr">
              {session.canonicalSourceUrl}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between text-xs">
          <span>
            مرحله فعلی: {statusLabel[session.status] ?? session.status}
          </span>
          <span>
            {session.updatedAt
              ? new Date(session.updatedAt).toLocaleString("fa-IR")
              : ""}
          </span>
        </div>
        <Progress value={Math.min(progress, 95)} aria-label="پیشرفت فرآیند" />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onContinue}>ادامه فرایند</Button>
          <Button variant="ghost" onClick={onRestart}>
            شروع ورود جدید
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
export function RecentHistory({ sessions }: { sessions: RecentImport[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">ورودهای اخیر</CardTitle>
          <CardDescription>آخرین فرآیندهای ثبت‌شده</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/books/import-history">مشاهده همه تاریخچه</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {sessions.length ? (
          <div className="grid gap-2">
            {sessions.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/admin/books/import-history/${item.id}`}
                className="grid min-w-0 gap-1 rounded-xl border p-3 transition-colors hover:bg-muted/50 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <span className="truncate text-sm font-bold" dir="ltr">
                  {String(
                    item.resultSummary?.catalogTitle ?? item.canonicalSourceUrl,
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-bold",
                    item.status === "SUCCESS"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : item.status === "FAILED"
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {statusLabel[item.status] ?? item.status}
                </span>
                <time className="text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString("fa-IR")}
                </time>
              </Link>
            ))}
          </div>
        ) : (
          <p className="py-5 text-center text-sm text-muted-foreground">
            هنوز سابقه‌ای ثبت نشده است.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

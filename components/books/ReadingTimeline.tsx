import { BookOpenCheck, CalendarDays, Flag, Plus, Trophy } from "lucide-react";

import type { ReadingHistory } from "@/lib/reading-history/service";

export default function ReadingTimeline({
  history,
}: {
  history: ReadingHistory;
}) {
  if (history.events.length === 0) {
    return (
      <section className="rounded-[1.7rem] border border-dashed border-border/80 bg-background/25 p-5 text-center">
        <CalendarDays className="mx-auto h-6 w-6 text-primary" />
        <h2 className="mt-3 text-sm font-black text-foreground">
          هنوز مسیر مطالعه‌ای ثبت نشده
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-muted-foreground">
          با شروع مطالعه و تغییر صفحات، داستان خواندن این کتاب اینجا ساخته
          می‌شود.
        </p>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 p-4 backdrop-blur-md transition-all hover:border-border/80 sm:p-5">
      {/* Header Section */}
      <div className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <CalendarDays className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            تاریخچه مطالعه
          </h2>
          <p className="text-xs text-muted-foreground/80">
            لحظه‌های ثبت‌شده از همراهی تو با این کتاب
          </p>
        </div>
      </div>

      {/* Summary Component */}
      <div className="mt-4">
        <ReadingSummary history={history} />
      </div>

      {/* Timeline List */}
      <ol className="relative mt-6 space-y-4 pr-1.5 before:absolute before:bottom-3 before:right-[1.125rem] before:top-3 before:w-[2px] before:bg-gradient-to-b before:from-primary/40 before:via-border/60 before:to-transparent">
        {history.events.map((event) => {
          const content = eventCopy(event);

          // تفکیک استایل و آیکون بر اساس نوع رویداد
          const isStart = event.type === "START";
          const isFinish = event.type === "FINISH";

          const Icon = isStart ? Flag : isFinish ? Trophy : Plus;

          const iconStyles = isFinish
            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
            : isStart
              ? "border-primary/30 bg-primary/10 text-primary"
              : "border-border/80 bg-background/80 text-muted-foreground";

          return (
            <li
              key={event.id}
              className="group relative flex items-start gap-3.5"
            >
              {/* Node Icon */}
              <span
                className={`z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm transition-transform duration-200 group-hover:scale-110 ${iconStyles}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>

              {/* Event Card */}
              <article className="min-w-0 flex-1 rounded-xl border border-border/40 bg-background/40 p-3 transition-colors group-hover:border-border/70 group-hover:bg-background/60">
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <h3 className="text-xs font-bold text-foreground sm:text-sm">
                    {content.title}
                  </h3>
                  <time className="text-[10px] font-medium text-muted-foreground/70 sm:text-[11px]">
                    {formatDate(event.createdAt)}
                  </time>
                </div>

                {content.detail ? (
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground/90">
                    {content.detail}
                  </p>
                ) : null}
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ReadingSummary({ history }: { history: ReadingHistory }) {
  const items = [
    history.summary.days != null && {
      label: "مدت مطالعه",
      value: `${history.summary.days.toLocaleString("fa-IR")} روز`,
    },
    history.summary.pagesRead != null && {
      label: "صفحات خوانده‌شده",
      value: history.summary.pagesRead.toLocaleString("fa-IR"),
    },
    history.summary.averagePagesPerDay != null && {
      label: "میانگین روزانه",
      value: `${history.summary.averagePagesPerDay.toLocaleString("fa-IR")} صفحه`,
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  if (items.length === 0) return null;

  return (
    <div className="mt-5 rounded-2xl border border-primary/15 bg-primary/[0.055] p-4">
      <div className="flex items-center gap-2 text-xs font-black text-foreground">
        <BookOpenCheck className="h-4 w-4 text-primary" />
        خلاصه مطالعه
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[11px] text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-sm font-black tabular-nums text-foreground">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function eventCopy(event: ReadingHistory["events"][number]) {
  if (event.type === "START") {
    return {
      title: "شروع مطالعه",
      detail: event.pageTo
        ? `از صفحه ${event.pageTo.toLocaleString("fa-IR")} شروع کردی`
        : "داستان خواندن این کتاب را آغاز کردی",
    };
  }
  if (event.type === "FINISH") {
    return {
      title: "🎉 کتاب را تمام کردی",
      detail: event.pageTo
        ? `در صفحه ${event.pageTo.toLocaleString("fa-IR")} به پایان رسید`
        : "این سفر خواندنی به پایان رسید",
    };
  }
  return {
    title: event.pagesRead
      ? `+${event.pagesRead.toLocaleString("fa-IR")} صفحه`
      : "پیشرفت مطالعه",
    detail:
      event.pageTo != null
        ? `به صفحه ${event.pageTo.toLocaleString("fa-IR")} رسیدی`
        : null,
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

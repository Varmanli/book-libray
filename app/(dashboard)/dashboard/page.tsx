import { type ElementType, type ReactNode } from "react";
import Link from "next/link";
import {
  BookOpen,
  BookPlus,
  Bookmark,
  CheckCircle2,
  Clock3,
  Heart,
  LayoutGrid,
  Quote as QuoteIcon,
  Settings,
  Sparkles,
  StickyNote,
  UserRound,
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BookPreviewCard from "@/components/panel/BookPreviewCard";
import BookCoverImage from "@/components/books/BookCoverImage";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserDashboardData } from "@/lib/dashboard/service";
import { getLibraryPath } from "@/lib/library/paths";
import { cn } from "@/lib/utils";
import { getQuoteDirectionProps } from "@/lib/text-direction";

export const dynamic = "force-dynamic";

const relativeTimeFormat = new Intl.RelativeTimeFormat("fa", {
  numeric: "auto",
});

function relativeTime(date: Date) {
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const minutes = Math.round(diffSeconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (Math.abs(days) >= 1) return relativeTimeFormat.format(days, "day");
  if (Math.abs(hours) >= 1) return relativeTimeFormat.format(hours, "hour");
  if (Math.abs(minutes) >= 1) return relativeTimeFormat.format(minutes, "minute");
  return "همین حالا";
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const data = await getUserDashboardData(user.id);
  if (!data) return null;

  const libraryHref = getLibraryPath(data.profile.username);
  const profileHref = `/${data.profile.username}`;

  const stats: {
    label: string;
    value: number;
    icon: ElementType;
    tone: string;
  }[] = [
    { label: "کل کتاب‌ها", value: data.stats.totalBooks, icon: BookOpen, tone: "bg-primary/12 text-primary" },
    { label: "در حال خواندن", value: data.stats.reading, icon: Clock3, tone: "bg-sky-500/12 text-sky-500 dark:text-sky-300" },
    { label: "خوانده‌شده", value: data.stats.finished, icon: CheckCircle2, tone: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300" },
    { label: "می‌خواهم بخوانم", value: data.stats.unread, icon: Bookmark, tone: "bg-amber-500/12 text-amber-600 dark:text-amber-300" },
    { label: "علاقه‌مندی‌ها", value: data.stats.favorites, icon: Heart, tone: "bg-rose-500/12 text-rose-500 dark:text-rose-300" },
    { label: "تکه‌ها", value: data.stats.quotes, icon: QuoteIcon, tone: "bg-primary/12 text-primary" },
    { label: "یادداشت‌ها", value: data.stats.notes, icon: StickyNote, tone: "bg-sky-500/12 text-sky-500 dark:text-sky-300" },
  ];

  const shortcuts: { label: string; href: string; icon: ElementType }[] = [
    { label: "افزودن کتاب", href: "/books/add", icon: BookPlus },
    { label: "کتابخانه من", href: libraryHref, icon: LayoutGrid },
    { label: "پروفایل من", href: profileHref, icon: UserRound },
    { label: "تنظیمات", href: "/settings/profile", icon: Settings },
    { label: "خوانده‌شده‌ها", href: `${libraryHref}?filter=FINISHED`, icon: CheckCircle2 },
    { label: "علاقه‌مندی‌ها", href: `${libraryHref}?filter=FAVORITES`, icon: Heart },
  ];

  const nextStep =
    data.stats.totalBooks === 0
      ? { text: "اولین کتابت را اضافه کن", cta: "افزودن کتاب", href: "/books/add" }
      : data.stats.reading > 0
      ? { text: "مطالعه‌ات را ادامه بده", cta: "ادامه‌ی مطالعه", href: `${libraryHref}?filter=READING` }
      : data.stats.unread > 0
      ? { text: "یکی از کتاب‌های ذخیره‌شده را شروع کن", cta: "انتخاب کتاب", href: `${libraryHref}?filter=UNREAD` }
      : { text: "کتاب تازه‌ای به قفسه اضافه کن", cta: "افزودن کتاب", href: "/books/add" };

  const activity = [
    ...data.recentlyAdded.slice(0, 5).map((book) => ({
      id: `add-${book.id}`,
      icon: BookPlus as ElementType,
      text: `«${book.title}» به کتابخانه اضافه شد`,
      date: book.createdAt,
    })),
    ...data.recentNotes.map((note) => ({
      id: `note-${note.id}`,
      icon: StickyNote as ElementType,
      text: `یادداشتی برای «${note.bookTitle}» نوشتی`,
      date: note.createdAt,
    })),
  ]
    .sort((left, right) => right.date.getTime() - left.date.getTime())
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 md:pt-10 lg:pt-12">
      <DashboardHeader
        profile={data.profile}
        libraryHref={libraryHref}
        profileHref={profileHref}
      />

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {stats.map((item) => (
          <DashStat key={item.label} {...item} />
        ))}
      </section>

      <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">پیشنهاد بعدی</p>
            <p className="text-sm font-semibold text-foreground">{nextStep.text}</p>
          </div>
        </div>
        <Button asChild className="h-9 rounded-lg px-4 text-sm">
          <Link href={nextStep.href}>{nextStep.cta}</Link>
        </Button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* ستون اصلی */}
        <div className="min-w-0 space-y-6">
          <SectionCard
            title="در حال خواندن"
            action={
              data.currentlyReading.length > 0 ? (
                <Link
                  href={`${libraryHref}?filter=READING`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  مشاهده همه
                </Link>
              ) : null
            }
          >
            {data.currentlyReading.length === 0 ? (
              <MiniEmpty
                text="هنوز کتابی در حال خواندن نداری."
                ctaLabel="افزودن کتاب"
                ctaHref="/books/add"
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.currentlyReading.slice(0, 4).map((book) => (
                  <BookPreviewCard
                    key={book.id}
                    book={{ ...book, status: "در حال خواندن" }}
                  />
                ))}
              </div>
            )}
          </SectionCard>

          <div className="grid gap-6 sm:grid-cols-2">
            <SectionCard title="تکه‌های اخیر من">
              {data.recentQuotes.length === 0 ? (
                <MiniEmpty text="هنوز تکه‌ای ثبت نکرده‌ای." />
              ) : (
                <ul className="space-y-2.5">
                  {data.recentQuotes.map((quote) => (
                    <li key={quote.id}>
                      <Link
                        href={`/book/${encodeURIComponent(quote.bookSlug || quote.bookId)}`}
                        className="block rounded-xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/30"
                      >
                        {quote.imageKey ? (
                          <div className="mb-2 flex max-h-32 justify-center overflow-hidden rounded-lg bg-black/10">
                            <BookCoverImage
                              src={quote.imageKey}
                              alt={`تصویر تکه‌ای از کتاب «${quote.bookTitle}»`}
                              width={280}
                              height={360}
                              className="h-auto max-h-32 w-auto max-w-full object-contain"
                            />
                          </div>
                        ) : null}
                        <p
                          {...getQuoteDirectionProps(quote.content)}
                          className="line-clamp-2 text-sm leading-6 text-foreground"
                        >
                          {quote.content ? `«${quote.content}»` : "تکه‌ای تصویری از کتاب"}
                        </p>
                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          {quote.bookTitle}
                          {quote.page ? ` — ص ${quote.page}` : ""}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="یادداشت‌های اخیر من">
              {data.recentNotes.length === 0 ? (
                <MiniEmpty text="هنوز یادداشتی منتشر نکرده‌ای." />
              ) : (
                <ul className="space-y-2.5">
                  {data.recentNotes.map((note) => (
                    <li key={note.id}>
                      <Link
                        href={`/book/${encodeURIComponent(note.bookSlug || note.bookId)}`}
                        className="block rounded-xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/30"
                      >
                        <p className="line-clamp-2 text-sm leading-6 text-foreground">
                          {note.content}
                        </p>
                        <p className="mt-1.5 truncate text-xs text-muted-foreground">
                          {note.bookTitle}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </div>

        {/* ستون کناری */}
        <div className="space-y-6">
          <SectionCard title="میان‌برها">
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-2 py-3 text-center transition hover:border-primary/30 hover:bg-card/70"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="فعالیت‌های اخیر">
            {activity.length === 0 ? (
              <MiniEmpty text="هنوز فعالیتی ثبت نشده است." />
            ) : (
              <ul className="space-y-3">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm leading-5 text-foreground">
                        {item.text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {relativeTime(item.date)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

/** کارت آمار فشرده با آیکن ملایم. */
function DashStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number | string;
  icon: ElementType;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/50 p-3.5">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
          tone
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <div className="text-xl font-bold leading-none text-foreground">{value}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

/** قاب بخش با عنوان کوتاه و اکشن اختیاری. */
function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/50 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** وضعیت خالی فشرده و کنش‌محور. */
function MiniEmpty({
  text,
  ctaLabel,
  ctaHref,
}: {
  text: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {ctaLabel && ctaHref ? (
        <Button asChild size="sm" className="mt-3 rounded-lg">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

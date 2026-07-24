import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
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
  Users,
  Globe,
  Tag,
  Archive,
  BarChart3,
  Flame,
  Award,
} from "lucide-react";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BookPreviewCard from "@/components/panel/BookPreviewCard";
import BookCoverImage from "@/components/books/BookCoverImage";
import AuthorAvatar from "@/components/reference/AuthorAvatar";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/ui/Carousel";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserDashboardData, getUserReadingInsights } from "@/lib/dashboard/service";
import { getLibraryPath } from "@/lib/library/paths";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [dashboardData, insights] = await Promise.all([
    getUserDashboardData(user.id),
    getUserReadingInsights(user.id),
  ]);

  if (!dashboardData || !insights) notFound();

  const libraryHref = getLibraryPath(dashboardData.profile.username);
  const profileHref = `/${dashboardData.profile.username}`;

  const nextStep =
    dashboardData.stats.totalBooks === 0
      ? { text: "اولین کتابت را اضافه کن", cta: "افزودن کتاب", href: "/books/add" }
      : dashboardData.stats.reading > 0
      ? { text: "مطالعه‌ات را ادامه بده", cta: "ادامه‌ی مطالعه", href: "/reading" }
      : dashboardData.stats.unread > 0
      ? { text: "یکی از کتاب‌های ذخیره‌شده را شروع کن", cta: "انتخاب کتاب", href: `${libraryHref}?filter=UNREAD` }
      : { text: "کتاب تازه‌ای به قفسه اضافه کن", cta: "افزودن کتاب", href: "/books/add" };

  const shortcuts = [
    { label: "افزودن کتاب", href: "/books/add", icon: BookPlus },
    { label: "کتابخانه من", href: libraryHref, icon: LayoutGrid },
    { label: "پروفایل من", href: profileHref, icon: UserRound },
    { label: "تنظیمات", href: "/settings/profile", icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 md:pt-10 lg:pt-12 space-y-8 sm:space-y-10" dir="rtl">
      {/* Header */}
      <DashboardHeader
        profile={dashboardData.profile}
        libraryHref={libraryHref}
        profileHref={profileHref}
      />

      {/* Suggestion banner */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">پیشنهاد بعدی</p>
            <p className="text-sm font-semibold text-foreground">{nextStep.text}</p>
          </div>
        </div>
        <Button asChild className="h-9 rounded-lg px-4 text-sm font-bold">
          <Link href={nextStep.href}>{nextStep.cta}</Link>
        </Button>
      </div>

      {/* Reading Insights Summary Profile */}
      {insights.profileInsights.length > 0 && (
        <section className="rounded-3xl border border-border/30 bg-card/25 p-5 sm:p-6 lg:p-8 backdrop-blur-sm relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/20 to-transparent" />
          <div className="flex items-start gap-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Award className="h-5 w-5" />
            </span>
            <div className="space-y-2">
              <h2 className="text-base font-bold text-foreground sm:text-lg">پروفایل کتاب‌خوانی تو</h2>
              <div className="grid gap-2 text-sm text-foreground/80 leading-7 text-right">
                {insights.profileInsights.map((insight, idx) => (
                  <p key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Section 1: Statistics Summary Cards */}
        <div className="lg:col-span-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <DashStatItem label="کتاب‌های خوانده‌شده" value={insights.overview.finishedBooksCount} icon={CheckCircle2} tone="text-emerald-500 bg-emerald-500/10 border-emerald-500/15" />
          <DashStatItem label="در حال خواندن" value={insights.overview.readingBooksCount} icon={Clock3} tone="text-sky-500 bg-sky-500/10 border-sky-500/15" />
          <DashStatItem label="کل کتابخانه" value={insights.overview.totalBooksCount} icon={BookOpen} tone="text-primary bg-primary/10 border-primary/15" />
          <DashStatItem label="صفحات خوانده‌شده" value={insights.overview.totalPagesCount.toLocaleString("fa-IR")} icon={Sparkles} tone="text-amber-500 bg-amber-500/10 border-amber-500/15" />
          <DashStatItem label="میانگین صفحات کتاب" value={insights.overview.averagePagesCount.toLocaleString("fa-IR")} icon={BarChart3} tone="text-purple-500 bg-purple-500/10 border-purple-500/15" />
          <DashStatItem label="نویسندگان خوانده‌شده" value={insights.overview.uniqueAuthorsCount} icon={Users} tone="text-indigo-500 bg-indigo-500/10 border-indigo-500/15" />
          <DashStatItem label="یادداشت‌ها" value={insights.overview.notesCount} icon={StickyNote} tone="text-pink-500 bg-pink-500/10 border-pink-500/15" />
          <DashStatItem label="تکه‌های منتشرشده" value={insights.overview.quotesCount} icon={QuoteIcon} tone="text-teal-500 bg-teal-500/10 border-teal-500/15" />
        </div>

        {/* Section 2: Charts and Distributions */}
        <div className="lg:col-span-8 space-y-6">
          {/* Chart 1: Reading Activity Chart */}
          <SectionCard title="روند مطالعه ماهانه" description="تعداد کتاب‌های تکمیل‌شده در ۱۲ ماه گذشته">
            <ReadingActivityChart data={insights.monthlyActivity} />
          </SectionCard>

          {/* Row of sub-distributions */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Country chart */}
            <SectionCard title="ادبیات مورد علاقه تو" description="بیشترین آثار خوانده‌شده بر اساس جغرافیای اثر">
              {insights.favoriteCountries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">داده‌ای برای تحلیل وجود ندارد.</p>
              ) : (
                <div className="space-y-3">
                  {insights.favoriteCountries.map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          {c.name}
                        </span>
                        <span className="text-muted-foreground tabular-nums">{c.count} کتاب</span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/30">
                        <div
                          style={{ width: `${(c.count / insights.favoriteCountries[0].count) * 100}%` }}
                          className="h-full rounded-full bg-primary/75"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Genres list */}
            <SectionCard title="ژانرهای ترجیحی" description="سهم دسته‌بندی‌های موضوعی در کتابخانه تو">
              {insights.favoriteGenres.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">داده‌ای برای تحلیل وجود ندارد.</p>
              ) : (
                <div className="space-y-3">
                  {insights.favoriteGenres.map((g) => (
                    <div key={g.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                          {g.name}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {g.count} کتاب ({g.percentage.toLocaleString("fa-IR")}٪)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/30">
                        <div
                          style={{ width: `${g.percentage}%` }}
                          className="h-full rounded-full bg-teal-500/70"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Section: Favorite Publishers & Length Preference */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Publishers */}
            <SectionCard title="ناشران محبوب" description="بیشترین کتاب‌های خوانده‌شده از انتشارات">
              {insights.favoritePublishers.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">داده‌ای برای تحلیل وجود ندارد.</p>
              ) : (
                <div className="space-y-3">
                  {insights.favoritePublishers.map((p) => (
                    <div key={p.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="flex items-center gap-1.5 text-foreground">
                          <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                          {p.name}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {p.count} کتاب ({p.percentage.toLocaleString("fa-IR")}٪)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary/30">
                        <div
                          style={{ width: `${p.percentage}%` }}
                          className="h-full rounded-full bg-indigo-500/70"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Length / Formats */}
            <SectionCard title="حجم و قالب ترجیحی" description="اندازه و قالب‌های ترجیحی کتاب‌های خوانده‌شده">
              <div className="space-y-4">
                {/* Length preference */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground/80">توزیع حجم صفحات</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-card/40 rounded-xl p-2.5 border border-border/40">
                      <div className="text-muted-foreground text-[10px]">کوتاه (زیر ۲۰۰ ص)</div>
                      <div className="font-black text-sm text-foreground mt-1 tabular-nums">
                        {insights.lengthPreference.short}
                      </div>
                    </div>
                    <div className="bg-card/40 rounded-xl p-2.5 border border-border/40">
                      <div className="text-muted-foreground text-[10px]">متوسط (۲۰۰ تا ۴۰۰ ص)</div>
                      <div className="font-black text-sm text-foreground mt-1 tabular-nums">
                        {insights.lengthPreference.medium}
                      </div>
                    </div>
                    <div className="bg-card/40 rounded-xl p-2.5 border border-border/40">
                      <div className="text-muted-foreground text-[10px]">بلند (بالای ۴۰۰ ص)</div>
                      <div className="font-black text-sm text-foreground mt-1 tabular-nums">
                        {insights.lengthPreference.long}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formats */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground/80 mb-2">قالب کتاب</h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>فیزیکی ({insights.formatDistribution.physical} کتاب)</span>
                    <span>الکترونیک ({insights.formatDistribution.electronic} کتاب)</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-secondary/30 overflow-hidden flex">
                    <div
                      style={{ width: `${(insights.formatDistribution.physical / (insights.formatDistribution.physical + insights.formatDistribution.electronic || 1)) * 100}%` }}
                      className="bg-primary h-full"
                    />
                    <div className="bg-sky-500 h-full flex-1" />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-6">
          {/* Consistency Streak Card */}
          <SectionCard title="پیوستگی و انضباط مطالعه">
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-primary/5 rounded-2xl p-3 border border-primary/10">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Flame className="h-4.5 w-4.5" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">ماه‌های با مطالعه فعال</div>
                  <div className="text-sm font-black text-foreground mt-0.5 tabular-nums">
                    {insights.consistency.monthsWithActivity.toLocaleString("fa-IR")} ماه از ۱۲ ماه گذشته
                  </div>
                </div>
              </div>

              {insights.consistency.mostActiveMonth && (
                <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
                  <span className="text-muted-foreground">فعال‌ترین ماه مطالعه</span>
                  <span className="font-bold text-foreground">{insights.consistency.mostActiveMonth}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-border/40 pb-3 text-xs">
                <span className="text-muted-foreground">کتاب‌های خوانده‌شده در امسال</span>
                <span className="font-bold text-foreground tabular-nums">
                  {insights.consistency.completedThisYear.toLocaleString("fa-IR")} کتاب
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">کتاب‌های خوانده‌شده در سال گذشته</span>
                <span className="font-bold text-foreground tabular-nums">
                  {insights.consistency.completedLastYear.toLocaleString("fa-IR")} کتاب
                </span>
              </div>
            </div>
          </SectionCard>

          {/* Rating Distribution Histogram */}
          <SectionCard title="امتیازات و ارزیابی تو">
            <RatingDistributionChart
              distribution={insights.ratingStats.distribution}
              averageRating={insights.ratingStats.averageRating}
              ratedCount={insights.ratingStats.ratedCount}
            />
          </SectionCard>

          {/* Favorite Authors */}
          <SectionCard title="نویسندگان محبوب تو">
            {insights.favoriteAuthors.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">هنوز اطلاعات کافی در دسترس نیست.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {insights.favoriteAuthors.map((author) => {
                  const href = author.slug ? `/authors/${encodeURIComponent(author.slug)}` : "#";
                  return (
                    <Link
                      key={author.id}
                      href={href}
                      className="group flex flex-col items-center text-center rounded-2xl border border-border/60 bg-background/40 p-3 transition hover:border-primary/20 hover:bg-card"
                    >
                      <AuthorAvatar
                        name={author.name}
                        image={author.coverImage}
                        sizeClassName="h-16 w-16"
                      />
                      <h3 className="mt-2 line-clamp-1 text-xs font-black text-foreground group-hover:text-primary transition-colors">
                        {author.name}
                      </h3>
                      <p className="mt-1 text-[10px] text-muted-foreground font-semibold">
                        {author.bookCount.toLocaleString("fa-IR")} کتاب
                      </p>
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Quick Actions / Shortcuts */}
          <SectionCard title="میان‌برها">
            <div className="grid grid-cols-2 gap-2">
              {shortcuts.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-2 py-3 text-center transition hover:border-primary/30 hover:bg-card/70"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-medium text-foreground">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Section 3: Recent Finished Books */}
        <div className="lg:col-span-12">
          <SectionCard title="کتاب‌های اخیراً خوانده‌شده">
            {insights.recentCompleted.length === 0 ? (
              <MiniEmpty
                text="هنوز کتابی را به وضعیت «خوانده‌شده» منتقل نکرده‌ای."
                ctaLabel="کتابخانه من"
                ctaHref={libraryHref}
              />
            ) : (
              <>
                <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {insights.recentCompleted.map((book) => {
                    const href = book.slug ? `/book/${encodeURIComponent(book.slug)}` : "#";
                    return (
                      <Link
                        key={book.id}
                        href={href}
                        className="group flex flex-col rounded-2xl border border-border/40 bg-card/45 p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card/75"
                      >
                        <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-xl bg-secondary/20 shadow-sm">
                          <BookCoverImage
                            src={book.coverImage || "/placeholder-cover.svg"}
                            alt={book.title}
                            fill
                            sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 220px"
                            className="object-cover"
                          />
                        </div>
                        <div className="mt-3 flex flex-1 flex-col text-right">
                          <h4 className="line-clamp-2 min-h-[2.2rem] text-xs font-black text-foreground group-hover:text-primary transition-colors">
                            {book.title}
                          </h4>
                          <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground font-semibold">
                            {book.author}
                          </p>
                          {book.rating && (
                            <div className="mt-1 text-[10px] font-black text-amber-500">
                              ★ {book.rating.toLocaleString("fa-IR")} / ۱۰
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                <div className="sm:hidden">
                  <Carousel
                    ariaLabel="کتاب‌های اخیراً خوانده‌شده"
                    slideClassName="basis-[145px]"
                    containerClassName="gap-4"
                    slides={insights.recentCompleted.map((book) => {
                      const href = book.slug ? `/book/${encodeURIComponent(book.slug)}` : "#";
                      return (
                        <Link
                          key={book.id}
                          href={href}
                          className="group flex flex-col rounded-2xl border border-border/40 bg-card/45 p-2.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:bg-card/75 w-full"
                        >
                          <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-xl bg-secondary/20 shadow-sm">
                            <BookCoverImage
                              src={book.coverImage || "/placeholder-cover.svg"}
                              alt={book.title}
                              fill
                              sizes="(max-width: 640px) 42vw, (max-width: 1024px) 25vw, 220px"
                              className="object-cover"
                            />
                          </div>
                          <div className="mt-3 flex flex-1 flex-col text-right">
                            <h4 className="line-clamp-2 min-h-[2.2rem] text-xs font-black text-foreground group-hover:text-primary transition-colors">
                              {book.title}
                            </h4>
                            <p className="mt-1 line-clamp-1 text-[10px] text-muted-foreground font-semibold">
                              {book.author}
                            </p>
                            {book.rating && (
                              <div className="mt-1 text-[10px] font-black text-amber-500">
                                ★ {book.rating.toLocaleString("fa-IR")} / ۱۰
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  />
                </div>
              </>
            )}
          </SectionCard>
        </div>

        {/* Active Reading Workspace */}
        {dashboardData.currentlyReading.length > 0 && (
          <div className="lg:col-span-12">
            <SectionCard title="در حال خواندن">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {dashboardData.currentlyReading.map((book) => (
                  <BookPreviewCard
                    key={book.id}
                    book={{ ...book, status: "در حال خواندن" }}
                  />
                ))}
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}

function DashStatItem({
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
    <div className={cn("flex flex-col justify-between rounded-2xl border p-3 sm:p-3.5 shadow-sm bg-card/30 backdrop-blur-sm", tone)}>
      <div className="flex items-center justify-between">
        <span className="text-lg font-black tabular-nums">{value}</span>
        <Icon className="h-4.5 w-4.5 shrink-0 opacity-80" />
      </div>
      <div className="mt-2 text-[10px] font-bold text-muted-foreground/90 truncate leading-4">
        {label}
      </div>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/50 bg-card/15 p-3.5 sm:p-5 backdrop-blur-sm shadow-sm">
      <div className="mb-4 text-right">
        <h2 className="text-sm font-black text-foreground">{title}</h2>
        {description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </section>
  );
}

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
    <div className="rounded-xl border border-dashed border-border/70 bg-background/40 px-4 py-8 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {ctaLabel && ctaHref ? (
        <Button asChild size="sm" className="mt-3 rounded-lg font-bold">
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function ReadingActivityChart({
  data,
}: {
  data: Array<{ label: string; count: number; pages: number }>;
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="w-full">
      <div className="flex h-44 items-end gap-2 px-2 pt-6 pb-2 border-b border-border/30">
        {data.map((item, idx) => {
          const heightPercent = (item.count / maxCount) * 100;
          return (
            <div key={idx} className="group relative flex flex-1 flex-col items-center h-full justify-end">
              <div className="pointer-events-none absolute bottom-full mb-2 z-10 hidden rounded-lg border border-border bg-card/95 px-2.5 py-1.5 text-center text-xs shadow-md group-hover:block transition-all min-w-[70px]">
                <p className="font-bold text-foreground tabular-nums">{item.count} کتاب</p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {item.pages.toLocaleString("fa-IR")} صفحه
                </p>
              </div>
              <div
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
                className={cn(
                  "w-full rounded-t-md transition-all duration-300",
                  item.count > 0 ? "bg-primary/80 group-hover:bg-primary" : "bg-muted/20 group-hover:bg-muted/40"
                )}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 px-2 pt-2 text-[9px] text-muted-foreground overflow-x-auto whitespace-nowrap">
        {data.map((item, idx) => (
          <div key={idx} className={cn("flex-1 text-center truncate", idx % 2 === 0 ? "block" : "hidden sm:block")} title={item.label}>
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingDistributionChart({
  distribution,
  averageRating,
  ratedCount,
}: {
  distribution: Array<{ rating: number; count: number }>;
  averageRating: number;
  ratedCount: number;
}) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-black text-foreground tabular-nums">
          {averageRating.toLocaleString("fa-IR")}
        </span>
        <div className="text-right">
          <div className="text-[10px] text-muted-foreground">میانگین امتیازات</div>
          <div className="text-xs font-bold text-foreground">
            {ratedCount.toLocaleString("fa-IR")} کتاب ثبت‌شده
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-2">
        {distribution
          .slice()
          .reverse()
          .map((item) => {
            const widthPercent = (item.count / maxCount) * 100;
            return (
              <div key={item.rating} className="flex items-center gap-2 text-xs">
                <span className="w-8 shrink-0 text-left font-bold text-muted-foreground tabular-nums">
                  {item.rating.toLocaleString("fa-IR")} ★
                </span>
                <div className="relative h-2 flex-1 rounded-full bg-secondary/30">
                  <div
                    style={{ width: `${widthPercent}%` }}
                    className="h-full rounded-full bg-amber-500/80 transition-all duration-500"
                  />
                </div>
                <span className="w-6 shrink-0 text-right font-bold text-foreground/80 tabular-nums">
                  {item.count.toLocaleString("fa-IR")}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

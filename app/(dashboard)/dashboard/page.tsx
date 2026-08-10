import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Archive,
  Award,
  BarChart3,
  BookOpen,
  BookPlus,
  CheckCircle2,
  Clock3,
  Flame,
  Globe,
  LayoutGrid,
  Quote as QuoteIcon,
  Settings,
  Sparkles,
  StickyNote,
  Tag,
  UserRound,
  Users,
} from "lucide-react";

import BookCoverImage from "@/components/books/BookCoverImage";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import BookPreviewCard from "@/components/panel/BookPreviewCard";
import AuthorAvatar from "@/components/reference/AuthorAvatar";
import { Button } from "@/components/ui/button";
import { Carousel } from "@/components/ui/Carousel";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getUserDashboardData,
  getUserReadingInsights,
} from "@/lib/dashboard/service";
import { getLibraryPath } from "@/lib/library/paths";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const [dashboardData, insights] = await Promise.all([
    getUserDashboardData(user.id),
    getUserReadingInsights(user.id),
  ]);

  if (!dashboardData || !insights) {
    notFound();
  }

  const libraryHref = getLibraryPath(dashboardData.profile.username);
  const profileHref = `/${dashboardData.profile.username}`;

  const nextStep =
    dashboardData.stats.totalBooks === 0
      ? {
          text: "اولین کتابت را اضافه کن",
          cta: "افزودن کتاب",
          href: "/books/add",
        }
      : dashboardData.stats.reading > 0
        ? {
            text: "مطالعه‌ات را ادامه بده",
            cta: "ادامه‌ی مطالعه",
            href: "/reading",
          }
        : dashboardData.stats.unread > 0
          ? {
              text: "یکی از کتاب‌های ذخیره‌شده را شروع کن",
              cta: "انتخاب کتاب",
              href: `${libraryHref}?filter=UNREAD`,
            }
          : {
              text: "کتاب تازه‌ای به قفسه اضافه کن",
              cta: "افزودن کتاب",
              href: "/books/add",
            };

  const shortcuts = [
    { label: "افزودن کتاب", href: "/books/add", icon: BookPlus },
    { label: "کتابخانه من", href: libraryHref, icon: LayoutGrid },
    { label: "پروفایل من", href: profileHref, icon: UserRound },
    { label: "تنظیمات", href: "/settings/profile", icon: Settings },
  ];

  const stats = [
    {
      label: "کتاب‌های خوانده‌شده",
      value: insights.overview.finishedBooksCount,
      icon: CheckCircle2,
      tone: "border-emerald-500/15 bg-emerald-500/10 text-emerald-500",
    },
    {
      label: "در حال خواندن",
      value: insights.overview.readingBooksCount,
      icon: Clock3,
      tone: "border-sky-500/15 bg-sky-500/10 text-sky-500",
    },
    {
      label: "کل کتابخانه",
      value: insights.overview.totalBooksCount,
      icon: BookOpen,
      tone: "border-primary/15 bg-primary/10 text-primary",
    },
    {
      label: "صفحات خوانده‌شده",
      value: insights.overview.totalPagesCount.toLocaleString("fa-IR"),
      icon: Sparkles,
      tone: "border-amber-500/15 bg-amber-500/10 text-amber-500",
    },
    {
      label: "میانگین صفحات کتاب",
      value: insights.overview.averagePagesCount.toLocaleString("fa-IR"),
      icon: BarChart3,
      tone: "border-purple-500/15 bg-purple-500/10 text-purple-500",
    },
    {
      label: "نویسندگان خوانده‌شده",
      value: insights.overview.uniqueAuthorsCount,
      icon: Users,
      tone: "border-indigo-500/15 bg-indigo-500/10 text-indigo-500",
    },
    {
      label: "یادداشت‌ها",
      value: insights.overview.notesCount,
      icon: StickyNote,
      tone: "border-pink-500/15 bg-pink-500/10 text-pink-500",
    },
    {
      label: "تکه‌های منتشرشده",
      value: insights.overview.quotesCount,
      icon: QuoteIcon,
      tone: "border-teal-500/15 bg-teal-500/10 text-teal-500",
    },
  ];

  const totalFormats =
    insights.formatDistribution.physical +
    insights.formatDistribution.electronic;

  const physicalPercentage =
    totalFormats > 0
      ? (insights.formatDistribution.physical / totalFormats) * 100
      : 0;

  return (
    <main
      className="
        mx-auto w-full max-w-7xl
        space-y-5 px-3 pb-12 pt-4
        sm:space-y-8 sm:px-6 sm:pb-16 sm:pt-8
        lg:space-y-10 lg:pt-12
      "
      dir="rtl"
    >
      <DashboardHeader
        profile={dashboardData.profile}
        libraryHref={libraryHref}
        profileHref={profileHref}
      />

      {/* Next action */}
      <section
        className="
          relative overflow-hidden rounded-2xl
          border border-primary/15 bg-primary/[0.04]
          p-3.5 shadow-sm
          sm:rounded-3xl sm:p-5
        "
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/35 to-transparent" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="
                flex size-10 shrink-0 items-center justify-center
                rounded-xl bg-primary/10 text-primary
                sm:size-11
              "
            >
              <Sparkles className="size-5" />
            </span>

            <div className="min-w-0">
              <p className="text-[10px] font-medium text-muted-foreground sm:text-xs">
                پیشنهاد بعدی
              </p>
              <p className="mt-0.5 text-sm font-bold leading-6 text-foreground sm:text-[15px]">
                {nextStep.text}
              </p>
            </div>
          </div>

          <Button
            asChild
            className="
              h-10 w-full rounded-xl px-4 text-sm font-bold
              sm:h-9 sm:w-auto sm:min-w-28
            "
          >
            <Link href={nextStep.href}>{nextStep.cta}</Link>
          </Button>
        </div>
      </section>

      {/* Reading profile */}
      {insights.profileInsights.length > 0 && (
        <section
          className="
            relative overflow-hidden rounded-2xl
            border border-border/40 bg-card/20
            p-4 shadow-sm backdrop-blur-sm
            sm:rounded-3xl sm:p-6
            lg:p-8
          "
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-l from-transparent via-primary/25 to-transparent" />

          <div className="flex items-start gap-3 sm:gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-11">
              <Award className="size-5" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black text-foreground sm:text-lg">
                پروفایل کتاب‌خوانی تو
              </h2>

              <div className="mt-3 grid gap-2.5 sm:mt-4">
                {insights.profileInsights.map((insight, index) => (
                  <p
                    key={`${insight}-${index}`}
                    className="
                      flex items-start gap-2
                      text-xs leading-6 text-foreground/80
                      sm:text-sm sm:leading-7
                    "
                  >
                    <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{insight}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
        {/* Overview stats */}
        <section className="min-w-0 lg:col-span-12">
          <div
            className="
              -mx-3 flex snap-x snap-mandatory gap-2.5
              overflow-x-auto px-3 pb-1
              overscroll-x-contain
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden

              sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-3
              sm:overflow-visible sm:px-0 sm:pb-0

              lg:grid-cols-8
            "
          >
            {stats.map((stat) => (
              <DashStatItem
                key={stat.label}
                label={stat.label}
                value={stat.value}
                icon={stat.icon}
                tone={stat.tone}
              />
            ))}
          </div>
        </section>

        {/* Main analytics column */}
        <div className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-8">
          <SectionCard
            title="روند مطالعه ماهانه"
            description="تعداد کتاب‌های تکمیل‌شده در ۱۲ ماه گذشته"
          >
            <ReadingActivityChart data={insights.monthlyActivity} />
          </SectionCard>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <SectionCard
              title="ادبیات مورد علاقه تو"
              description="بیشترین آثار خوانده‌شده بر اساس جغرافیای اثر"
            >
              {insights.favoriteCountries.length === 0 ? (
                <InlineEmpty text="داده‌ای برای تحلیل وجود ندارد." />
              ) : (
                <div className="space-y-4">
                  {insights.favoriteCountries.map((country) => (
                    <MetricBar
                      key={country.name}
                      icon={Globe}
                      label={country.name}
                      value={`${country.count.toLocaleString("fa-IR")} کتاب`}
                      percentage={
                        (country.count /
                          Math.max(
                            insights.favoriteCountries[0]?.count ?? 1,
                            1,
                          )) *
                        100
                      }
                      barClassName="bg-primary/75"
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="ژانرهای ترجیحی"
              description="سهم دسته‌بندی‌های موضوعی در کتابخانه تو"
            >
              {insights.favoriteGenres.length === 0 ? (
                <InlineEmpty text="داده‌ای برای تحلیل وجود ندارد." />
              ) : (
                <div className="space-y-4">
                  {insights.favoriteGenres.map((genre) => (
                    <MetricBar
                      key={genre.name}
                      icon={Tag}
                      label={genre.name}
                      value={`${genre.count.toLocaleString(
                        "fa-IR",
                      )} کتاب (${genre.percentage.toLocaleString("fa-IR")}٪)`}
                      percentage={genre.percentage}
                      barClassName="bg-teal-500/70"
                    />
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <SectionCard
              title="ناشران محبوب"
              description="بیشترین کتاب‌های خوانده‌شده از انتشارات"
            >
              {insights.favoritePublishers.length === 0 ? (
                <InlineEmpty text="داده‌ای برای تحلیل وجود ندارد." />
              ) : (
                <div className="space-y-4">
                  {insights.favoritePublishers.map((publisher) => (
                    <MetricBar
                      key={publisher.name}
                      icon={Archive}
                      label={publisher.name}
                      value={`${publisher.count.toLocaleString(
                        "fa-IR",
                      )} کتاب (${publisher.percentage.toLocaleString(
                        "fa-IR",
                      )}٪)`}
                      percentage={publisher.percentage}
                      barClassName="bg-indigo-500/70"
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="حجم و قالب ترجیحی"
              description="اندازه و قالب‌های ترجیحی کتاب‌های خوانده‌شده"
            >
              <div className="space-y-5">
                <div>
                  <h3 className="mb-2.5 text-xs font-bold text-foreground/80">
                    توزیع حجم صفحات
                  </h3>

                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                    <LengthStat
                      label="کوتاه"
                      description="زیر ۲۰۰ صفحه"
                      value={insights.lengthPreference.short}
                    />
                    <LengthStat
                      label="متوسط"
                      description="۲۰۰ تا ۴۰۰ صفحه"
                      value={insights.lengthPreference.medium}
                    />
                    <LengthStat
                      label="بلند"
                      description="بالای ۴۰۰ صفحه"
                      value={insights.lengthPreference.long}
                    />
                  </div>
                </div>

                <div className="border-t border-border/40 pt-4">
                  <h3 className="mb-3 text-xs font-bold text-foreground/80">
                    قالب کتاب
                  </h3>

                  <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground sm:text-xs">
                    <span className="min-w-0">
                      فیزیکی{" "}
                      <span className="whitespace-nowrap">
                        (
                        {insights.formatDistribution.physical.toLocaleString(
                          "fa-IR",
                        )}{" "}
                        کتاب)
                      </span>
                    </span>

                    <span className="min-w-0 text-left">
                      الکترونیک{" "}
                      <span className="whitespace-nowrap">
                        (
                        {insights.formatDistribution.electronic.toLocaleString(
                          "fa-IR",
                        )}{" "}
                        کتاب)
                      </span>
                    </span>
                  </div>

                  <div className="mt-2.5 flex h-2.5 w-full overflow-hidden rounded-full bg-secondary/30">
                    {totalFormats > 0 ? (
                      <>
                        <div
                          style={{ width: `${physicalPercentage}%` }}
                          className="h-full shrink-0 bg-primary"
                        />
                        <div className="h-full flex-1 bg-sky-500" />
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="min-w-0 space-y-4 sm:space-y-6 lg:col-span-4">
          <SectionCard title="پیوستگی و انضباط مطالعه">
            <div className="space-y-4">
              <div
                className="
                  flex items-center gap-3 rounded-2xl
                  border border-primary/10 bg-primary/5 p-3.5
                "
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Flame className="size-[18px]" />
                </span>

                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground sm:text-xs">
                    ماه‌های با مطالعه فعال
                  </p>
                  <p className="mt-0.5 text-sm font-black text-foreground tabular-nums">
                    {insights.consistency.monthsWithActivity.toLocaleString(
                      "fa-IR",
                    )}{" "}
                    ماه از ۱۲ ماه گذشته
                  </p>
                </div>
              </div>

              <div className="divide-y divide-border/40">
                {insights.consistency.mostActiveMonth && (
                  <InfoRow
                    label="فعال‌ترین ماه مطالعه"
                    value={insights.consistency.mostActiveMonth}
                  />
                )}

                <InfoRow
                  label="کتاب‌های خوانده‌شده در امسال"
                  value={`${insights.consistency.completedThisYear.toLocaleString(
                    "fa-IR",
                  )} کتاب`}
                />

                <InfoRow
                  label="کتاب‌های خوانده‌شده در سال گذشته"
                  value={`${insights.consistency.completedLastYear.toLocaleString(
                    "fa-IR",
                  )} کتاب`}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="امتیازات و ارزیابی تو">
            <RatingDistributionChart
              distribution={insights.ratingStats.distribution}
              averageRating={insights.ratingStats.averageRating}
              ratedCount={insights.ratingStats.ratedCount}
            />
          </SectionCard>

          <SectionCard title="نویسندگان محبوب تو">
            {insights.favoriteAuthors.length === 0 ? (
              <InlineEmpty text="هنوز اطلاعات کافی در دسترس نیست." />
            ) : (
              <>
                <div className="hidden grid-cols-2 gap-3 min-[430px]:grid lg:grid">
                  {insights.favoriteAuthors.map((author) => {
                    const href = author.slug
                      ? `/authors/${encodeURIComponent(author.slug)}`
                      : "#";

                    return (
                      <Link
                        key={author.id}
                        href={href}
                        className="
                          group flex min-w-0 flex-col items-center
                          rounded-2xl border border-border/50
                          bg-background/35 p-3 text-center
                          transition-all duration-200
                          hover:-translate-y-0.5
                          hover:border-primary/25 hover:bg-card/70
                        "
                      >
                        <AuthorAvatar
                          name={author.name}
                          image={author.coverImage}
                          sizeClassName="h-14 w-14 sm:h-16 sm:w-16"
                        />

                        <h3 className="mt-2 w-full truncate text-xs font-black text-foreground transition-colors group-hover:text-primary">
                          {author.name}
                        </h3>

                        <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                          {author.bookCount.toLocaleString("fa-IR")} کتاب
                        </p>
                      </Link>
                    );
                  })}
                </div>

                <div className="min-[430px]:hidden lg:hidden">
                  <Carousel
                    ariaLabel="نویسندگان محبوب تو"
                    slideClassName="basis-[132px]"
                    containerClassName="gap-3"
                    slides={insights.favoriteAuthors.map((author) => {
                      const href = author.slug
                        ? `/authors/${encodeURIComponent(author.slug)}`
                        : "#";

                      return (
                        <Link
                          key={author.id}
                          href={href}
                          className="
                            group flex w-full flex-col items-center
                            rounded-2xl border border-border/50
                            bg-background/35 p-3 text-center
                            transition
                            hover:border-primary/25 hover:bg-card/70
                          "
                        >
                          <AuthorAvatar
                            name={author.name}
                            image={author.coverImage}
                            sizeClassName="h-14 w-14"
                          />

                          <h3 className="mt-2 w-full truncate text-xs font-black text-foreground group-hover:text-primary">
                            {author.name}
                          </h3>

                          <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                            {author.bookCount.toLocaleString("fa-IR")} کتاب
                          </p>
                        </Link>
                      );
                    })}
                  />
                </div>
              </>
            )}
          </SectionCard>

          <SectionCard title="میان‌برها">
            <div className="grid grid-cols-2 gap-2.5">
              {shortcuts.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="
                    group flex min-h-24 flex-col items-center justify-center
                    gap-2 rounded-2xl border border-border/50
                    bg-background/35 px-2 py-3 text-center
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:border-primary/25 hover:bg-card/70
                  "
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                    <item.icon className="size-4" />
                  </span>

                  <span className="text-xs font-bold text-foreground">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </SectionCard>
        </aside>

        {/* Recent completed books */}
        <section className="min-w-0 lg:col-span-12">
          <SectionCard title="کتاب‌های اخیراً خوانده‌شده">
            {insights.recentCompleted.length === 0 ? (
              <MiniEmpty
                text="هنوز کتابی را به وضعیت «خوانده‌شده» منتقل نکرده‌ای."
                ctaLabel="کتابخانه من"
                ctaHref={libraryHref}
              />
            ) : (
              <>
                <div className="hidden gap-4 sm:grid sm:grid-cols-3 lg:grid-cols-6">
                  {insights.recentCompleted.map((book) => {
                    const href = book.slug
                      ? `/book/${encodeURIComponent(book.slug)}`
                      : "#";

                    return (
                      <RecentBookCard
                        key={book.id}
                        href={href}
                        title={book.title}
                        author={book.author}
                        coverImage={book.coverImage}
                        rating={book.rating}
                      />
                    );
                  })}
                </div>

                <div className="sm:hidden">
                  <Carousel
                    ariaLabel="کتاب‌های اخیراً خوانده‌شده"
                    slideClassName="basis-[138px] min-[390px]:basis-[150px]"
                    containerClassName="gap-3"
                    slides={insights.recentCompleted.map((book) => {
                      const href = book.slug
                        ? `/book/${encodeURIComponent(book.slug)}`
                        : "#";

                      return (
                        <RecentBookCard
                          key={book.id}
                          href={href}
                          title={book.title}
                          author={book.author}
                          coverImage={book.coverImage}
                          rating={book.rating}
                        />
                      );
                    })}
                  />
                </div>
              </>
            )}
          </SectionCard>
        </section>

        {/* Currently reading */}
        {dashboardData.currentlyReading.length > 0 && (
          <section className="min-w-0 lg:col-span-12">
            <SectionCard title="در حال خواندن">
              <>
                <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4">
                  {dashboardData.currentlyReading.map((book) => (
                    <BookPreviewCard
                      key={book.id}
                      book={{ ...book, status: "در حال خواندن" }}
                    />
                  ))}
                </div>

                <div className="sm:hidden">
                  <Carousel
                    ariaLabel="کتاب‌های در حال خواندن"
                    slideClassName="basis-[84%] min-[390px]:basis-[76%]"
                    containerClassName="gap-3"
                    slides={dashboardData.currentlyReading.map((book) => (
                      <BookPreviewCard
                        key={book.id}
                        book={{ ...book, status: "در حال خواندن" }}
                      />
                    ))}
                  />
                </div>
              </>
            </SectionCard>
          </section>
        )}
      </div>
    </main>
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
    <article
      className={cn(
        `
          flex min-h-24 min-w-[148px] snap-start
          flex-col justify-between rounded-2xl border
          p-3.5 shadow-sm backdrop-blur-sm

          sm:min-h-[92px] sm:min-w-0 sm:p-3
        `,
        tone,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xl font-black tabular-nums sm:text-lg">
          {value}
        </span>

        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-background/35">
          <Icon className="size-4 opacity-90" />
        </span>
      </div>

      <p className="mt-3 whitespace-nowrap text-[10px] font-bold leading-4 text-muted-foreground/90 sm:truncate">
        {label}
      </p>
    </article>
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
    <section
      className="
        min-w-0 overflow-hidden rounded-2xl
        border border-border/45 bg-card/15
        p-4 shadow-sm backdrop-blur-sm
        sm:p-5
        lg:rounded-3xl
      "
    >
      <header className="mb-4 text-right sm:mb-5">
        <h2 className="text-sm font-black text-foreground sm:text-[15px]">
          {title}
        </h2>

        {description ? (
          <p className="mt-1 text-[10px] leading-5 text-muted-foreground sm:text-xs">
            {description}
          </p>
        ) : null}
      </header>

      {children}
    </section>
  );
}

function InlineEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 bg-background/25 px-3 py-7 text-center">
      <p className="text-xs text-muted-foreground">{text}</p>
    </div>
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
    <div className="rounded-2xl border border-dashed border-border/60 bg-background/30 px-4 py-8 text-center sm:py-10">
      <p className="text-xs leading-6 text-muted-foreground sm:text-sm">
        {text}
      </p>

      {ctaLabel && ctaHref ? (
        <Button
          asChild
          size="sm"
          className="mt-4 h-9 rounded-xl px-4 font-bold"
        >
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function MetricBar({
  icon: Icon,
  label,
  value,
  percentage,
  barClassName,
}: {
  icon: ElementType;
  label: string;
  value: string;
  percentage: number;
  barClassName: string;
}) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 items-start justify-between gap-3 text-xs">
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-foreground">
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
        </span>

        <span className="shrink-0 whitespace-nowrap text-[10px] font-medium text-muted-foreground sm:text-xs">
          {value}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-secondary/30">
        <div
          style={{ width: `${safePercentage}%` }}
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            barClassName,
          )}
        />
      </div>
    </div>
  );
}

function LengthStat({
  label,
  description,
  value,
}: {
  label: string;
  description: string;
  value: number;
}) {
  return (
    <div
      className="
        flex items-center justify-between gap-3
        rounded-xl border border-border/40 bg-background/30
        p-3
        min-[420px]:block min-[420px]:text-center
      "
    >
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-foreground">{label}</p>
        <p className="mt-0.5 text-[9px] text-muted-foreground">{description}</p>
      </div>

      <p className="shrink-0 text-base font-black text-foreground tabular-nums min-[420px]:mt-2">
        {value.toLocaleString("fa-IR")}
      </p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-[11px] leading-5 text-muted-foreground sm:text-xs">
        {label}
      </span>

      <span className="shrink-0 text-left text-[11px] font-bold leading-5 text-foreground tabular-nums sm:text-xs">
        {value}
      </span>
    </div>
  );
}

function RecentBookCard({
  href,
  title,
  author,
  coverImage,
  rating,
}: {
  href: string;
  title: string;
  author: string;
  coverImage?: string | null;
  rating?: number | null;
}) {
  return (
    <Link
      href={href}
      className="
        group flex w-full min-w-0 flex-col
        rounded-2xl border border-border/40
        bg-card/40 p-2.5 shadow-sm
        transition-all duration-300
        hover:-translate-y-1 hover:border-primary/20 hover:bg-card/75
      "
    >
      <div className="relative aspect-[3/4.2] w-full overflow-hidden rounded-xl bg-secondary/20 shadow-sm">
        <BookCoverImage
          src={coverImage || "/placeholder-cover.svg"}
          alt={title}
          fill
          sizes="(max-width: 640px) 150px, (max-width: 1024px) 25vw, 220px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>

      <div className="mt-3 flex min-w-0 flex-1 flex-col text-right">
        <h3 className="line-clamp-2 min-h-9 text-xs font-black leading-[18px] text-foreground transition-colors group-hover:text-primary">
          {title}
        </h3>

        <p className="mt-1 truncate text-[10px] font-semibold text-muted-foreground">
          {author}
        </p>

        {rating ? (
          <div className="mt-1.5 text-[10px] font-black text-amber-500">
            ★ {rating.toLocaleString("fa-IR")} / ۱۰
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function ReadingActivityChart({
  data,
}: {
  data: Array<{ label: string; count: number; pages: number }>;
}) {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <div
      className="
        -mx-1 overflow-x-auto px-1 pb-1
        overscroll-x-contain
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      <div className="min-w-[560px] sm:min-w-0">
        <div className="flex h-48 items-end gap-2 border-b border-border/30 px-1 pb-2 pt-8 sm:h-44 sm:px-2 sm:pt-6">
          {data.map((item, index) => {
            const heightPercent = (item.count / maxCount) * 100;

            return (
              <div
                key={`${item.label}-${index}`}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              >
                <div
                  className="
                    pointer-events-none absolute bottom-full z-20 mb-2
                    hidden min-w-20 rounded-xl border border-border
                    bg-card/95 px-2.5 py-2 text-center text-xs
                    shadow-lg backdrop-blur-xl
                    group-hover:block
                  "
                >
                  <p className="font-bold text-foreground tabular-nums">
                    {item.count.toLocaleString("fa-IR")} کتاب
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                    {item.pages.toLocaleString("fa-IR")} صفحه
                  </p>
                </div>

                {item.count > 0 ? (
                  <span className="mb-1 text-[9px] font-bold text-muted-foreground tabular-nums sm:hidden">
                    {item.count.toLocaleString("fa-IR")}
                  </span>
                ) : null}

                <div
                  style={{ height: `${Math.max(heightPercent, 4)}%` }}
                  className={cn(
                    "w-full rounded-t-md transition-all duration-300",
                    item.count > 0
                      ? "bg-primary/80 group-hover:bg-primary"
                      : "bg-muted/20 group-hover:bg-muted/40",
                  )}
                />
              </div>
            );
          })}
        </div>

        <div className="flex gap-2 px-1 pt-2 sm:px-2">
          {data.map((item, index) => (
            <div
              key={`${item.label}-label-${index}`}
              className="min-w-0 flex-1 truncate text-center text-[9px] text-muted-foreground"
              title={item.label}
            >
              {item.label}
            </div>
          ))}
        </div>
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
  const maxCount = Math.max(...distribution.map((item) => item.count), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl font-black text-foreground tabular-nums">
          {averageRating.toLocaleString("fa-IR")}
        </span>

        <div className="min-w-0 text-right">
          <p className="text-[10px] text-muted-foreground">میانگین امتیازات</p>
          <p className="mt-0.5 text-xs font-bold text-foreground">
            {ratedCount.toLocaleString("fa-IR")} کتاب ثبت‌شده
          </p>
        </div>
      </div>

      <div className="space-y-2 pt-1">
        {distribution
          .slice()
          .reverse()
          .map((item) => {
            const widthPercentage = (item.count / maxCount) * 100;

            return (
              <div
                key={item.rating}
                className="flex items-center gap-2 text-xs"
              >
                <span className="w-9 shrink-0 text-left text-[11px] font-bold text-muted-foreground tabular-nums">
                  {item.rating.toLocaleString("fa-IR")} ★
                </span>

                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-secondary/30">
                  <div
                    style={{ width: `${widthPercentage}%` }}
                    className="h-full rounded-full bg-amber-500/80 transition-[width] duration-500"
                  />
                </div>

                <span className="w-7 shrink-0 text-right text-[11px] font-bold text-foreground/80 tabular-nums">
                  {item.count.toLocaleString("fa-IR")}
                </span>
              </div>
            );
          })}
      </div>
    </div>
  );
}
